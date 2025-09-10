import { useGame } from "@/lib/contexts/GameContext"
import { Button, Form, Input } from "@heroui/react";
import { useState } from "react";

export default function DefinitionStage() {
  const { currentRound, actions } = useGame();
  const [isSent, setSent] = useState(false);

  if (!currentRound) return <p>Sem palavra definida</p>;

  return <div>
    <h2>{currentRound.word.label}</h2>

    <Form
      action={(formData) => {
        const definition = formData.get("definition");

        if (typeof definition === "string") {
          actions.addFakeWord(definition);
          setSent(true);
        }
      }}
    >
      <Input name="definition" placeholder="Escreva uma definição" isReadOnly={isSent} />
      <Button type="submit" isDisabled={isSent}>Enviar</Button>
    </Form>
  </div>
}