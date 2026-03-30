import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    varient?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
    className?: string;
  }
>;

function combineClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Button({
  variant,
  varient,
  size = "md",
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonProps) {
  const resolvedVariant = variant ?? varient ?? "primary";
  const combinedClassName = combineClasses(
    "btn",
    `btn--${resolvedVariant}`,
    `btn--${size}`,
    fullWidth && "btn--full-width",
    className,
  );

  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  );
}
