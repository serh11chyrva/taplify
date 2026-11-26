export function TaplifyIcon({ className, viewBox = "0 0 160 160" }: { className: string; viewBox?: string }) {
  return (
    <svg className={className} viewBox={viewBox} aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M144 18 105 72 140 84 101 98 93 136 72 104 28 126 50 92 18 76 59 68 68 36 86 63Z"
      />
    </svg>
  );
}
