"use client";

import { createContext, PropsWithChildren, useCallback, useContext, useEffect } from "react";
import { GamePlayer } from "@/types/user";
import { GameConfig, GameStage, GameState, GameVotes, SimpleWord, WordRound } from "@/types/game";
import { useRoomChannel } from "./RoomContext";
import useGameController from "../hooks/useGameController";
import { useLatest } from "../hooks/useLatest";
import useFirstRender from "../hooks/useFirstRender";
import { gameSessionService } from "@/server/services/gameSession";
import { useSession } from "./SessionContext";

type GameContextValue = {
  stage: GameStage;
  players: GamePlayer[];
  votes: GameVotes;
  configs: GameConfig;
  currentRound: WordRound | null;
  roundHistory: WordRound[];
  actions: {
    setWordAndStartFakeStage: (word: SimpleWord) => void;
    addFakeWord: (definition: string) => void;
    removeFakeWord: () => void;
    vote: (definitionId: string) => void;
    removeVote: () => void;
    checkoutCurrentRound: () => void;
    restartGame: () => void;
    kickPlayer: (userId: string) => void;
  }
}

const GameContext = createContext<GameContextValue>({} as GameContextValue);

type Props = PropsWithChildren & {
  configs: GameConfig;
  initialState?: Partial<GameState>;
}

function GameProvider({ children, configs, initialState }: Props) {
  const { user: currentUser } = useSession();
  const { channel, code, amIHost, updateGameState } = useRoomChannel();

  const {
    stage,
    changeStage,
    players,
    currentRound,
    roundHistory,
    votes,
    setWordAndStartFakeStage,
    addFakeWordForUser,
    removeFakeWordForUser,
    addVoteForUser,
    removeVoteForUser,
    calculateRoundPoints,
    checkoutCurrentRound,
    restartGame,
    kickPlayer,
    updateGameState: updateGameStateController,
  } = useGameController(configs, initialState);

  const amIHostLatest = useLatest(amIHost);
  const gameState = useLatest<GameState>({
    players,
    stage,
    currentRound,
    roundHistory,
    votes: Array.from(votes.entries()),
  });

  useFirstRender(() => {
    channel.send({
      type: "broadcast",
      event: "start-game",
      payload: { configs, initialState },
    });

    updateGameState.current = updateGameStateController;
  });

  useEffect(() => {
    if (amIHostLatest.current) {
      const saveState = async () => {
        try {
          await gameSessionService.updateState(code, gameState.current);
        } catch (error) {
          console.error("Erro ao salvar estado do jogo:", error);
        }
      };

      const timeoutId = setTimeout(saveState, 500);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, currentRound, votes, code, gameState]);

  function addFakeWord(definition: string) {
    addFakeWordForUser({ definition, author: currentUser, });
  }

  function removeFakeWord() {
    removeFakeWordForUser(currentUser.id);
  }

  const checkIfEverybodyAddedFake = useCallback(() => {
    if (!currentRound) return;

    const totalAnswered = players.map(p => currentRound?.fakes
      .some(f => f.author.id === p.id) ?? false)
      .filter(Boolean).length;

    if (totalAnswered >= players.length) {
      changeStage("vote");
    }
  }, [currentRound, players, changeStage])

  const checkIfEverybodyVoted = useCallback(() => {
    if (!currentRound) return;

    const totalVotes = players.map(p => votes.has(p.id)).filter(Boolean).length;

    if (totalVotes >= players.length) {
      calculateRoundPoints();
      changeStage("blame");
    }
  }, [currentRound, players, votes, changeStage, calculateRoundPoints])

  useEffect(() => {
    if (stage === "fake") checkIfEverybodyAddedFake();
    if (stage === "vote") checkIfEverybodyVoted();
  }, [checkIfEverybodyAddedFake, checkIfEverybodyVoted, stage])

  function vote(definitionId: string) {
    addVoteForUser({ definitionId, user: currentUser });
  }

  function removeVote() {
    removeVoteForUser(currentUser.id);
  }

  const actions = {
    setWordAndStartFakeStage,
    addFakeWord,
    removeFakeWord,
    vote,
    removeVote,
    checkoutCurrentRound,
    restartGame,
    kickPlayer,
  }

  return (<GameContext.Provider
    value={{
      stage,
      players,
      votes,
      currentRound,
      roundHistory,
      configs,
      actions,
    }}
  >
    {children}
  </GameContext.Provider>)
}

function useGame() {
  return useContext(GameContext);
}

export { GameProvider, useGame }