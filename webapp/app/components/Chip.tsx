// app/components/Chip.tsx

type ChipProps = {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
};

export function Chip({
  children,
  onClick,
  active = false,
  className = "",
}: ChipProps) {
  const isInteractive = typeof onClick === "function";

  const style: React.CSSProperties = active
    ? {
        background: "var(--purple)",
        border: "1px solid var(--purple)",
        color: "var(--farground)",
      }
    : {
        background: "var(--farground)",
        border: "1px solid var(--midground)",
        color: "var(--purple-light)",
      };

  return (
    <span
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
      className={[
        "text-xs px-2 py-0.5 rounded-full font-mono shrink-0 select-none",
        isInteractive ? "cursor-pointer" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {children}
    </span>
  );
}
