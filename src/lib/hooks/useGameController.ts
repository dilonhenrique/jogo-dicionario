import { FakeWord, GameStage, SimpleWord, WordDictionary } from "@/types/game";
import { useDispatcher } from "./useDispatcher";
import { useGamePlayers } from "./useGamePlayers";
import { useGameRound } from "./useGameRound";
import { useGameStage } from "./useGameStage";
import { v4 } from "uuid";
import { User } from "@/types/user";

export default function useGameController() {
  const { stage, setStage } = useGameStage();
  const { players } = useGamePlayers();
  const { currentRound, roundHistory, startNextRound, pushFakeWord, pushVote, putCurrentRoundInHistory } = useGameRound();

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
    mapInput: (input) => ({ ...input, id: v4(), votes: [] }),
  });

  const checkoutCurrentRound = useDispatcher({
    event: 'checkout-round',
    apply: putCurrentRoundInHistory,
  });

  const addFakeWordForUser = useDispatcher<{ definition: string, author: User }, FakeWord>({
    event: 'new-fake',
    apply: pushFakeWord,
    mapInput: (input) => ({ ...input, id: v4(), votes: [] }),
  })

  const addVoteForUser = useDispatcher<{ definitionId: string, user: User }>({
    event: 'new-vote',
    apply: pushVote,
  })

  return {
    stage,
    changeStage,
    players,
    currentRound,
    roundHistory,
    setWordAndStartNewRound,
    checkoutCurrentRound,
    addFakeWordForUser,
    addVoteForUser,
  };
}