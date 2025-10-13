import { useSession } from "@/lib/contexts/SessionContext";
import { gameActions } from "@/server/actions/game";
import { addToast, Button, Form, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { useParams } from "next/navigation";
import { useTransition } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpdateNameModal({ isOpen, onClose }: Props) {
  const { roomCode } = useParams();
  const { user, updateUser } = useSession();

  const [isLoading, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    if (isLoading) return;

    const { name: newName } = Object.fromEntries(formData);

    if (!newName || typeof newName !== 'string' || newName.length < 3) {
      addToast({ color: 'danger', title: 'Nome inválido', description: 'O nome deve ter ao menos 3 caracteres.' });
      return;
    }

    startTransition(async () => {
      try {
        await gameActions.updatePlayerName({ userId: user.id, newName, roomCode: roomCode as string });

        addToast({
          color: 'success',
          title: 'Nome atualizado',
        });
        updateUser({ name: newName });

        onClose();
      } catch {
        addToast({ color: 'danger', title: 'Erro ao atualizar nome' });
      }
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <Form action={handleSubmit} className="items-stretch">
          <ModalHeader>Mudar meu nome</ModalHeader>

          <ModalBody>
            <Input
              name="name"
              placeholder="Digite seu novo nome"
              label="Nome"
              defaultValue={user.name}
            />
          </ModalBody>

          <ModalFooter>
            <Button
              variant="bordered"
              onPress={onClose}
              isDisabled={isLoading}
            >
              Cancelar
            </Button>

            <Button
              color="success"
              type="submit"
              isLoading={isLoading}
            >
              Atualizar nome
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal >
  )
}