"use client";

import { createContext, PropsWithChildren, useCallback, useContext, useEffect } from "react";
import { GamePlayer } from "@/types/user";
import { GameConfig, GameStage, GameState, SimpleWord, WordRound } from "@/types/game";
import { useRoomChannel } from "./RoomContext";
import useGameController from "../hooks/useGameController";
import { useLatest } from "../hooks/useLatest";

type GameContextValue = {
  stage: GameStage;
  players: GamePlayer[];
  configs: GameConfig;
  currentRound: WordRound | null;
  roundHistory: WordRound[];
  actions: {
    setWordAndStartNewRound: (word: SimpleWord) => void;
    addFakeWord: (definition: string) => void;
    vote: (definitionId: string) => void;
    checkoutCurrentRound: () => void;
  }
}

const GameContext = createContext<GameContextValue>({} as GameContextValue);

type Props = PropsWithChildren & {
  configs: GameConfig;
  initialState?: Partial<GameState>;
}

function GameProvider({ children, configs, initialState }: Props) {
  const { currentUser, channel } = useRoomChannel();

  const {
    stage,
    changeStage,
    players,
    currentRound,
    roundHistory,
    votes,
    setWordAndStartFakeStage: setWordAndStartNewRound,
    addFakeWordForUser,
    addVoteForUser,
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

  useEffect(() => {
    channel.on(
      'broadcast',
      { event: 'state-request' },
      ({ payload }) => {
        if (userLatest.current.isHost) {
          channel.send({
            type: "broadcast", event: "game-state", payload: {
              to: payload.replyTo,
              ...gameState.current,
            }
          })
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel])

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

  const actions = {
    setWordAndStartNewRound,
    addFakeWord,
    vote,
    checkoutCurrentRound,
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