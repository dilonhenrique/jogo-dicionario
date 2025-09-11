import { FakeWord, GameStage, GameState, SimpleWord, WordDictionary } from "@/types/game";
import { useDispatcher } from "./useDispatcher";
import { useGamePlayers } from "./useGamePlayers";
import { useGameRound } from "./useGameRound";
import { useGameStage } from "./useGameStage";
import { v4 } from "uuid";
import { User } from "@/types/user";

export default function useGameController(initialState?: Partial<GameState>) {
  const { stage, setStage } = useGameStage(initialState?.stage);
  const { players, increasePointToPlayer } = useGamePlayers(initialState?.players);
  const {
    currentRound,
    roundHistory,
    votes,
    startNextRound,
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

  const setWordAndStartNewRound = useDispatcher<SimpleWord, WordDictionary>({
    event: 'start-round',
    apply: (word) => {
      startNextRound(word);
      setStage("fake");
    },
    mapInput: (input) => ({ ...input, id: v4() }),
  });

  const checkoutCurrentRound = useDispatcher({
    event: 'checkout-round',
    apply: () => {
      putCurrentRoundInHistory();
      setStage("word_pick");
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
    setWordAndStartNewRound,
    checkoutCurrentRound,
    addFakeWordForUser,
    addVoteForUser,
    calculateRoundPoints,
  };
}