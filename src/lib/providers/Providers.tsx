import { PropsWithChildren } from "react";
import UiProvider from "./UiProvider";
import ToastProvider from "./ToastProvider";

export default function Providers({ children }: PropsWithChildren) {
  return (
    <UiProvider>
      {children}
      <ToastProvider />
    </UiProvider>
  );
}