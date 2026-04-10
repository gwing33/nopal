// app/components/Badge.tsx

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "accent";

type BadgeProps = {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
};

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  neutral: {
    background: "var(--farground)",
    border: "1px solid var(--midground)",
    color: "var(--purple-light)",
  },
  success: {
    background: "var(--green-light)",
    color: "var(--purple)",
  },
  warning: {
    background: "var(--yellow)",
    color: "var(--purple)",
  },
  danger: {
    background: "var(--red-light)",
    color: "var(--red)",
  },
  accent: {
    background: "var(--moon)",
    color: "var(--purple)",
  },
};

export function Badge({
  variant = "neutral",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-mono shrink-0 ${className}`.trim()}
      style={variantStyles[variant]}
    >
      {children}
    </span>
  );
}
