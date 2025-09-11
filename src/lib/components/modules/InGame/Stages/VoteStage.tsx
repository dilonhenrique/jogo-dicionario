import { shuffle } from "lodash";
import { useGame } from "@/lib/contexts/GameContext"
import { useRoomChannel } from "@/lib/contexts/RoomContext";
import { Button, cn, Form, Radio, RadioGroup } from "@heroui/react";

export default function VoteStage() {
  const { currentUser } = useRoomChannel();
  const { currentRound, actions, stage, players } = useGame();

  if (!currentRound) return <></>;

  const allDefinitions = [
    currentRound.word,
    ...currentRound.fakes.filter(w => w.author.id !== currentUser.id)
  ];

  const isBlame = stage === "blame";

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
        {/* shuffle just once */}
        {shuffle(allDefinitions).map(word => (
          <Radio
            key={word.id}
            value={word.id}
            classNames={{ base: cn(isBlame && word.id === currentRound.word.id && "bg-primary") }}
            isDisabled={isBlame}
          >
            {word.definition}
          </Radio>
        ))}
      </RadioGroup>

      <ul>
        {isBlame && players.map((player => {
          return (
            <li key={player.id}>
              <b>{player.name}:</b> {player.points} pts.
            </li>
          )
        }))}
      </ul>

      {!isBlame && <Button type="submit">Votar</Button>}
      {isBlame && <Button onPress={() => actions.checkoutCurrentRound()}>Seguir</Button>}
    </Form>
  )
}