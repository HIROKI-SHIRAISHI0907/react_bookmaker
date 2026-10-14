import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

/** 管理画面（コンソール型）共通ボタン */
export type ConsoleButtonVariant = "default" | "primary" | "success" | "ghost" | "danger";
export type ConsoleButtonSize = "sm" | "md";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ConsoleButtonVariant;
  size?: ConsoleButtonSize;
  /** true の間はスピナーを出して押せなくする */
  loading?: boolean;
};

const VARIANT: Record<ConsoleButtonVariant, string> = {
  default: "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
  primary: "border border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700",
  success: "border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700",
  ghost: "border border-transparent bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900",
  danger: "border border-red-600 bg-red-600 text-white hover:bg-red-700",
};

const SIZE: Record<ConsoleButtonSize, string> = {
  sm: "h-7 px-2.5 text-xs",
  md: "h-8 px-3 text-[13px]",
};

const ConsoleButton = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "default", size = "md", loading = false, disabled, className = "", type = "button", children, ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-bold whitespace-nowrap transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-40",
        VARIANT[variant],
        SIZE[size],
        className,
      ].join(" ")}
      {...rest}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  ),
);
ConsoleButton.displayName = "ConsoleButton";

export default ConsoleButton;
