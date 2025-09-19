import { Button, Drawer, DrawerBody, DrawerContent, DrawerHeader, Tooltip } from "@heroui/react";
import { useState } from "react";
import { PlayerList } from "../Player/PlayerList";
import { useGame } from "@/lib/contexts/GameContext";
import { Users2 } from "lucide-react";

export default function PlayersDrawerButton() {
  const { players } = useGame();
  const [isOpen, setOpen] = useState(false);

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
        <DrawerContent className="pt-4">
          <DrawerHeader>
            <h3>Placar</h3>
          </DrawerHeader>

          <DrawerBody>
            <PlayerList players={players} sortMode="points" />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}