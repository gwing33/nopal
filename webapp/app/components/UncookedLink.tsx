import { ReactNode } from "react";
import { Link } from "@remix-run/react";

export function UncookedLink({
  externalUrl,
  to,
  children,
}: {
  externalUrl?: string;
  to?: string;
  children: React.ReactNode;
}) {
  if (externalUrl) {
    return (
      <Container>
        <a href={externalUrl} target="_blank">
          {children}
        </a>
      </Container>
    );
  }
  if (to) {
    return (
      <Container>
        <Link to={to} className="link">
          {children}
        </Link>
      </Container>
    );
  }
  return <Container disabled={true}>{children} coming soon.</Container>;
}

function Container({
  children,
  disabled,
}: {
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className={`${!disabled && "link"} pb-12 sm:pb-0`}>{children}</div>
  );
}
