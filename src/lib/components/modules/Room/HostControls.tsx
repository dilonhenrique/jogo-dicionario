import { useRoomChannel } from "@/lib/contexts/RoomContext";
import { Select, SelectItem } from "@heroui/react";
import { Crown } from "lucide-react";
import { useState } from "react";
import { roomService } from "@/server/services/room";
import { useSession } from "@/lib/contexts/SessionContext";

export default function HostControls() {
  const { user: currentUser } = useSession();
  const { onlinePlayers, code, amIHost } = useRoomChannel();
  const [isTransferring, setIsTransferring] = useState(false);

  const handleTransferHost = async (newHostId: string) => {
    if (!newHostId || newHostId === currentUser.id) return;

    const newHost = onlinePlayers.find(p => p.id === newHostId);
    if (!newHost) return;

    setIsTransferring(true);
    try {
      await roomService.transfer({ code, host: newHost });
    } catch (error) {
      console.error("Erro ao transferir host:", error);
    } finally {
      setIsTransferring(false);
    }
  };

  if (!amIHost) return null;

  const eligiblePlayers = onlinePlayers.filter(p => p.id !== currentUser.id);

  if (eligiblePlayers.length === 0) return null;

  return (
    <div className="border border-foreground-100 p-4 rounded-xl gap-4 flex flex-col">
      <div className="flex items-center gap-2">
        <Crown size={16} className="text-warning" />
        <h6 className="text-sm font-medium">Controles do Host</h6>
      </div>

      <Select
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
      </Select>

      <p className="text-xs text-foreground-500 italic">
        Apenas o host pode iniciar jogos e controlar configurações
      </p>
    </div>
  );
}
