import { FakeWord, SimpleWord, WordDefinition, WordRound } from "@/types/game";
import { User } from "@/types/user";
import { useState } from "react";
import { v4 } from "uuid";
import { useRoomChannel } from "../contexts/RoomContext";
import useFirstRender from "./useFirstRender";

export function useGameRound() {
  const [currentRound, setCurrentRound] = useState<WordRound | null>(null);
  const [roundHistory, setRoundHistory] = useState<WordRound[]>([]);

  const { channel } = useRoomChannel();

  useFirstRender(() => {
    channel
      .on("broadcast", { event: "checkout-round" }, applyCheckoutCurrentRound)
      .on("broadcast", { event: "new-fake" }, ({ payload: { fake } }) => applyAddNewFake(fake))
      .on("broadcast", { event: "new-vote" }, ({ payload: { vote } }) => applyVoteInDefinition(vote))
  })

  function applyCheckoutCurrentRound() {
    setCurrentRound(current => {
      if (current) {
        setRoundHistory(history => ([...history, current]));
      }

      return null;
    })
  }

  function checkoutCurrentRound() {
    applyCheckoutCurrentRound();
    channel.send({ type: "broadcast", event: "checkout-round" });
  }

  function startNextRound(word: WordDefinition) {
    const definition = {
      word,
      fakes: [],
    };

    setCurrentRound(current => {
      if (current) {
        console.error("Can't start a new round while current still active.");
        return current;
      }

      return definition;
    });
  }

  function applyAddNewFake(fake: Omit<FakeWord, "label">) {
    setCurrentRound(current => {
      if (!current) {
        console.error("Can't add a guess to a not started round.");
        return current;
      }

      return {
        ...current,
        fakes: [...current.fakes, { ...fake, label: current.word.label }]
      };
    });
  }

  function addNewFake({ author, definition }: { definition: string, author: User }) {
    const fake: Omit<FakeWord, "label"> = {
      id: v4(),
      author,
      definition,
      votes: [],
    };

    applyAddNewFake(fake);
    channel.send({ type: "broadcast", event: "new-fake", payload: { fake } });
  }

  function applyVoteInDefinition({ definitionId, user }: { definitionId: string, user: User }) {
    setCurrentRound(current => {
      if (!current) {
        console.error("Can't vote in a not started round.");
        return current;
      }

      const isRightVote = current.word.id === definitionId;

      return {
        ...current,
        word: isRightVote
          ? { ...current.word, votes: [...current.word.votes, user] }
          : current.word,
        fakes: isRightVote
          ? [...current.fakes]
          : current.fakes.map((guess) => (
            {
              ...guess,
              votes: guess.id === definitionId
                ? [...guess.votes, user]
                : guess.votes
            }
          ))
      };
    });
  }

  function voteInDefinition(vote: { definitionId: string, user: User }) {
    applyVoteInDefinition(vote);
    channel.send({ type: "broadcast", event: "new-vote", payload: { vote } });
  }

  return {
    currentRound,
    roundHistory,
    startNextRound,
    checkoutCurrentRound,
    addNewFake,
    voteInDefinition,
  };
}