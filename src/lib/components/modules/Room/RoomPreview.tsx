import { useRoomChannel } from "@/lib/contexts/RoomContext";
import { Divider, Spinner, Button } from "@heroui/react";
import { PlayerList } from "../Player/PlayerList";
import HostControls from "./HostControls";

type Props = {
  onStartGame: () => void;
}

export default function RoomPreview({ onStartGame }: Props) {
  const { onlinePlayers, amIConnected, amIHost, configs } = useRoomChannel();

  return (
    <div className="flex flex-col gap-4">
      {!amIConnected && (
        <div className="text-center flex flex-col gap-2 items-center py-4">
          <Spinner size="sm" />
          <p className="text-sm text-foreground-500">Entrando na sala...</p>
        </div>
      )}

      {amIConnected && (
        <>
          <HostControls />
          
          <div className="border border-foreground-100 p-4 rounded-xl">
            <h5>Configurações da sala</h5>
            <div className="flex flex-col gap-2 text-sm">
              <p>• Host escolhe palavras: {configs.enableHostChooseWord ? "Sim" : "Não"}</p>
              <p>• Jogo termina com pontuação: {configs.enableMaxPoints ? `Sim (${configs.maxPoints} pontos)` : "Não"}</p>
            </div>
          </div>

          {amIHost && (
            <div className="border border-foreground-100 p-4 rounded-xl">
              <h5>Iniciar Jogo</h5>
              <p className="text-sm text-foreground-600 mb-4">
                Certifique-se de que todos os jogadores estão prontos.
              </p>
              <Button 
                color="primary" 
                size="lg"
                onPress={onStartGame}
                isDisabled={onlinePlayers.length < 2}
              >
                Iniciar Jogo
              </Button>
              <p className="text-xs text-foreground-500 italic mt-2">
                Depois de iniciada a partida, nenhum jogador pode entrar
              </p>
            </div>
          )}

          {!amIHost && (
            <p className="text-foreground-400 text-center">
              Aguardando host iniciar partida...
            </p>
          )}

          <Divider />
        </>
      )}

      <div className="flex flex-col gap-2">
        <h5>Participantes ({onlinePlayers.length})</h5>
        <PlayerList players={onlinePlayers} />
      </div>
    </div>
  );
}