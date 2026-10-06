/* Native vector diagrams and standalone images keep every edge sharp at any size. */
import { Building2, ShieldCheck, SlidersHorizontal, UserRound } from "lucide-react";

type ArtName = "dashboard" | "companies" | "cycle" | "hiring" | "meetings" | "growth" | "admin";

export function ReferenceArt({ name, className = "" }: { name: ArtName; className?: string }) {
  const cls = `reference-original-art ${className}`;
  if (name === "companies" || name === "meetings" || name === "growth") {
    return <img aria-hidden="true" alt="" className={cls} src={`/images/${name}-reference-v96.png`} width={1200} height={600} />;
  }
  if (name === "dashboard") return <svg aria-hidden="true" className={cls} viewBox="0 0 320 200" fill="none">
    <defs><linearGradient id="reference-layer-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#b9e8c0" stopOpacity=".12"/><stop offset="1" stopColor="#a2d7b8" stopOpacity=".02"/></linearGradient></defs>
    <path d="M18 184C48 104 137 156 151 95S256 159 287 15" stroke="#a3c561" strokeWidth=".9" strokeDasharray="2 3"/>
    <g stroke="#cee7d9" strokeWidth="1" fill="url(#reference-layer-fill)">
      <path d="M71 145L158 109L246 145L158 182Z"/><path d="M72 96L158 62L244 96L158 132Z"/><path d="M78 47L158 14L239 47L158 81Z"/>
    </g>
    <path d="M158 37V157M122 47V145M278 14V69" stroke="#dcf0dd" strokeWidth="1" strokeDasharray="2 3"/>
    {[37,69,102].map(y => <circle key={y} cx="158" cy={y} r="3.5" fill="#d8f87a"/>)}
    <circle cx="122" cy="47" r="2" stroke="#ecfff1"/><circle cx="122" cy="96" r="3" fill="#d8f87a"/>
    <circle cx="158" cy="157" r="2.5" fill="#ecfff1"/>
    {[[278,14],[278,69],[18,184]].map(([x,y])=><circle key={x+y} cx={x} cy={y} r="3.5" fill="#d8f87a"/>)}
  </svg>;
  if (name === "cycle") return <svg aria-hidden="true" className={cls} viewBox="0 0 374 224" fill="none">
    <defs><linearGradient id="reference-cycle-card"><stop stopColor="#84cbb2" stopOpacity=".22"/><stop offset="1" stopColor="#84cbb2" stopOpacity=".09"/></linearGradient></defs>
    <path d="M0 153L84 224H374V135C275 145 243 185 220 224" fill="#2d8267" fillOpacity=".16"/>
    {[38,93,148].map((y,i)=><g key={y}><rect x={57-i*2} y={y} width={180+i*16} height="42" rx="9" fill="url(#reference-cycle-card)" stroke="#81bda6" strokeOpacity=".25"/><circle cx="79" cy={y+20} r="10.5" stroke="#d6eee2"/><rect x="104" y={y+14} width={101-i*11} height="4" rx="2" fill="#8bb9a8" fillOpacity=".65"/><rect x="104" y={y+24} width={71-i*10} height="4" rx="2" fill="#8bb9a8" fillOpacity=".4"/></g>)}
    <path d="M79 58V168M79 168C129 172 190 157 224 125S250 86 274 40" stroke="#d2ef9c" strokeWidth="1.2"/>
    <circle cx="274" cy="40" r="18" fill="#a6eaa1" fillOpacity=".1"/><circle cx="274" cy="40" r="5" fill="#dcf7a2"/>
    <circle cx="224" cy="125" r="8" fill="#e2ffb3" fillOpacity=".2"/><circle cx="224" cy="125" r="4.5" fill="#dcf7a2"/>
  </svg>;
  if (name === "hiring") return <svg aria-hidden="true" className={cls} viewBox="0 0 190 120" fill="none">
    <defs><linearGradient id="reference-profile-card" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#def6d5"/><stop offset="1" stopColor="#83c7a6"/></linearGradient></defs>
    <g transform="rotate(8 60 61)" opacity=".6"><rect x="30" y="27" width="65" height="76" rx="6" fill="url(#reference-profile-card)"/><circle cx="61" cy="50" r="12" fill="#418977"/><path d="M44 87H80M44 78H80M44 68H70" stroke="#468e7b" strokeWidth="4" strokeLinecap="round"/></g>
    <g transform="rotate(7 105 54)"><rect x="74" y="11" width="65" height="78" rx="6" fill="url(#reference-profile-card)"/><circle cx="106" cy="37" r="15" fill="#3e8e71"/><UserRound x="95" y="26" width="22" height="22" stroke="#dbf7cf" strokeWidth="2"/><path d="M86 63H121M86 72H121" stroke="#6ba487" strokeWidth="3" strokeLinecap="round"/></g>
    <circle cx="131" cy="64" r="23" fill="#f0ffd0" stroke="#c9f38a" strokeWidth="7"/><UserRound x="117" y="50" width="28" height="28" stroke="#367658" strokeWidth="2"/><path d="M149 82L168 105" stroke="#d9f69d" strokeWidth="9" strokeLinecap="round"/><path d="M169 47L180 43M172 57H183M168 67L177 72" stroke="#d8ee8f" strokeWidth="1.3"/>
  </svg>;
  return <svg aria-hidden="true" className={cls} viewBox="0 0 240 145" fill="none">
    <path d="M14 127V78H170V28H231V128H182" stroke="#9ecda9" strokeOpacity=".45"/>
    <rect x="37" y="47" width="161" height="84" rx="7" fill="#ffffff" fillOpacity=".025" stroke="#9dc9ac" strokeWidth=".8"/>
    <path d="M37 62H198" stroke="#9dc9ac" strokeWidth=".8"/>
    {[46,53,60].map(x=><circle key={x} cx={x} cy="54" r="1.7" stroke="#d4efa8" strokeWidth=".7"/>)}
    {[81,101,121].map(y=><g key={y}><circle cx="56" cy={y} r="4" stroke="#d4efa8"/><path d={`M69 ${y}H105`} stroke="#a1bea7" strokeWidth="2"/><circle cx="122" cy={y} r="4" stroke="#d4efa8"/><path d={`M135 ${y}H174`} stroke="#a1bea7" strokeWidth="2"/></g>)}
    <rect x="165" y="3" width="55" height="55" rx="8" fill="#075340" stroke="#9dc9ac" strokeWidth=".8"/><Building2 x="181" y="18" width="24" height="25" stroke="#d6eea7" strokeWidth="1.2"/>
    <rect x="165" y="83" width="55" height="55" rx="8" fill="#075340" stroke="#9dc9ac" strokeWidth=".8"/><ShieldCheck x="180" y="96" width="25" height="28" stroke="#d6eea7" strokeWidth="1.2"/>
    <SlidersHorizontal x="5" y="91" width="21" height="21" stroke="#9dc9ac" strokeWidth=".8" opacity=".45"/>
  </svg>;
}
