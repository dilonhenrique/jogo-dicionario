import { cn } from "@heroui/react";
import { PropsWithChildren } from "react";

export type ContainerProps = PropsWithChildren & {
  className?: string;
}

export default function Container({ children, className }: ContainerProps) {
  return (<div className={cn("flex flex-col gap-4 p-10 min-h-full max-w-2xl mx-auto", className)}>
    {children}
  </div>)
}