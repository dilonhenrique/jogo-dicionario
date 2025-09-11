import { FakeWord, WordDictionary, WordRound } from "@/types/game";
import { User } from "@/types/user";
import { useState } from "react";
import { useMap } from "usehooks-ts";

type Props = {
  currentRound?: WordRound | null;
  roundHistory?: WordRound[];
  votes?: [string, string][];
}

export function useGameRound(initialState: Props) {
  const [currentRound, setCurrentRound] = useState<WordRound | null>(initialState.currentRound ?? null);
  const [roundHistory, setRoundHistory] = useState<WordRound[]>(initialState.roundHistory ?? []);
  const [voteMap, voteActions] = useMap<string, string>(initialState.votes);

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
    voteActions.reset();
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
    if (!currentRound) {
      console.warn("Can't vote in a not started round.");
      return null;
    }

    // already voted in this definition
    if (voteMap.get(user.id) === definitionId) {
      console.log("Vote already computed.");
      return null;
    }

    voteActions.set(user.id, definitionId);
  }

  return {
    currentRound,
    roundHistory,
    votes: voteMap,
    startNextRound,
    putCurrentRoundInHistory,
    pushFakeWord,
    pushVote,
  };
}