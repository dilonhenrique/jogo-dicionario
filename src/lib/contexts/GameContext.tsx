"use client";

import { createContext, PropsWithChildren, useCallback, useContext, useEffect } from "react";
import { GamePlayer } from "@/types/user";
import { GameConfig, GameStage, SimpleWord, WordRound } from "@/types/game";
import { useRoomChannel } from "./RoomContext";
import useGameController from "../hooks/useGameController";

type GameContextValue = {
  stage: GameStage;
  players: GamePlayer[];
  configs: GameConfig;
  currentRound: WordRound | null;
  roundHistory: WordRound[];
  actions: {
    startGame: () => void;
    setWordAndStartNewRound: (word: SimpleWord) => void;
    addFakeWord: (definition: string) => void;
    vote: (definitionId: string) => void;
  }
}

const GameContext = createContext<GameContextValue>({} as GameContextValue);

type Props = PropsWithChildren & {
  configs: GameConfig;
}

function GameProvider({ children, configs }: Props) {
  const { currentUser } = useRoomChannel();

  const {
    stage,
    changeStage,
    players,
    currentRound,
    roundHistory,
    votes,
    setWordAndStartNewRound,
    addFakeWordForUser,
    addVoteForUser,
  } = useGameController();

  const playingPlayers = players.filter(p => p.onlineAt !== null);

  function startGame() {
    changeStage("word_pick");
  }

  function addFakeWord(definition: string) {
    addFakeWordForUser({ definition, author: currentUser, });
  }

  const checkIfEverybodyAddedFake = useCallback(() => {
    if (!currentRound) return;

    const totalPlaying = playingPlayers.length;
    const totalFakes = currentRound.fakes.length;

    if (totalPlaying > 1 && totalFakes >= totalPlaying) {
      changeStage("vote");
    }
  }, [currentRound, playingPlayers, changeStage])

  const checkIfEverybodyVoted = useCallback(() => {
    if (!currentRound) return;

    const totalPlaying = playingPlayers.length;
    const totalVotes = votes.size;

    if (totalPlaying > 1 && totalVotes >= totalPlaying) {
      changeStage("blame");
    }
  }, [currentRound, playingPlayers.length, votes.size, changeStage])

  useEffect(() => {
    if (stage === "fake") checkIfEverybodyAddedFake();
    if (stage === "vote") checkIfEverybodyVoted();
  }, [checkIfEverybodyAddedFake, checkIfEverybodyVoted, stage])

  function vote(definitionId: string) {
    addVoteForUser({ definitionId, user: currentUser });
  }

  const actions = {
    startGame,
    setWordAndStartNewRound,
    addFakeWord,
    vote,
  }

  return (<GameContext.Provider
    value={{
      stage,
      players,
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