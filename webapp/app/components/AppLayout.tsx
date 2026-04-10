// app/components/AppLayout.tsx
import { Link, NavLink } from "react-router";
import { ReactNode, useState, useCallback } from "react";
import { useUser } from "../hooks/useUser";
import nopalLogo from "../images/nopal-v2.svg";

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

const navLinkStyle = ({ isActive }: { isActive: boolean }) =>
  ({
    fontSize: "0.875rem",
    padding: "8px 12px",
    borderRadius: "4px",
    fontWeight: isActive ? 700 : 400,
    color: isActive ? "var(--purple)" : "var(--text-subtle)",
    background: isActive ? "var(--midground)" : "transparent",
    textDecoration: "none",
    transition: "background 150ms, color 150ms",
    display: "block",
  } as React.CSSProperties);

const logoutStyle: React.CSSProperties = {
  fontSize: "0.875rem",
  padding: "8px 12px",
  borderRadius: "4px",
  color: "var(--text-subtle)",
  textDecoration: "none",
  display: "block",
};

export function AppLayout({ children }: { children?: ReactNode }) {
  const user = useUser();
  const isAdmin = user?.role === "Admin" || user?.role === "Super";
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <div className="app-layout">
      {/* ===== SIDEBAR (desktop ≥800px) ===== */}
      <aside className="app-sidebar">
        <Link
          to="/fruits"
          prefetch="intent"
          style={{ display: "inline-block" }}
        >
          <img
            src={nopalLogo}
            alt="Nopal"
            style={{ width: "80px", display: "block" }}
          />
        </Link>

        <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <NavLink to="/fruits" prefetch="intent" end style={navLinkStyle}>
            Dashboard
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/fruits/all-projects"
              prefetch="intent"
              style={navLinkStyle}
            >
              All Projects
            </NavLink>
          )}
          <NavLink
            to="/fruits/good-building-system"
            prefetch="intent"
            end
            style={navLinkStyle}
          >
            Good Building
          </NavLink>
        </nav>

        <div style={{ marginTop: "auto" }}>
          <Link to="/logout" style={logoutStyle}>
            log out
          </Link>
        </div>
      </aside>

      {/* ===== TOP NAV (mobile <800px) ===== */}
      <div className="app-topnav">
        <div className="app-topnav-bar">
          <Link to="/fruits" prefetch="intent">
            <img
              src={nopalLogo}
              alt="Nopal"
              style={{ width: "64px", display: "block" }}
            />
          </Link>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--purple)",
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
              style={navLinkStyle}
              onClick={closeMenu}
            >
              Dashboard
            </NavLink>
            {isAdmin && (
              <NavLink
                to="/fruits/all-projects"
                prefetch="intent"
                style={navLinkStyle}
                onClick={closeMenu}
              >
                All Projects
              </NavLink>
            )}
            <Link to="/logout" style={logoutStyle} onClick={closeMenu}>
              log out
            </Link>
          </div>
        )}
      </div>

      {/* ===== MAIN ===== */}
      <main className="app-main">{children}</main>
    </div>
  );
}
