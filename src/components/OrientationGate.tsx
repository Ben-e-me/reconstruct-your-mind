// Shown only in portrait (via CSS). Landscape scales to fit, so nothing is cut off.
export function OrientationGate() {
  return (
    <div className="orientation-gate" aria-hidden="true">
      <svg className="phone-rotate" viewBox="0 0 44 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="2" width="36" height="68" rx="7" stroke="currentColor" strokeWidth="2.5" />
        <line x1="18" y1="9" x2="26" y2="9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <p className="orientation-text">This is a horizontal experience.</p>
    </div>
  )
}
