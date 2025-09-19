import { useRoomChannel } from "@/lib/contexts/RoomContext";
import { Button, Tooltip } from "@heroui/react";
import HostControlsDrawer from "./HostControlsDrawer";
import { useState } from "react";
import { Crown } from "lucide-react";

export default function HostControlButton() {
  const { amIHost } = useRoomChannel();
  const [isOpen, setOpen] = useState(false);

  if (!amIHost) return null;

  return (
    <>
      <Tooltip content="Configurações do Host">
        <Button
          size="sm"
          isIconOnly
          startContent={<Crown size={18} />}
          onPress={() => setOpen(true)}
          color="warning"
          variant="ghost"
          radius="full"
        />
      </Tooltip>

      <HostControlsDrawer isOpen={isOpen} onClose={() => setOpen(false)} />
    </>
  )
}