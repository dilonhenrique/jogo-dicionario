import { FakeWord, GameConfig, GameStage, GameState, SimpleWord, WordDictionary } from "@/types/game";
import { useDispatcher } from "./useDispatcher";
import { useGamePlayers } from "./useGamePlayers";
import { useGameRound } from "./useGameRound";
import { useGameStage } from "./useGameStage";
import { v4 } from "uuid";
import { User } from "@/types/user";
import { dictionaryService } from "@/server/services/dictionary";
import { useSession } from "../contexts/SessionContext";
import { addToast } from "@heroui/react";

export default function useGameController(configs: GameConfig, initialState?: Partial<GameState>) {
  const { user } = useSession();
  const { stage, setStage } = useGameStage(initialState?.stage);
  const { players, increasePointToPlayer, resetPoints, removePlayer } = useGamePlayers(initialState?.players);
  const {
    currentRound,
    roundHistory,
    votes,
    setNewWordAndResetVotes,
    pushFakeWord,
    removeFakeWordFromUser,
    putCurrentRoundInHistory,
    pushVote,
    removeVote,
    resetHistory,
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
      const [newWord] = await dictionaryService.getNewRandomWord();
      setNewWordAndResetVotes(newWord);
      setStage("fake");
    }
  }

  const checkoutCurrentRound = useDispatcher<void>({
    event: 'checkout-round',
    apply: () => {
      putCurrentRoundInHistory();

      if (configs.enableMaxPoints && players.some(p => p.points >= configs.maxPoints)) {
        setStage("finishing");
      } else {
        startNewRound();
      }
    },
    mapInput: () => undefined,
  });

  const addFakeWordForUser = useDispatcher<{ definition: string, author: User }, FakeWord>({
    event: 'new-fake',
    apply: pushFakeWord,
    mapInput: (input) => ({ ...input, id: v4() }),
  })

  const removeFakeWordForUser = useDispatcher<string>({
    event: 'remove-fake',
    apply: removeFakeWordFromUser,
  })

  const addVoteForUser = useDispatcher<{ definitionId: string, user: User }>({
    event: 'new-vote',
    apply: pushVote,
  })

  const removeVoteForUser = useDispatcher<string>({
    event: 'remove-vote',
    apply: removeVote,
  })

  const restartGame = useDispatcher<void>({
    event: 'restart-game',
    apply: () => {
      resetPoints();
      resetHistory();
      startNewRound();
    },
    mapInput: () => undefined,
  })

  const kickPlayer = useDispatcher<string>({
    event: 'kick-player',
    apply: (userId) => {
      removePlayer(userId);
      if (userId === user.id) {
        addToast({
          title: "Você foi removido da partida",
          color: "danger",
        })
      }
    }
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
    removeFakeWordForUser,
    calculateRoundPoints,
    addVoteForUser,
    removeVoteForUser,
    restartGame,
    kickPlayer,
  };
}