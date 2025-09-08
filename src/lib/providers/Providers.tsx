import { PropsWithChildren } from "react";
import UiProvider from "./UiProvider";

export default function Providers({ children }: PropsWithChildren) {
  return (
    <UiProvider>
      {children}
    </UiProvider>
  );
}