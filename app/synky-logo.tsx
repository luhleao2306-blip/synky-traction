/* eslint-disable @next/next/no-img-element -- Use the exact logo supplied by the brand owner. */

export function SynkyLogo({ className = "" }: { className?: string }) {
  return <img className={`synky-wordmark ${className}`} src="/synky-traction-logo-transparent.png" width={2171} height={724} alt="Synky Traction" />;
}

export function SynkySymbol({ className = "" }: { className?: string }) {
  return <span className={`synky-symbol ${className}`} role="img" aria-label="Símbolo Synky Traction"><img src="/synky-traction-logo-transparent.png" width={2171} height={724} alt="" /></span>;
}
