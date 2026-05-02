// app/components/AppLayout.tsx
import { Link, NavLink } from "react-router";
import { ReactNode, useState, useCallback } from "react";
import { useUser, permissions } from "../hooks/useUser";
import nopalLogo from "../images/nopal-v2.svg";
import nopalDarkLogo from "../images/nopal-dark-v2.svg";
import { useSchemePref } from "../hooks/useSchemePref";

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      {open ? (
        <>
          <line x1="4" y1="4" x2="20" y2="20" />
          <line x1="20" y1="4" x2="4" y2="20" />
        </>
      ) : (
        <>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </>
      )}
    </svg>
  );
}

type NavLinkProps = {
  isActive: boolean;
};

const navLinkClass = ({ isActive }: NavLinkProps) => {
  const defaultClasses = "text-sm font-mono p-2 rounded block";
  if (isActive) return `${defaultClasses} midground-bg`;

  return `${defaultClasses} purple-light-text`;
};

const navLinkStyle = () =>
  ({
    textDecoration: "none",
    transition: "background 150ms, color 150ms",
    marginLeft: "-0.5rem",
  }) as React.CSSProperties;

function PfpAvatar({ user }: { user: ReturnType<typeof useUser> }) {
  if (user?.pfp) {
    return (
      <img
        src={user.pfp}
        alt=""
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <span
      style={{
        width: 24,
        height: 24,
        borderRadius: "50%",
        background: "var(--purple-light)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.65rem",
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {(user?.name ?? user?.email ?? "?")[0].toUpperCase()}
    </span>
  );
}

export function AppLayout({ children }: { children?: ReactNode }) {
  const schemePref = useSchemePref();
  const isDark = schemePref === "dark";
  const user = useUser();
  const isSuper = permissions.isSuper(user);
  const isAdmin = permissions.isAdmin(user);

  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <div className="app-layout">
      {/* ===== SIDEBAR (desktop ≥860px) ===== */}
      <aside className="app-sidebar">
        <Link to="/" prefetch="intent">
          <img src={isDark ? nopalDarkLogo : nopalLogo} alt="nopal" />
        </Link>

        <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <NavLink
            to="/fruits"
            prefetch="intent"
            end
            className={navLinkClass}
            style={navLinkStyle}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/fruits/daily-log"
            prefetch="intent"
            className={navLinkClass}
            style={navLinkStyle}
          >
            Daily Log
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/fruits/all-projects"
              prefetch="intent"
              className={navLinkClass}
              style={navLinkStyle}
            >
              All Projects
            </NavLink>
          )}
          <NavLink
            to="/fruits/good-building-system"
            prefetch="intent"
            end
            className={navLinkClass}
            style={navLinkStyle}
          >
            Good Building
          </NavLink>
          {isSuper && (
            <NavLink
              to="/fruits/styles"
              prefetch="intent"
              className={navLinkClass}
              style={navLinkStyle}
            >
              Styles
            </NavLink>
          )}
        </nav>

        <div style={{ marginTop: "auto" }}>
          <Link
            to="/fruits/profile"
            className="text-sm font-mono px-3 py-2 rounded block purple-light-text"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <PfpAvatar user={user} />
            profile
          </Link>
        </div>
      </aside>

      {/* ===== TOP NAV (mobile <860px) ===== */}
      <div className="app-topnav">
        <div className="app-topnav-bar">
          <Link to="/fruits" prefetch="intent">
            <img
              src={isDark ? nopalDarkLogo : nopalLogo}
              alt="Nopal"
              style={{ width: "64px", display: "block" }}
            />
          </Link>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="purple-text"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <HamburgerIcon open={menuOpen} />
          </button>
        </div>

        {menuOpen && (
          <div className="app-topnav-menu">
            <NavLink
              to="/fruits"
              prefetch="intent"
              end
              className={navLinkClass}
              style={navLinkStyle}
              onClick={closeMenu}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/fruits/daily-log"
              prefetch="intent"
              className={navLinkClass}
              style={navLinkStyle}
              onClick={closeMenu}
            >
              Daily Log
            </NavLink>
            {isAdmin && (
              <NavLink
                to="/fruits/all-projects"
                prefetch="intent"
                className={navLinkClass}
                style={navLinkStyle}
                onClick={closeMenu}
              >
                All Projects
              </NavLink>
            )}
            {isAdmin && (
              <NavLink
                to="/fruits/styles"
                prefetch="intent"
                className={navLinkClass}
                style={navLinkStyle}
                onClick={closeMenu}
              >
                Styles
              </NavLink>
            )}
            <Link
              to="/fruits/profile"
              className="text-sm font-mono px-3 py-2 rounded block subtle-text"
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onClick={closeMenu}
            >
              <PfpAvatar user={user} />
              profile
            </Link>
          </div>
        )}
      </div>

      {/* ===== MAIN ===== */}
      <main className="app-main">{children}</main>
    </div>
  );
}
