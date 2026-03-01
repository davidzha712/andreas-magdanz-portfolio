"use client";

import { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  className?: string;
}

type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & {
    href?: undefined;
  };

type ButtonAsAnchor = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps> & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsAnchor;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-bg hover:bg-accent-hover border border-transparent",
  outline:
    "bg-transparent text-fg border border-border hover:bg-bg-muted",
  ghost:
    "bg-transparent text-fg border border-transparent hover:bg-bg-muted",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-1.5 text-xs",
  md: "px-6 py-2.5 text-xs",
  lg: "px-8 py-3 text-sm",
};

const baseClasses =
  "inline-flex items-center justify-center uppercase tracking-wider font-sans transition-all duration-200 cursor-pointer select-none";

export default function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    children,
    className = "",
    ...rest
  } = props;

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  ].join(" ");

  if ((rest as ButtonAsAnchor).href !== undefined) {
    const { href, ...anchorRest } = rest as Omit<ButtonAsAnchor, keyof BaseProps>;
    return (
      <a href={href} className={classes} {...anchorRest}>
        {children}
      </a>
    );
  }

  const buttonRest = rest as Omit<ButtonAsButton, keyof BaseProps>;
  return (
    <button className={classes} {...buttonRest}>
      {children}
    </button>
  );
}
