import { isValidRoomCode } from "@/lib/utils/generateRoomCode";
import { roomService } from "@/server/services/room";
import { addToast, Button, Form, Input } from "@heroui/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function GoToRoomForm() {
  const router = useRouter();
  const [code, setCode] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const isValid = isValidRoomCode(code);

    if (isValid) {
      const room = await roomService.findByCode(code);

      if (room) {
        router.push(`/r/${room.code}`);
        return;
      }
    }

    addToast({
      color: "danger",
      title: isValid ? "Esta sala não existe" : "Código da sala inválido"
    });
  }

  return (
    <Form
      className="flex-row"
      onSubmit={handleSubmit}
    >
      <Input
        placeholder="Código da sala"
        name="code"
        validate={(data) => isValidRoomCode(data) ? true : "Código inválido"}
        value={code}
        onValueChange={setCode}
      />
      <Button
        type="submit"
        isDisabled={!isValidRoomCode(code)}
      >
        Entrar
      </Button>
    </Form>
  );
}