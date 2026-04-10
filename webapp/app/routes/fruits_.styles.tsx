// app/routes/fruits_.styles.tsx
import type { LoaderFunctionArgs } from "react-router";
import { redirect, data } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import { AppLayout } from "../components/AppLayout";
import { Badge } from "../components/Badge";
import { Chip } from "../components/Chip";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return redirect("/login");

  return { user };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} style={{ marginBottom: "64px" }}>
      <h2
        className="font-bold text-lg font-mono mb-6 pb-2 purple-text"
        style={{
          borderBottom: "1px solid var(--midground)",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-mono mb-1 subtle-text">{children}</div>;
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code
      className="text-xs font-mono px-1.5 py-0.5 rounded"
      style={{
        background: "var(--midground)",
        color: "var(--purple)",
      }}
    >
      {children}
    </code>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-4 items-start">{children}</div>;
}

function Tile({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-2 items-start">{children}</div>;
}

// ─── Color Swatch ────────────────────────────────────────────────────────────

function Swatch({
  varName,
  hex,
  dark,
}: {
  varName: string;
  hex: string;
  dark?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5" style={{ width: "100px" }}>
      <div
        style={{
          width: "100%",
          height: "52px",
          background: `var(${varName})`,
          borderRadius: "4px",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      />
      <div
        className="text-xs font-mono leading-tight"
        style={{ color: "var(--purple)" }}
      >
        {varName}
      </div>
      <div className="text-xs font-mono subtle-text">{hex}</div>
      {dark && (
        <div className="text-xs font-mono subtle-text" style={{ opacity: 0.6 }}>
          (dark mode)
        </div>
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function FruitsStyles() {
  return (
    <AppLayout>
      <div
        className="container mx-auto px-4 py-12"
        style={{ maxWidth: "860px" }}
      >
        {/* Page header */}
        <div className="mb-12">
          <h1 className="font-bold text-2xl mb-2">Design System</h1>
          <p className="text-sm font-mono subtle-text">
            Tokens, components, and patterns for the Fruits app.
          </p>
        </div>

        {/* ── Quick Nav ──────────────────────────────────────────────────── */}
        <div
          className="good-box p-4 mb-12 flex flex-wrap gap-x-5 gap-y-2"
          style={{ fontSize: "0.8rem" }}
        >
          {[
            ["#colors", "Colors"],
            ["#typography", "Typography"],
            ["#buttons", "Buttons"],
            ["#boxes", "Boxes & Cards"],
            ["#badges", "Badges & Chips"],
            ["#forms", "Form Inputs"],
            ["#links", "Links"],
            ["#spacing", "Spacing"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="font-mono purple-light-text"
              style={{ textDecoration: "none" }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* ── 1. Colors ──────────────────────────────────────────────────── */}
        <Section id="colors" title="01 · Colors">
          <div className="flex flex-col gap-8">
            <div>
              <p className="text-xs font-mono mb-4 subtle-text">
                Brand colors — defined in <Code>:root</Code> inside{" "}
                <Code>styles/root.css</Code>. Reference with{" "}
                <Code>var(--name)</Code> or{" "}
                <Code>style={"{{ color: 'var(--name)' }}"}</Code>.
              </p>
              <div className="flex flex-wrap gap-4 good-white-box p-4">
                <Swatch varName="--purple" hex="#3f2b46" />
                <Swatch varName="--purple-light" hex="#7f5b8b" />
                <Swatch varName="--pink" hex="#d3a0e5" />
                <Swatch varName="--yellow" hex="#ffeaa4" />
                <Swatch varName="--yellow-light" hex="#fcf0c4" />
                <Swatch varName="--green" hex="#5da06d" />
                <Swatch varName="--green-light" hex="#86cb97" />
                <Swatch varName="--red" hex="#a63b31" />
                <Swatch varName="--red-light" hex="#f6c8c3" />
                <Swatch varName="--moon" hex="#c4c6fc" />
              </div>
            </div>

            <div>
              <div className="text-xs font-mono mb-4 font-bold purple-text">
                Surface / Background scale (light mode)
              </div>
              <div className="flex flex-wrap gap-4 good-white-box p-4">
                <Swatch varName="--farground" hex="#fff9f1" />
                <Swatch varName="--midground" hex="#ede4da" />
                <Swatch varName="--foreground" hex="#e5d6c5" />
              </div>
            </div>

            <div>
              <div className="text-xs font-mono mb-4 font-bold purple-text">
                Surface / Background scale (dark mode)
              </div>
              <div className="flex flex-wrap gap-4 good-white-box p-4">
                <Swatch varName="--dark-farground" hex="#494a72" dark />
                <Swatch varName="--dark-midground" hex="#6d6e99" dark />
                <Swatch varName="--dark-foreground" hex="#8d8eb4" dark />
              </div>
            </div>

            <div>
              <div className="text-xs font-mono mb-4 font-bold purple-text">
                Text
              </div>
              <div className="flex flex-wrap gap-4 good-white-box p-4">
                <Swatch varName="--text-subtle" hex="#817186" />
                <Swatch varName="--text-subtle-dark" hex="#c8b8ce" dark />
              </div>
            </div>

            <div className="good-box p-4">
              <div className="text-xs font-mono mb-3 font-bold purple-text">
                Utility text color classes (prefer this over using color
                variables when applicable)
              </div>
              <div className="flex flex-wrap gap-4 text-sm font-mono">
                <span className="purple-text">.purple-text</span>
                <span className="purple-light-text">.purple-light-text</span>
                <span className="green-text">.green-text</span>
                <span className="green-light-text">.green-light-text</span>
                <span className="red-text">.red-text</span>
                <span className="red-light-text">.red-light-text</span>
                <span className="subtle-text">.subtle-text</span>
              </div>
            </div>
          </div>
        </Section>

        {/* ── 2. Typography ──────────────────────────────────────────────── */}
        <Section id="typography" title="02 · Typography">
          <div className="flex flex-col gap-6">
            <div className="good-box p-5 flex flex-col gap-4">
              <Tile>
                <Label>text-2xl + font-bold — page titles</Label>
                <h1 className="font-bold text-2xl">Page Title</h1>
              </Tile>
              <Tile>
                <Label>text-xl + font-bold — section headings</Label>
                <h2 className="font-bold text-xl">Section Heading</h2>
              </Tile>
              <Tile>
                <Label>text-lg + font-bold — card headings</Label>
                <h3 className="font-bold text-lg">Card Heading</h3>
              </Tile>
              <Tile>
                <Label>text-base — body text</Label>
                <p>
                  The quick brown fox jumps over the lazy dog. Body text is the
                  default size and should be used for prose.
                </p>
              </Tile>
              <Tile>
                <Label>text-sm — secondary body, descriptions</Label>
                <p className="text-sm">
                  Smaller text used inside cards, meta information, and
                  supporting copy.
                </p>
              </Tile>
              <Tile>
                <Label>text-sm + subtle-text — muted / subdued</Label>
                <p className="text-sm subtle-text">
                  Muted text for secondary information, hints, and timestamps.
                </p>
              </Tile>
              <Tile>
                <Label>text-xs + font-mono — labels, badges, metadata</Label>
                <span className="text-xs font-mono">your role: Architect</span>
              </Tile>
              <Tile>
                <Label>font-mono — addresses, code, IDs</Label>
                <span className="font-mono text-sm">
                  123 Main St, Portland, OR
                </span>
              </Tile>
            </div>
          </div>
        </Section>

        {/* ── 3. Buttons ─────────────────────────────────────────────────── */}
        <Section id="buttons" title="03 · Buttons">
          <div className="flex flex-col gap-6">
            <p className="text-xs font-mono subtle-text">
              All button classes extend the base <Code>.btn</Code> class (
              <Code>border-radius: 4px; display: inline-flex;</Code>).
            </p>

            <Row>
              <Tile>
                <Label>.btn-primary — primary CTA, large padding</Label>
                <button className="btn-primary">Primary Action</button>
              </Tile>
              <Tile>
                <Label>.btn-purple — purple, no fixed padding</Label>
                <button className="btn-purple" style={{ padding: "8px 20px" }}>
                  Purple Button
                </button>
              </Tile>
              <Tile>
                <Label>.btn-secondary — green, medium padding</Label>
                <button className="btn-secondary">Secondary Action</button>
              </Tile>
              <Tile>
                <Label>.btn-yellow — soft warm tone, medium padding</Label>
                <button className="btn-yellow">Soft Action</button>
              </Tile>
              <Tile>
                <Label>.btn-outline — border only</Label>
                <button
                  className="btn-outline"
                  style={{ padding: "8px 16px", borderRadius: "4px" }}
                >
                  Outline
                </button>
              </Tile>
            </Row>

            <div className="good-box p-4">
              <div className="text-xs font-mono mb-3 font-bold purple-text">
                Sizes via padding (no separate size classes — add padding
                manually)
              </div>
              <Row>
                <Tile>
                  <Label>sm — px-3 py-1</Label>
                  <button
                    className="btn-purple"
                    style={{ padding: "4px 12px", fontSize: "0.75rem" }}
                  >
                    Small
                  </button>
                </Tile>
                <Tile>
                  <Label>md — px-4 py-2</Label>
                  <button
                    className="btn-purple"
                    style={{ padding: "8px 16px", fontSize: "0.875rem" }}
                  >
                    Medium
                  </button>
                </Tile>
                <Tile>
                  <Label>lg — px-8 py-4 (btn-primary default)</Label>
                  <button className="btn-primary">Large</button>
                </Tile>
              </Row>
            </div>

            <div className="good-box p-4">
              <div className="text-xs font-mono mb-3 font-bold purple-text">
                Disabled state — add <Code>opacity-50 cursor-not-allowed</Code>
              </div>
              <Row>
                <button
                  className="btn-primary opacity-50 cursor-not-allowed"
                  disabled
                >
                  Disabled Primary
                </button>
                <button
                  className="btn-secondary opacity-50 cursor-not-allowed"
                  disabled
                >
                  Disabled Secondary
                </button>
              </Row>
            </div>

            <div className="good-box p-4">
              <div className="text-xs font-mono mb-3 font-bold purple-text">
                Destructive / danger — use <Code>--red</Code> via custom CSS var
                override
              </div>
              <button
                style={{
                  background: "var(--red)",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                Delete Project
              </button>
            </div>
          </div>
        </Section>

        {/* ── 4. Boxes & Cards ───────────────────────────────────────────── */}
        <Section id="boxes" title="04 · Boxes & Cards">
          <div className="flex flex-col gap-6">
            <Row>
              <div style={{ flex: "1 1 260px" }}>
                <Label>.good-box — standard card / container</Label>
                <div className="good-box p-5 flex flex-col gap-2">
                  <div className="font-bold text-sm">Card Title</div>
                  <p className="text-sm subtle-text">
                    Use for any grouped content block. Background is{" "}
                    <Code>--farground</Code>, border is{" "}
                    <Code>--foreground</Code>.
                  </p>
                </div>
              </div>

              <div style={{ flex: "1 1 260px" }}>
                <Label>.good-box + .good-box-hover — interactive card</Label>
                <div className="good-box good-box-hover p-5 flex flex-col gap-2">
                  <div className="font-bold text-sm">Clickable Card</div>
                  <p className="text-sm subtle-text">
                    Hover to see border highlight and shadow. Wrap with a{" "}
                    <Code>{"<Link>"}</Code> or add <Code>onClick</Code>.
                  </p>
                </div>
              </div>

              <div style={{ flex: "1 1 260px" }}>
                <Label>.good-box-boarder — border only, no background</Label>
                <div className="good-box-boarder p-5 flex flex-col gap-2">
                  <div className="font-bold text-sm">Border Box</div>
                  <p className="text-sm subtle-text">
                    Transparent background. Good for nested sections.
                  </p>
                </div>
              </div>
            </Row>

            <div>
              <Label>
                Dividers inside .good-box — use{" "}
                <Code>
                  {
                    "<hr style={{ borderColor: 'currentColor', opacity: 0.12 }} />"
                  }
                </Code>
              </Label>
              <div className="good-box p-5 flex flex-col gap-3">
                <div className="font-bold text-sm">Section A</div>
                <hr
                  style={{
                    borderColor: "currentColor",
                    opacity: 0.12,
                    margin: "0 -4px",
                  }}
                />
                <div className="font-bold text-sm">Section B</div>
                <hr
                  style={{
                    borderColor: "currentColor",
                    opacity: 0.12,
                    margin: "0 -4px",
                  }}
                />
                <div className="font-bold text-sm">Section C</div>
              </div>
            </div>

            <div>
              <Label>
                Typical project card anatomy — header, badge, body, footer
              </Label>
              <div
                className="good-box flex flex-col gap-3 p-5"
                style={{ maxWidth: "420px" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-bold text-lg leading-tight">
                    Example Project
                  </h2>
                  <Chip>Residential</Chip>
                </div>
                <span className="text-xs font-mono purple-light-text">
                  your role: Architect
                </span>
                <p className="text-sm subtle-text">
                  A high-performance, healthy home designed for long-term
                  resilience.
                </p>
                <hr
                  style={{
                    borderColor: "currentColor",
                    opacity: 0.12,
                    margin: "0 -4px",
                  }}
                />
                <div className="flex gap-4 text-xs subtle-text">
                  <span>
                    <span className="font-bold purple-text">Start</span> Jan
                    2025
                  </span>
                  <span>→</span>
                  <span>
                    <span className="font-bold purple-text">Est. end</span> Dec
                    2025
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ── 5. Badges & Chips ──────────────────────────────────────────── */}
        <Section id="badges" title="05 · Badges & Chips">
          <div className="flex flex-col gap-6">
            <p className="text-xs font-mono subtle-text">
              Use <Code>{"<Chip />"}</Code> for category / filter tags and{" "}
              <Code>{"<Badge variant='...' />"}</Code> for semantic status
              labels. Both live in <Code>components/</Code>.
            </p>

            <div>
              <div className="text-xs font-mono mb-3 font-bold purple-text">
                {"<Chip>"} — category tag, neutral outline style
              </div>
              <Row>
                <Tile>
                  <Label>default</Label>
                  <Chip>Residential</Chip>
                </Tile>
                <Tile>
                  <Label>active</Label>
                  <Chip active>Commercial</Chip>
                </Tile>
                <Tile>
                  <Label>interactive (onClick)</Label>
                  <Chip onClick={() => {}}>Toggle me</Chip>
                </Tile>
              </Row>
            </div>

            <div>
              <div className="text-xs font-mono mb-3 font-bold purple-text">
                {"<Badge variant='...'>"} — semantic status indicator
              </div>
              <Row>
                <Tile>
                  <Label>neutral (default)</Label>
                  <Badge>In Progress</Badge>
                </Tile>
                <Tile>
                  <Label>success</Label>
                  <Badge variant="success">Complete</Badge>
                </Tile>
                <Tile>
                  <Label>warning</Label>
                  <Badge variant="warning">Pending</Badge>
                </Tile>
                <Tile>
                  <Label>danger</Label>
                  <Badge variant="danger">Overdue</Badge>
                </Tile>
                <Tile>
                  <Label>accent</Label>
                  <Badge variant="accent">New</Badge>
                </Tile>
              </Row>
            </div>

            <div className="good-box p-4">
              <div className="text-xs font-mono mb-3 font-bold purple-text">
                Label + value pattern — used in detail views
              </div>
              <div className="flex flex-col gap-2">
                {[
                  ["Budget", "$420,000 – $560,000"],
                  ["Address", "123 Main St, Portland, OR"],
                  ["Phase", "Design Development"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline gap-2">
                    <span
                      className="text-xs font-mono font-bold shrink-0 purple-text"
                      style={{ minWidth: "72px" }}
                    >
                      {label}
                    </span>
                    <span className="text-sm subtle-text">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── 6. Form Inputs ─────────────────────────────────────────────── */}
        <Section id="forms" title="06 · Form Inputs">
          <div className="flex flex-col gap-6">
            <p className="text-xs font-mono subtle-text">
              Use the <Code>{"<Input>"}</Code> component from{" "}
              <Code>components/Input.tsx</Code> for text and textarea fields. It
              wraps native elements with a consistent label+field layout.
            </p>

            <div
              className="good-box p-5 flex flex-col gap-5"
              style={{ maxWidth: "480px" }}
            >
              <div>
                <Label>{"<Input label='...' name='...' />"} — text field</Label>
                <div className="flex flex-col">
                  <label className="text-sm" htmlFor="demo-name">
                    Project Name
                  </label>
                  <input
                    id="demo-name"
                    type="text"
                    placeholder="e.g. Smith Residence"
                    autoComplete="off"
                    style={{ maxHeight: "40px" }}
                  />
                </div>
              </div>

              <div>
                <Label>
                  {"<Input type='textarea' label='...' name='...' />"} —
                  textarea
                </Label>
                <div className="flex flex-col">
                  <label className="text-sm" htmlFor="demo-notes">
                    Notes
                  </label>
                  <textarea
                    id="demo-notes"
                    placeholder="Additional details..."
                    style={{ minHeight: "90px" }}
                  />
                </div>
              </div>

              <div>
                <Label>Native select — rounded + padding style</Label>
                <div className="flex flex-col">
                  <label className="text-sm" htmlFor="demo-type">
                    Project Type
                  </label>
                  <select
                    id="demo-type"
                    className="rounded"
                    style={{
                      padding: "8px",
                      border: "1px solid var(--foreground)",
                      background: "var(--farground)",
                      color: "var(--purple)",
                    }}
                  >
                    <option>Residential</option>
                    <option>Commercial</option>
                    <option>Renovation</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>
                  Date input — <Code>type="date"</Code>
                </Label>
                <div className="flex flex-col">
                  <label className="text-sm" htmlFor="demo-date">
                    Start Date
                  </label>
                  <input type="date" id="demo-date" />
                </div>
              </div>

              <div>
                <Label>Inline form row — two fields side by side</Label>
                <div className="flex gap-3">
                  <div className="flex flex-col flex-1">
                    <label className="text-xs" style={{ opacity: 0.6 }}>
                      Min ($)
                    </label>
                    <input type="number" placeholder="0" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <label className="text-xs" style={{ opacity: 0.6 }}>
                      Max ($)
                    </label>
                    <input type="number" placeholder="0" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ── 7. Links ───────────────────────────────────────────────────── */}
        <Section id="links" title="07 · Links">
          <div className="flex flex-col gap-4">
            <div className="good-box p-5 flex flex-col gap-4">
              <Tile>
                <Label>.link class — green underline on hover</Label>
                <a href="#links" className="link text-sm">
                  View project details
                </a>
              </Tile>

              <Tile>
                <Label>Back navigation — font-mono, purple-light</Label>
                <a
                  href="#links"
                  className="text-sm font-mono purple-light-text"
                  style={{
                    textDecoration: "none",
                  }}
                >
                  ← back to projects
                </a>
              </Tile>

              <Tile>
                <Label>
                  NavLink active state — font-bold, purple color, midground bg
                </Label>
                <div
                  style={{
                    fontSize: "0.875rem",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    fontWeight: 700,
                    color: "var(--purple)",
                    background: "var(--farground)",
                    display: "inline-block",
                  }}
                >
                  Dashboard (active)
                </div>
              </Tile>

              <Tile>
                <Label>NavLink default — text-subtle, transparent bg</Label>
                <div
                  className="purple-light-text"
                  style={{
                    fontSize: "0.875rem",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    display: "inline-block",
                  }}
                >
                  All Projects
                </div>
              </Tile>
            </div>
          </div>
        </Section>

        {/* ── 8. Spacing ─────────────────────────────────────────────────── */}
        <Section id="spacing" title="08 · Spacing & Layout">
          <div className="flex flex-col gap-6">
            <p className="text-xs font-mono subtle-text">
              Spacing uses Tailwind's default scale. Common values used across
              the Fruits app:
            </p>

            <div className="good-box p-5">
              <div className="flex flex-col gap-3">
                {[
                  ["gap-2 / p-2", "8px", "Icon spacing, tight rows"],
                  ["gap-3 / p-3", "12px", "Card internal sections"],
                  ["gap-4 / p-4", "16px", "Card padding (small)"],
                  ["gap-5 / p-5", "20px", "Card padding (standard)"],
                  ["gap-6 / p-6", "24px", "Card padding (large)"],
                  ["px-4 py-12", "16px / 48px", "Page outer padding"],
                  ["mb-8", "32px", "Section separation on page"],
                  ["mb-12", "48px", "Major section separation"],
                ].map(([cls, px, usage]) => (
                  <div
                    key={cls}
                    className="flex items-start gap-4 text-xs font-mono subtle-text"
                  >
                    <span
                      className="shrink-0 purple-text"
                      style={{
                        minWidth: "140px",
                        fontWeight: 600,
                      }}
                    >
                      {cls}
                    </span>
                    <span className="shrink-0" style={{ minWidth: "52px" }}>
                      {px}
                    </span>
                    <span>{usage}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="good-box p-5">
              <div className="text-xs font-mono mb-3 font-bold purple-text">
                Max widths
              </div>
              <div className="flex flex-col gap-2 text-xs font-mono subtle-text">
                <div>
                  <span className="purple-text" style={{ fontWeight: 600 }}>
                    maxWidth: 420px
                  </span>{" "}
                  — single-column cards (ProjectCard)
                </div>
                <div>
                  <span className="purple-text" style={{ fontWeight: 600 }}>
                    maxWidth: 480px
                  </span>{" "}
                  — forms and detail panels
                </div>
                <div>
                  <span className="purple-text" style={{ fontWeight: 600 }}>
                    maxWidth: 640px
                  </span>{" "}
                  — detail page content area
                </div>
                <div>
                  <span className="purple-text" style={{ fontWeight: 600 }}>
                    maxWidth: 860px
                  </span>{" "}
                  — wide content, admin views
                </div>
                <div>
                  <span className="purple-text" style={{ fontWeight: 600 }}>
                    container mx-auto px-4
                  </span>{" "}
                  — standard page wrapper (always use)
                </div>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </AppLayout>
  );
}
