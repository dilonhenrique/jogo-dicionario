import { Drawer, DrawerBody, DrawerContent, DrawerHeader } from "@heroui/react";
import { Crown } from "lucide-react";
import HostTransfer from "./HostTransfer";

type Props = {
  isOpen: boolean;
  onClose: () => void;
}

export default function HostControlsDrawer(props: Props) {
  return (
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

          {/* TODO: other controls as kick from lobby */}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
