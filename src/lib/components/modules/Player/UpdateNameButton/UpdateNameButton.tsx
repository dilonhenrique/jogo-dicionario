import { Button } from "@heroui/react";
import { useState } from "react";
import UpdateNameModal from "./UpdateNameModa";
import { PencilIcon } from "lucide-react";

export default function UpdateNameButton() {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <Button
        onPress={() => setOpen(true)}
        size="sm"
        className="self-start"
        variant="flat"
        color="primary"
        startContent={<PencilIcon size={12} />}
      >
        Mudar meu nome
      </Button>

      <UpdateNameModal isOpen={isOpen} onClose={() => setOpen(false)} />
    </>
  )
}
