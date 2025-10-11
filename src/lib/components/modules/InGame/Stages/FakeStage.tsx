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
  const [isLoading, setIsLoading] = useState(false);

  async function handleUndo() {
    setIsLoading(true);
    try {
      await actions.removeFakeWord();
      setSent(false);
    } catch (error) {
      console.error("Erro ao remover definição falsa:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      onSubmit={async (e) => {
        e.preventDefault();

        if (value.length > 5) {
          setIsLoading(true);
          try {
            await actions.addFakeWord(value);
            setSent(true);
          } catch (error) {
            console.error("Erro ao enviar definição falsa:", error);
          } finally {
            setIsLoading(false);
          }
        }
      }}
    >
      <Textarea
        size="lg"
        name="definition"
        placeholder="Escreva uma definição"
        isDisabled={isSent || isLoading}
        value={value}
        onValueChange={setValue}
      />

      <div className="flex gap-2">
        <Button type="submit" isDisabled={isSent || value.length <= 5 || isLoading} color="primary" isLoading={isLoading}>
          Enviar
        </Button>
        {isSent && <Button onPress={handleUndo} isDisabled={isLoading}>Alterar</Button>}
      </div>
    </Form>
  )
}

export default memo(FakeStage);