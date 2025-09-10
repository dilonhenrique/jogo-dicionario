"use client";

import { createContext, PropsWithChildren, useCallback, useContext, useEffect } from "react";
import { GamePlayer } from "@/types/user";
import { GameConfig, GameStage, SimpleWord, WordDefinition, WordRound } from "@/types/game";
import { useGameStage } from "../hooks/useGameStage";
import { useGamePlayers } from "../hooks/useGamePlayers";
import { useGameRound } from "../hooks/useGameRound";
import { useRoomChannel } from "./RoomContext";
import { v4 } from "uuid";
import useFirstRender from "../hooks/useFirstRender";

type GameContextValue = {
  stage: GameStage;
  players: GamePlayer[];
  configs: GameConfig;
  currentRound: WordRound | null;
  roundHistory: WordRound[];
  actions: {
    startGame: () => void;
    setWordForNextRound: (word: SimpleWord) => void;
    addNewFakeWord: (definition: string) => void;
    vote: (definitionId: string) => void;
  }
}

const GameContext = createContext<GameContextValue>({} as GameContextValue);

type Props = PropsWithChildren & {
  configs: GameConfig;
}

function GameProvider({ children, configs }: Props) {
  const { currentUser, channel } = useRoomChannel();

  const { stage, setStage } = useGameStage();
  const { players } = useGamePlayers();
  const { currentRound, roundHistory, startNextRound, addNewFake, voteInDefinition } = useGameRound();

  const playingPlayers = players.filter(p => p.onlineAt !== null);

  useFirstRender(() => {
    channel.on("broadcast", { event: "start-round" }, ({ payload: { word } }) => applySetWordForNextRound(word))
  })

  function startGame() {
    setStage("word_pick");
  }

  function applySetWordForNextRound(word: WordDefinition) {
    startNextRound(word);
    setStage("definition");
  }

  function setWordForNextRound(input: SimpleWord) {
    const word: WordDefinition = { ...input, id: v4(), votes: [] };

    applySetWordForNextRound(word);
    channel.send({ type: "broadcast", event: "start-round", payload: { word } });
  }

  function addNewFakeWord(definition: string) {
    addNewFake({ definition, author: currentUser, });
  }

  const checkIfEverybodyAddedFake = useCallback(() => {
    if (!currentRound) return;

    const totalPlaying = playingPlayers.length;
    const totalFakes = currentRound.fakes.length;

    if (totalPlaying > 1 && totalFakes >= totalPlaying) {
      setStage("guess");
    }
  }, [currentRound, playingPlayers, setStage])

  const checkIfEverybodyVoted = useCallback(() => {
    if (!currentRound) return;

    const totalPlaying = playingPlayers.length;
    const totalVotes = currentRound.word.votes.length + currentRound.fakes.reduce((acc, arr) => acc + arr.votes.length, 0);

    if (totalPlaying > 1 && totalVotes >= totalPlaying) {
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
    startGame,
    setWordForNextRound,
    addNewFakeWord,
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