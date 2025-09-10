import { FakeWord, WordDictionary, WordRound } from "@/types/game";
import { User } from "@/types/user";
import { useState } from "react";

export function useGameRound() {
  const [currentRound, setCurrentRound] = useState<WordRound | null>(null);
  const [roundHistory, setRoundHistory] = useState<WordRound[]>([]);

  function putCurrentRoundInHistory() {
    setCurrentRound(current => {
      if (current) {
        setRoundHistory(history => ([...history, current]));
      }

      return null;
    })
  }

  function startNextRound(word: WordDictionary) {
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

  function pushFakeWord(fake: FakeWord) {
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

  function pushVote({ definitionId, user }: { definitionId: string, user: User }) {
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
    putCurrentRoundInHistory,
    pushFakeWord,
    pushVote,
  };
}