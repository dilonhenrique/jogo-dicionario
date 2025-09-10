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
    let success = true;
    const definition = {
      word,
      fakes: [],
    };

    setCurrentRound(current => {
      if (current) {
        console.warn("Can't start a new round while current still active.");
        success = false;
        return current;
      }

      return definition;
    });

    if (!success) return null;
  }

  function pushFakeWord(fake: FakeWord) {
    let success = true;

    setCurrentRound(current => {
      if (!current) {
        console.warn("Can't add a fake to a not started round.");
        success = false;
        return current;
      }

      const existingFake = current.fakes.find(f => f.id === fake.id);

      if (existingFake) {
        console.log("Fake already added.");
        success = false;
        return current;
      }

      return {
        ...current,
        fakes: [...current.fakes, { ...fake, label: current.word.label }]
      };
    });

    if (!success) return null;
  }

  function pushVote({ definitionId, user }: { definitionId: string, user: User }) {
    let success = true;

    setCurrentRound(current => {
      if (!current) {
        console.warn("Can't vote in a not started round.");
        success = false;
        return current;
      }

      const isRightVote = current.word.id === definitionId;

      const votes = isRightVote ? current.word.votes : current.fakes.flatMap(f => f.votes);
      const existingVote = votes.find(u => u.id === user.id);

      if (existingVote) {
        console.log("Vote already computed.");
        success = false;
        return current;
      }

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

    if (!success) return null;
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