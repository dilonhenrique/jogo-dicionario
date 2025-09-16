"use client";

import { createContext, PropsWithChildren, useCallback, useContext, useEffect } from "react";
import { GamePlayer } from "@/types/user";
import { GameConfig, GameStage, GameState, GameVotes, SimpleWord, WordRound } from "@/types/game";
import { useRoomChannel } from "./RoomContext";
import useGameController from "../hooks/useGameController";
import { useLatest } from "../hooks/useLatest";
import useFirstRender from "../hooks/useFirstRender";

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
    setWordAndStartFakeStage,
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

  useFirstRender(() => {
    channel.send({
      type: "broadcast",
      event: "start-game",
      payload: { configs, initialState },
    })
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

  const actions = {
    setWordAndStartFakeStage,
    addFakeWord,
    vote,
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