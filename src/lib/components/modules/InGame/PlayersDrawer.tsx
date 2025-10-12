import { Button, Drawer, DrawerBody, DrawerContent, DrawerHeader, Tooltip } from "@heroui/react";
import { useState } from "react";
import { useGame } from "@/lib/contexts/GameContext";
import { Users2 } from "lucide-react";
import Leaderboard from "../Player/Leaderboard";

export default function PlayersDrawerButton() {
  const { players, stage, currentRoundPoints } = useGame();
  const [isOpen, setOpen] = useState(false);

  const showRoundPoints = stage === 'blame';

  return (
    <>
      <Tooltip content="Placar">
        <Button
          size="sm"
          isIconOnly
          startContent={<Users2 size={18} />}
          onPress={() => setOpen(true)}
          color="primary"
          variant="ghost"
          radius="full"
        />
      </Tooltip>

      <Drawer size="sm" isOpen={isOpen} onOpenChange={setOpen}>
        <DrawerContent className="pt-8">
          <DrawerHeader>
            <h3>Placar</h3>
          </DrawerHeader>

          <DrawerBody>
            <Leaderboard 
              players={players} 
              roundPoints={showRoundPoints ? currentRoundPoints : undefined}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}