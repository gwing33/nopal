export function Dropdown({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="dropdown">
      <button className="dropdown-btn">
        <span>{label}</span>
        <span className="arrow"></span>
      </button>
      <ul className="dropdown-content">{children}</ul>
    </div>
  );
}

export function TextDropdown({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="text-dropdown">
      <button className="dropdown-btn">
        <span>{label}</span>
        <span className="arrow"></span>
      </button>
      <ul className="good-box dropdown-content">{children}</ul>
    </div>
  );
}
