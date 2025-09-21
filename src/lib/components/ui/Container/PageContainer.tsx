import { Button } from "@heroui/react";
import Container, { ContainerProps } from "./Container";
import RulesModal from "../../modules/Rules/RulesModal";
import { useState } from "react";
import { HelpCircle } from "lucide-react";

export default function PageContainer({ children, ...props }: ContainerProps) {
  const [isOpen, setOpen] = useState(false);

  return (
    <Container {...props}>
      {children}

      <Button
        isIconOnly
        startContent={<HelpCircle size={20} className="text-foreground-500" />}
        size="sm"
        radius="full"
        variant="light"
        className="fixed bottom-8 right-8"
        onPress={() => setOpen(true)}
      />
      <RulesModal isOpen={isOpen} onClose={() => setOpen(false)} />
    </Container>
  );
}