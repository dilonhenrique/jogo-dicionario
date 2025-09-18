"use client";

import { createContext, PropsWithChildren, useCallback, useContext, useEffect } from "react";
import { GamePlayer } from "@/types/user";
import { GameConfig, GameStage, GameState, GameVotes, SimpleWord, WordRound } from "@/types/game";
import { useRoomChannel } from "./RoomContext";
import useGameController from "../hooks/useGameController";
import { useLatest } from "../hooks/useLatest";
import useFirstRender from "../hooks/useFirstRender";
import { updateGameState } from "@/server/services/gameSession/gameSession.service";
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
  }
}

const GameContext = createContext<GameContextValue>({} as GameContextValue);

type Props = PropsWithChildren & {
  configs: GameConfig;
  initialState?: Partial<GameState>;
}

function GameProvider({ children, configs, initialState }: Props) {
  const { user: currentUser } = useSession();
  const { channel, code } = useRoomChannel();

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
  } = useGameController(configs, initialState);

  const playingPlayers = players.filter(p => p.onlineAt !== null);

  const userLatest = useLatest(currentUser);
  const gameState = useLatest<GameState>({
    players,
    stage,
    currentRound,
    roundHistory,
    votes: Array.from(votes.entries()),
  })

  useFirstRender(() => {
    channel.send({
      type: "broadcast",
      event: "start-game",
      payload: { configs, initialState },
    })
  })

  useEffect(() => {
    if (userLatest.current.isHost) {
      const saveState = async () => {
        try {
          await updateGameState(code, gameState.current);
        } catch (error) {
          console.error("Erro ao salvar estado do jogo:", error);
        }
      };

      const timeoutId = setTimeout(saveState, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [stage, currentRound, votes, code, userLatest, gameState]);

  function addFakeWord(definition: string) {
    addFakeWordForUser({ definition, author: currentUser, });
  }

  function removeFakeWord() {
    removeFakeWordForUser(currentUser.id);
  }

  const checkIfEverybodyAddedFake = useCallback(() => {
    if (!currentRound) return;

    const totalAnswered = playingPlayers.map(p => currentRound?.fakes
      .some(f => f.author.id === p.id) ?? false)
      .filter(Boolean).length;

    if (totalAnswered >= playingPlayers.length) {
      changeStage("vote");
    }
  }, [currentRound, playingPlayers, changeStage])

  const checkIfEverybodyVoted = useCallback(() => {
    if (!currentRound) return;

    const totalVotes = playingPlayers.map(p => votes.has(p.id)).filter(Boolean).length;

    if (totalVotes >= playingPlayers.length) {
      calculateRoundPoints();
      changeStage("blame");
    }
  }, [currentRound, playingPlayers, votes, changeStage, calculateRoundPoints])

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