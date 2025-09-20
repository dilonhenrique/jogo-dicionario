import { useRoomChannel } from "@/lib/contexts/RoomContext";
import { Divider, Spinner, Button } from "@heroui/react";
import { PlayerList } from "../Player/PlayerList";
import HostControlButton from "./HostControlButton";
import HeaderContainer from "../../ui/HeaderContainer/HeaderContainer";
import CopyButton from "../../ui/CopyButton/CopyButton";
import { useIsClient } from "usehooks-ts";
import { useMemo } from "react";
import { CopyIcon, SwordsIcon } from "lucide-react";

type Props = {
  onStartGame: () => void;
}

export default function RoomPreview({ onStartGame }: Props) {
  const { onlinePlayers, amIConnected, amIHost, configs, code } = useRoomChannel();
  const isClient = useIsClient();

  const roomUrl = useMemo(() => (
    isClient
      ? `${window.location.protocol}//${window.location.host}/r/${code}`
      : `/r/${code}`
  ),
    [isClient, code]);

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
          {amIHost && (
            <HeaderContainer>
              <HostControlButton />
            </HeaderContainer>
          )}

          <div className="border border-foreground-100 p-4 rounded-xl flex flex-col gap-2">
            <h4>Configurações da sala</h4>
            <ul className="flex flex-col gap-1 text-sm">
              <li>• Host escolhe palavras: {configs.enableHostChooseWord ? "Sim" : "Não"}</li>
              <li>• Jogo termina com pontuação: {configs.enableMaxPoints ? `Sim (${configs.maxPoints} pontos)` : "Não"}</li>
            </ul>
          </div>

          {amIHost && (
            <div className="border border-foreground-100 p-4 rounded-xl flex flex-col gap-2 items-start">
              <h4>Iniciar Jogo</h4>

              <div className="mb-2">
                <p className="text-sm text-foreground-600">
                  Certifique-se de que todos os jogadores estão prontos.
                </p>
                <p className="text-xs text-foreground-500 italic">
                  Depois de iniciada a partida, nenhum jogador pode entrar
                </p>
              </div>

              <div className="flex gap-2 w-full">
                <Button
                  color="primary"
                  size="lg"
                  onPress={onStartGame}
                  className="grow"
                  isDisabled={onlinePlayers.length < 2}
                  startContent={<SwordsIcon size={20} />}
                >
                  Iniciar Jogo
                </Button>

                <CopyButton 
                copyContent={roomUrl} 
                startContent={<CopyIcon size={18} />} 
                size="lg"
                >
                  Convidar
                </CopyButton>
              </div>
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
        <h4>Participantes ({onlinePlayers.length})</h4>
        <PlayerList players={onlinePlayers} />
      </div>
    </div>
  );
}