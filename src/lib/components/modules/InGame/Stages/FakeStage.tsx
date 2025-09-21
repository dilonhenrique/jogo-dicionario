import { useGame } from "@/lib/contexts/GameContext";
import { useSession } from "@/lib/contexts/SessionContext";
import { Button, Form, Textarea } from "@heroui/react";
import { memo, useState } from "react";

function FakeStage() {
  const { user } = useSession();
  const { currentRound, actions } = useGame();

  const myFake = currentRound?.fakes.find(f => f.author.id === user.id);

  const [value, setValue] = useState(myFake?.definition ?? "");
  const [isSent, setSent] = useState(!!myFake);

  function handleUndo() {
    actions.removeFakeWord();
    setSent(false);
  }

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();

        if (value.length > 5) {
          actions.addFakeWord(value);
          setSent(true);
        }
      }}
    >
      <Textarea
        size="lg"
        name="definition"
        placeholder="Escreva uma definição"
        isDisabled={isSent}
        value={value}
        onValueChange={setValue}
      />

      <div className="flex gap-2">
        <Button type="submit" isDisabled={isSent || value.length <= 5} color="primary">Enviar</Button>
        {isSent && <Button onPress={handleUndo}>Alterar</Button>}
      </div>
    </Form>
  )
}

export default memo(FakeStage);