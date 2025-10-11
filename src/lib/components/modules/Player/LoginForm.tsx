import { useSession } from "@/lib/contexts/SessionContext";
import { addToast, Button, Form, Input } from "@heroui/react";
import { ArrowRight } from "lucide-react";

export default function LoginForm() {
  const { createUser } = useSession();

  return (
    <Form
      className="flex flex-col w-full"
      action={async (formData) => {
        const name = formData.get("name");
        if (typeof name === "string" && name.length > 3) {
          createUser({ name });
        } else {
          addToast({
            color: "danger",
            title: "Nome inválido",
          })
        }
      }}
    >
      <h4>Identifique-se para entrar</h4>

      <div className="flex gap-2 w-full">
        <Input name="name" placeholder="Seu nome" size="lg" />
        <Button
          type="submit"
          color="primary"
          size="lg"
          endContent={<ArrowRight className="shrink-0" size={18} />}
        >
          Entrar
        </Button>
      </div>
    </Form>
  );
}