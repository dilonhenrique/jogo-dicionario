import { shuffle } from "lodash";
import { useGame } from "@/lib/contexts/GameContext"

export default function VoteStage() {
  const { currentRound } = useGame();

  if (!currentRound) return <></>;

  const allDefinitions = [currentRound.word, ...currentRound.fakes];

  return (
    <ul className="flex flex-col gap-2">
      {shuffle(allDefinitions).map(word => (
        <li key={word.id}>
          {word.definition}
        </li>
      ))}
    </ul>
  )
}