import { addToast, Button, ButtonProps } from "@heroui/react";
import { useCallback } from "react";
import { useCopyToClipboard } from "usehooks-ts";

export type CopyButtonProps = ButtonProps & {
  copyContent: string;
  disableToast?: boolean;
};

export default function CopyButton({ copyContent, disableToast, ...props }: CopyButtonProps) {
  const [, copy] = useCopyToClipboard();

  const copyToClipboard = useCallback(async () => {
    let success = true;
    try {
      success = await copy(copyContent);
    } catch {
      success = false;
    }

    if (!disableToast) {
      addToast({
        color: success ? "success" : "danger",
        title: success ? "Copiado para área de transferência" : "Erro ao copiar",
      })
    }
  }, [copy, copyContent, disableToast])

  return <Button
    {...props}
    onPress={(e) => {
      props.onPress?.(e);
      copyToClipboard();
    }}
  />;
}