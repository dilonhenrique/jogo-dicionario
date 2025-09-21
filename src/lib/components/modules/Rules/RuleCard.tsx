import { Chip, ChipProps, cn } from "@heroui/react";
import { PropsWithChildren } from "react";

type Color = NonNullable<ChipProps["color"]>;
type Props = PropsWithChildren & {
  color?: Color;
  title: string;
  number: number;
}

export default function RuleCard({ color = "default", number, title, children }: Props) {
  const colorMap: Record<Color, string> = {
    default: "text-default bg-default-100",
    primary: "text-primary bg-primary-100",
    secondary: "text-secondary bg-secondary-100",
    success: "text-success bg-success-100",
    warning: "text-warning bg-warning-100",
    danger: "text-danger bg-danger-100",
  };

  return (
    <div className="bg-content2 py-6 pt-8 px-9 mt-3 rounded-lg rounded-tl-none relative">
      <Chip
        color={color}
        className="absolute -top-3.5 left-0"
        startContent={<Circle className={colorMap[color]}>{number}</Circle>}
      >
        <h5>{title}</h5>
      </Chip>
      <p className="text-sm text-foreground-700">
        {children}
      </p>
    </div>
  );
}

type CircleProps = PropsWithChildren & {
  className?: string;
}

function Circle({ className, children }: CircleProps) {
  return (
    <span className={cn("rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold me-1", className)}>
      {children}
    </span>
  );
}