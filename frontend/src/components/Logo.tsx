import { Link } from "react-router-dom";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="logo" to="/" aria-label="AimLearn home">
      <span className="logo-mark" aria-hidden="true">
        A
      </span>
      {compact ? null : <span>AimLearn</span>}
    </Link>
  );
}
