import { useRoomChannel } from "@/lib/contexts/RoomContext";
import { addToast, Drawer, DrawerBody, DrawerContent, DrawerHeader, Select, SelectItem } from "@heroui/react";
import { Crown } from "lucide-react";
import { useState } from "react";
import { roomService } from "@/server/services/room";
import { useSession } from "@/lib/contexts/SessionContext";

type Props = {
  isOpen: boolean;
  onClose: () => void;
}

export default function HostControlsDrawer(props: Props) {
  const { user: currentUser } = useSession();
  const { onlinePlayers, code } = useRoomChannel();
  const [isTransferring, setIsTransferring] = useState(false);

  const handleTransferHost = async (newHostId: string) => {
    if (!newHostId || newHostId === currentUser.id) return;

    const newHost = onlinePlayers.find(p => p.id === newHostId);
    if (!newHost) return;

    setIsTransferring(true);
    try {
      await roomService.transfer({ code, host: newHost });

      addToast({
        title: `${newHost.name} foi promovido a Host`,
        icon: <Crown size={14} />,
        classNames: { icon: "text-warning fill-none" },
      });
    } catch (error) {
      console.error("Erro ao transferir host:", error);
    } finally {
      setIsTransferring(false);
    }
  };

  const eligiblePlayers = onlinePlayers.filter(p => p.id !== currentUser.id);

  return (
    <Drawer {...props}>
      <DrawerContent>
        <DrawerHeader className="pt-4">
          <div className="flex items-center gap-2">
            <Crown size={16} className="text-warning" />
            <h3 className="text-sm font-medium">Controles do Host</h3>
          </div>
        </DrawerHeader>

        <DrawerBody>
          {eligiblePlayers.length > 0 && <Select
            label="Transferir controle para outro jogador"
            placeholder="Selecione um jogador"
            size="sm"
            isDisabled={isTransferring}
            onSelectionChange={(key) => {
              const newHostId = Array.from(key)[0] as string;
              if (newHostId) handleTransferHost(newHostId);
            }}
          >
            {eligiblePlayers.map(player => (
              <SelectItem key={player.id}>
                {player.name}
              </SelectItem>
            ))}
          </Select>}

          <p className="text-xs text-foreground-500 italic">
            Apenas o host pode iniciar jogos
          </p>

          {/* TODO: other controls as kick from lobby */}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
