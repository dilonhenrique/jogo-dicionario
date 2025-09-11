import { shuffle } from "lodash";
import { useGame } from "@/lib/contexts/GameContext"
import { useRoomChannel } from "@/lib/contexts/RoomContext";
import { Button, cn, Form, Radio, RadioGroup } from "@heroui/react";
import { useMemo } from "react";

export default function VoteStage() {
  const { currentUser } = useRoomChannel();
  const { currentRound, actions, stage, players } = useGame();

  const isBlame = stage === "blame";

  const allDefinitions = useMemo(() => {
    if (!currentRound) return [];

    return shuffle([
      currentRound.word,
      ...currentRound.fakes.filter(w => w.author.id !== currentUser.id)
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!currentRound) return <></>;

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
        {allDefinitions.map(word => (
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