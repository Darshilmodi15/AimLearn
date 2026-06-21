import { initials } from "../lib/format";

export function Avatar({
  name,
  src,
  size = "medium"
}: {
  name: string;
  src?: string;
  size?: "small" | "medium" | "large";
}) {
  return src ? (
    <img className={`avatar avatar-${size}`} src={src} alt="" />
  ) : (
    <span className={`avatar avatar-${size} avatar-fallback`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
