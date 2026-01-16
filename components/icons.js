import React from "react";

// ✅ Premium duotone icon base
const base =
  "w-5 h-5 stroke-current mr-2 fill-none stroke-[1.75]  stroke-linecap-round stroke-linejoin-round";

// ✅ Soft fill layer (duotone feel)
const softFill = "fill-current opacity-[0.10]";

export function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className={base} aria-hidden="true">
      {/* soft tiles */}
      <path
        className={softFill}
        d="M4 4h6a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
      />
      <path
        className={softFill}
        d="M14 4h6a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
      />
      <path
        className={softFill}
        d="M14 11h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"
      />
      <path
        className={softFill}
        d="M4 13h6a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2Z"
      />

      {/* outlines */}
      <rect x="3" y="3" width="8" height="8" rx="2.2" />
      <rect x="13" y="3" width="8" height="6" rx="2.2" />
      <rect x="13" y="10" width="8" height="11" rx="2.2" />
      <rect x="3" y="12" width="8" height="9" rx="2.2" />

      {/* tiny accent line */}
      <path d="M6 7h2" />
      <path d="M16 6h2" />
    </svg>
  );
}

export function HotelIcon() {
  return (
    <svg viewBox="0 0 24 24" className={base} aria-hidden="true">
      {/* soft building body */}
      <path
        className={softFill}
        d="M6 21V6.5A2.5 2.5 0 0 1 8.5 4H14a2.5 2.5 0 0 1 2.5 2.5V21H6Z"
      />
      {/* soft annex */}
      <path
        className={softFill}
        d="M16.5 10H19a2.5 2.5 0 0 1 2.5 2.5V21h-5V10Z"
      />

      {/* ground */}
      <path d="M3 21h18" />

      {/* main building */}
      <path d="M6 21V6.5A2.5 2.5 0 0 1 8.5 4H14a2.5 2.5 0 0 1 2.5 2.5V21" />

      {/* annex (right wing) */}
      <path d="M16.5 10H19a2.5 2.5 0 0 1 2.5 2.5V21" />

      {/* door */}
      <path d="M10 21v-4.2a1.6 1.6 0 0 1 1.6-1.6h.8A1.6 1.6 0 0 1 14 16.8V21" />

      {/* windows (stylish rounded squares) */}
      <path d="M9 8h.01M12 8h.01" />
      <path d="M9 11.5h.01M12 11.5h.01" />
      <path d="M9 15h.01M12 15h.01" />

      {/* star accent (hotel vibe) */}
      <path d="M18.5 7.2l.35.75.82.1-.6.55.16.8-.73-.4-.73.4.16-.8-.6-.55.82-.1.35-.75Z" />
    </svg>
  );
}

export function BookingIcon() {
  return (
    <svg viewBox="0 0 24 24" className={base} aria-hidden="true">
      {/* soft card */}
      <path
        className={softFill}
        d="M5 5h14a2.5 2.5 0 0 1 2.5 2.5V20A2.5 2.5 0 0 1 19 22H5A2.5 2.5 0 0 1 2.5 20V7.5A2.5 2.5 0 0 1 5 5Z"
      />

      {/* ticket/card outline */}
      <path d="M5 4h14a2 2 0 0 1 2 2v14.5a2.5 2.5 0 0 1-2.5 2.5H5.5A2.5 2.5 0 0 1 3 20.5V6a2 2 0 0 1 2-2Z" />

      {/* header strip */}
      <path d="M3 10h18" />

      {/* binding rings */}
      <path d="M8 2v4M16 2v4" />

      {/* check mark (booking confirmed vibe) */}
      <path d="M8.5 15.2l1.8 1.8 4.2-4.2" />

      {/* lines */}
      <path d="M8 18.5h8" />
    </svg>
  );
}
