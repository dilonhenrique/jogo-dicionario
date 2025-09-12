import { GameState, WordDictionary } from "@/types/game";

type Testing = "none" | "fake" | "vote" | "blame-wrong" | "blame-right";
const testing: Testing = "none";

// FOR TESTS: initialStates
export function getInitialState(hostChooseWord: boolean, word: WordDictionary | null, myId: string) {
  const fakeState: Partial<GameState> = {
    stage: "fake",
    currentRound: word ? {
      word, fakes: []
    } : undefined,
    players: [
      {
        id: "123456",
        isHost: true,
        onlineAt: new Date().toISOString(),
        name: "Antonio",
        points: 6,
      },
      {
        id: "5654654",
        isHost: false,
        onlineAt: new Date().toISOString(),
        name: "Zulmira",
        points: 3,
      },
      {
        id: "654984",
        isHost: false,
        onlineAt: new Date().toISOString(),
        name: "Maria",
        points: 2,
      },
      {
        id: myId,
        isHost: false,
        onlineAt: new Date().toISOString(),
        name: "Francisco",
        points: 3,
      }
    ],
  };
  const voteState: Partial<GameState> = {
    ...fakeState,
    stage: "vote",
    currentRound: !fakeState.currentRound
      ? undefined
      : {
        ...fakeState.currentRound,
        fakes: [
          {
            id: "123456",
            author: {
              id: "123456",
              isHost: true,
              name: "Antonio",
            },
            definition: "Sorvete"
          },
          {
            id: "d4as8d49as8",
            author: {
              id: "5654654",
              isHost: false,
              name: "Zulmira",
            },
            definition: "Goiaba"
          },
          {
            id: "46das4d6a",
            author: {
              id: "654984",
              isHost: false,
              name: "Maria",
            },
            definition: "Azeitona"
          },
          {
            id: "asdasg",
            author: {
              id: myId,
              isHost: false,
              name: "Francisco",
            },
            definition: "Maçã"
          }
        ]
      }
  };
  const blameWrongState: Partial<GameState> = {
    ...voteState,
    stage: "blame",
    votes: [[myId, "46das4d6a"]],
  };
  const blameRightState: Partial<GameState> = {
    ...voteState,
    stage: "blame",
    votes: [[myId, word?.id ?? "46das4d6a"]],
  };

  const initialStates: Record<Testing, Partial<GameState>> = {
    none: {
      stage: hostChooseWord ? "word_pick" : "fake",
      currentRound: word ? { word, fakes: [] } : undefined,
    },
    fake: fakeState,
    vote: voteState,
    "blame-right": blameRightState,
    "blame-wrong": blameWrongState,
  }

  return initialStates[testing];
}