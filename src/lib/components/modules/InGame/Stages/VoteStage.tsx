import { shuffle } from "lodash";
import { useGame } from "@/lib/contexts/GameContext"
import { useRoomChannel } from "@/lib/contexts/RoomContext";
import { Button, Form, Radio, RadioGroup } from "@heroui/react";

export default function VoteStage() {
  const { currentUser } = useRoomChannel();
  const { currentRound, actions } = useGame();

  if (!currentRound) return <></>;

  const allDefinitions = [
    currentRound.word,
    ...currentRound.fakes.filter(w => w.author.id !== currentUser.id)
  ];

  return (
    <Form
      action={(formData) => {
        const { vote } = Object.fromEntries(formData);

        if (typeof vote === "string") {
          actions.vote(vote);
        }
      }}
    >
      <h3>{currentRound.word.label}</h3>

      <RadioGroup name="vote">
        {shuffle(allDefinitions).map(word => (
          <Radio key={word.id} value={word.id}>
            {word.definition}
          </Radio>
        ))}
      </RadioGroup>

      <Button type="submit">Votar</Button>
    </Form>
  )
}