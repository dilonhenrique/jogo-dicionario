"use client";

import { createContext, PropsWithChildren, useCallback, useContext, useEffect } from "react";
import { GamePlayer } from "@/types/user";
import { GameConfig, GameStage, WordDefinition, WordRound } from "@/types/game";
import { useGameStage } from "../hooks/useGameStage";
import { useGamePlayers } from "../hooks/useGamePlayers";
import { useGameRound } from "../hooks/useGameRound";
import { useRoomChannel } from "./RoomContext";

type GameContextValue = {
  stage: GameStage;
  players: GamePlayer[];
  configs: GameConfig;
  currentRound: WordRound | null;
  roundHistory: WordRound[];
  actions: {
    setWordForNextRound: (word: WordDefinition) => void;
    addNewFakeWord: (definition: string) => void;
    vote: (definitionId: string) => void;
  }
}

const defaultConfig: GameConfig = {
  maxPoints: 5,
}

const GameContext = createContext<GameContextValue>({} as GameContextValue);

function GameProvider({ children }: PropsWithChildren) {
  const { currentUser } = useRoomChannel();

  const { stage, setStage } = useGameStage();
  const { players } = useGamePlayers();
  const { currentRound, roundHistory, startNextRound, addNewFake, voteInDefinition } = useGameRound();

  const playingPlayers = players.filter(p => p.onlineAt !== null);

  function setWordForNextRound(word: WordDefinition) {
    startNextRound({ word, fakes: [] });
    setStage("definition");
  }

  function addNewFakeWord(definition: string) {
    addNewFake({ definition, author: currentUser, });
  }

  const checkIfEverybodyAddedFake = useCallback(() => {
    if (!currentRound) return;

    const totalPlaying = playingPlayers.length;
    const totalFakes = currentRound.fakes.length;

    if (totalFakes >= totalPlaying) {
      setStage("guess");
    }
  }, [currentRound, playingPlayers, setStage])

  const checkIfEverybodyVoted = useCallback(() => {
    if (!currentRound) return;

    const totalPlaying = playingPlayers.length;
    const totalVotes = currentRound.word.votes.length + currentRound.fakes.reduce((acc, arr) => acc + arr.votes.length, 0);

    if (totalVotes >= totalPlaying) {
      setStage("result");
    }
  }, [currentRound, playingPlayers, setStage])

  useEffect(() => {
    if (stage === "definition") checkIfEverybodyAddedFake();
    if (stage === "guess") checkIfEverybodyVoted();
  }, [checkIfEverybodyAddedFake, checkIfEverybodyVoted, stage])

  function vote(definitionId: string) {
    voteInDefinition({ definitionId, user: currentUser });
  }

  const actions = {
    setWordForNextRound,
    addNewFakeWord,
    vote,
  }

  return (<GameContext.Provider
    value={{
      stage,
      players,
      configs: defaultConfig,
      currentRound,
      roundHistory,
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