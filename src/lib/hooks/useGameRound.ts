import { FakeWord, SimpleWord, WordRound } from "@/types/game";
import { User } from "@/types/user";
import { useState } from "react";
import { v4 } from "uuid";

export function useGameRound() {
  const [currentRound, setCurrentRound] = useState<WordRound | null>(null);
  const [roundHistory, setRoundHistory] = useState<WordRound[]>([]);

  function checkoutCurrentRound() {
    setCurrentRound(current => {
      if (current) {
        setRoundHistory(history => ([...history, current]));
      }

      return null;
    })
  }

  function startNextRound(word: SimpleWord) {
    setCurrentRound(current => {
      if (current) {
        console.error("Can't start a new round while current still active.");
        return current;
      }

      return {
        word: {
          ...word,
          id: v4(),
          votes: [],
        },
        fakes: [],
      };
    });
  }

  function addNewFake({ definition, author }: { definition: string, author: User }) {
    setCurrentRound(current => {
      if (!current) {
        console.error("Can't add a guess to a not started round.");
        return current;
      }

      const newFake: FakeWord = {
        id: v4(),
        author,
        definition,
        label: current.word.definition,
        votes: [],
      }

      return {
        ...current,
        fakes: [...current.fakes, newFake]
      };
    });
  }

  function voteInDefinition({ definitionId, user }: { definitionId: string, user: User }) {
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

  return {
    currentRound,
    roundHistory,
    startNextRound,
    checkoutCurrentRound,
    addNewFake,
    voteInDefinition,
  };
}