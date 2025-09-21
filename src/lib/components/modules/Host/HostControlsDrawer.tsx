import { Drawer, DrawerBody, DrawerContent, DrawerHeader } from "@heroui/react";
import { Crown } from "lucide-react";
import HostTransfer from "./HostTransfer";
import { PlayerList } from "../Player/PlayerList";
import { useGame } from "@/lib/contexts/GameContext";
import { useState } from "react";
import { Player } from "@/types/user";
import RemovePlayerModal from "./RemovePlayerModal";
import { useRoomChannel } from "@/lib/contexts/RoomContext";

type Props = {
  isOpen: boolean;
  onClose: () => void;
}

export default function HostControlsDrawer(props: Props) {
  const { amIHost } = useRoomChannel();
  const { players } = useGame();

  const [removePlayer, setRemovePlayer] = useState<Player | null>(null);

  return (
    <>
      <Drawer {...props}>
        <DrawerContent className="pt-8">
          <DrawerHeader>
            <div className="flex items-center gap-2">
              <Crown size={16} className="text-warning" />
              <h3 className="text-sm font-medium">Controles do Host</h3>
            </div>
          </DrawerHeader>

          <DrawerBody>
            <p className="text-foreground-500 italic">
              Como Host, apenas você pode iniciar as partidas
            </p>

            <HostTransfer />

            <h5>Remover jogador</h5>
            <PlayerList
              players={players}
              onRemove={amIHost ? (player) => setRemovePlayer(player) : undefined}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <RemovePlayerModal
        player={removePlayer}
        onClose={() => setRemovePlayer(null)}
      />
    </>
  );
}
