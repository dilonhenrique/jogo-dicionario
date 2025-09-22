import { gameSessionService } from "@/server/services/gameSession";
import { ConnectionStatus, GameState } from "@/types/game";
import { useCallback, useEffect, useRef, useState } from "react";

export default function useSyncGame(roomCode: string) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  const updateGameState = useRef<(state: GameState) => void>(() => { });

  const syncGameState = useCallback(async (): Promise<GameState | null> => {
    try {
      setConnectionStatus('syncing');
      const session = await gameSessionService.get(roomCode);
      const state = session?.game_state as GameState | undefined;

      if (state) {
        updateGameState.current(state);
      }

      setConnectionStatus('connected');
      return state ?? null;
    } catch (error) {
      console.error('Erro ao sincronizar estado do jogo:', error);
      setConnectionStatus('disconnected');
      return null;
    }
  }, [roomCode]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && connectionStatus === 'disconnected') {
        console.log('Página voltou ao foco, tentando sincronizar...');
        syncGameState();
      }
    };

    const handleOnline = () => {
      console.log('Conexão com internet restaurada');
      if (connectionStatus === 'disconnected') {
        syncGameState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [connectionStatus, syncGameState]);

  return {
    connectionStatus,
    setConnectionStatus,
    updateGameState,
  };
}