import { useGame } from "@/lib/contexts/GameContext";
import { Button, Form, Textarea } from "@heroui/react";
import { memo, useState } from "react";

function FakeStage() {
  const { actions } = useGame();

  const [value, setValue] = useState("");
  const [isSent, setSent] = useState(false);

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
        name="definition"
        placeholder="Escreva uma definição"
        isDisabled={isSent}
        value={value}
        onValueChange={setValue}
      />

      <div className="flex gap-2">
        <Button type="submit" isDisabled={isSent} color="primary">Enviar</Button>
        {/* TODO: tirar do "banco" */}
        {isSent && <Button onPress={() => setSent(false)}>Mudar</Button>}
      </div>
    </Form>
  )
}

export default memo(FakeStage);