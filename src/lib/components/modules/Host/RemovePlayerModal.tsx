import { Player } from "@/types/user";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";

type Props = {
  player: Player | null;
  onClose: () => void;
  onRemove: (player: Player) => void;
}

export default function RemovePlayerModal({ player, onRemove, onClose }: Props) {
  function handlePress(player: Player | null) {
    if (!player) return;

    onRemove(player);
    onClose();
  }

  return (
    <Modal isOpen={!!player} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Expulsar jogador?</ModalHeader>

        <ModalBody>
          <p>Tem certeza que deseja excluir o jogador {player?.name} da partida?</p>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="bordered"
            onPress={onClose}
          >
            Cancelar
          </Button>

          <Button
            color="danger"
            onPress={() => handlePress(player)}
          >
            Expulsar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal >
  );
}