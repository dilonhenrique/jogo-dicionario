import { PropsWithChildren } from "react";

export default function HeaderContainer({ children }: PropsWithChildren) {
  return (
    <div className="absolute top-10 right-10 flex gap-2 items-center">
      {children}
    </div>
  );
}