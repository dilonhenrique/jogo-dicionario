import { FakeWord, GameConfig, GameStage, GameState, SimpleWord, WordDictionary } from "@/types/game";
import { useDispatcher } from "./useDispatcher";
import { useGamePlayers } from "./useGamePlayers";
import { useGameRound } from "./useGameRound";
import { useGameStage } from "./useGameStage";
import { v4 } from "uuid";
import { User } from "@/types/user";
import { getNewRandomWord } from "@/server/dictionary/dictionaty.service";

export default function useGameController(configs: GameConfig, initialState?: Partial<GameState>) {
  const { stage, setStage } = useGameStage(initialState?.stage);
  const { players, increasePointToPlayer } = useGamePlayers(initialState?.players);
  const {
    currentRound,
    roundHistory,
    votes,
    setNewWordAndResetVotes,
    pushFakeWord,
    pushVote,
    putCurrentRoundInHistory,
  } = useGameRound({
    currentRound: initialState?.currentRound,
    roundHistory: initialState?.roundHistory,
    votes: initialState?.votes,
  });

  const changeStage = useDispatcher<GameStage>({
    event: 'stage-change',
    apply: setStage,
  });

  const setWordAndStartFakeStage = useDispatcher<SimpleWord, WordDictionary>({
    event: 'set-word',
    apply: (word) => {
      setNewWordAndResetVotes(word);
      setStage("fake");
    },
    mapInput: (input) => ({ ...input, id: v4() }),
  });

  async function startNewRound() {
    if (configs.enableHostChooseWord) {
      setStage("word_pick");
    } else {
      const newWord = await getNewRandomWord();
      setNewWordAndResetVotes(newWord);
      setStage("fake");
    }
  }

  const checkoutCurrentRound = useDispatcher({
    event: 'checkout-round',
    apply: () => {
      putCurrentRoundInHistory();
      startNewRound();
    },
  }) as () => void;

  const addFakeWordForUser = useDispatcher<{ definition: string, author: User }, FakeWord>({
    event: 'new-fake',
    apply: pushFakeWord,
    mapInput: (input) => ({ ...input, id: v4() }),
  })

  const addVoteForUser = useDispatcher<{ definitionId: string, user: User }>({
    event: 'new-vote',
    apply: pushVote,
  })

  function calculateRoundPoints() {
    if (currentRound) {
      const votePairs = Array.from(votes.entries());

      for (const [userId, defId] of votePairs) {
        if (defId === currentRound.word.id) {
          // guessed right
          increasePointToPlayer(userId);
        } else {
          // guessed wrong
          const word = currentRound.fakes.find(f => f.id === defId);
          if (word?.author) {
            increasePointToPlayer(word.author.id);
          }
        }
      }
    }
  }

  return {
    stage,
    changeStage,
    players,
    currentRound,
    roundHistory,
    votes,
    setWordAndStartFakeStage,
    checkoutCurrentRound,
    addFakeWordForUser,
    addVoteForUser,
    calculateRoundPoints,
  };
}