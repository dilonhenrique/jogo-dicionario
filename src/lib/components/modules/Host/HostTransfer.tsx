import { useGame } from "@/lib/contexts/GameContext";
import { useRoomChannel } from "@/lib/contexts/RoomContext";
import { useSession } from "@/lib/contexts/SessionContext";
import { roomService } from "@/server/services/room";
import { Player } from "@/types/user";
import { addToast, Button, Select, SelectItem } from "@heroui/react";
import { Check, Crown } from "lucide-react";
import { useState } from "react";

export default function HostTransfer() {
  const { user: currentUser } = useSession();
  const { code } = useRoomChannel();
  const { players } = useGame();

  const [isTransferring, setIsTransferring] = useState(false);
  const [newHost, setNewHost] = useState<Player | null>(null);

  const handleTransferHost = async () => {
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

  const eligiblePlayers = players.filter(p => p.onlineAt !== null && p.id !== currentUser.id);

  if (eligiblePlayers.length === 0) return null;

  return (
    <div className="flex gap-2 py-4 items-end">
      <Select
        label="Transferir controle para outro jogador"
        placeholder="Selecione um jogador"
        labelPlacement="outside"
        size="lg"
        isDisabled={isTransferring}
        onSelectionChange={(key) => {
          const newHostId = Array.from(key)[0] as string;

          if (newHostId) {
            const newHost = eligiblePlayers.find(u => u.id === newHostId);
            if (newHost) {
              setNewHost(newHost);
              return;
            }
          }

          setNewHost(null);
        }}
      >
        {eligiblePlayers.map(player => (
          <SelectItem key={player.id}>
            {player.name}
          </SelectItem>
        ))}
      </Select>

      <Button
        isIconOnly
        startContent={<Check size={16} />}
        color={newHost ? "success" : undefined}
        radius="full"
        size="sm"
        isDisabled={!newHost}
        className="mb-2"
        onPress={handleTransferHost}
      />
    </div>
  );
}