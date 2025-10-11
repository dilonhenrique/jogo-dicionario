import { useGame } from "@/lib/contexts/GameContext";
import { Player } from "@/types/user";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";

type Props = {
  player: Player | null;
  onClose: () => void;
}

export default function RemovePlayerModal({ player, ...props }: Props) {
  const { actions } = useGame();

  async function handleRemovePlayer(userId?: string) {
    if (!userId) return;

    try {
      await actions.kickPlayer(userId);
      props.onClose();
    } catch (error) {
      console.error("Erro ao expulsar jogador:", error);
    }
  }

  return (
    <Modal isOpen={!!player} {...props}>
      <ModalContent>
        <ModalHeader>Expulsar jogador?</ModalHeader>

        <ModalBody>
          <p>Tem certeza que deseja excluir o jogador {player?.name} da partida?</p>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="bordered"
            onPress={props.onClose}
          >
            Cancelar
          </Button>

          <Button
            color="danger"
            onPress={() => handleRemovePlayer(player?.id)}
          >
            Expulsar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}