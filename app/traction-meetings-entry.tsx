"use client";

import { ReferenceArt } from "./traction-reference-art";
import { useState } from "react";
import { ArrowRight, Building2, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, FileText, RefreshCw, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrganizationSummary } from "./traction-types";

type View = "month" | "week" | "list";
const weekDays = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const dateLabel = (date: Date) => date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
function moveMonth(date: Date, amount: number) {
  const first = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  return new Date(first.getFullYear(), first.getMonth(), Math.min(date.getDate(), new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()));
}

export function MeetingsEntry({ organizations, onCreate, onCompanies, onOpen, onRefresh }: {
  organizations: OrganizationSummary[]; onCreate: () => void; onCompanies: () => void; onOpen: (id: string) => void; onRefresh: () => Promise<void>;
}) {
  const [today] = useState(() => new Date());
  const [anchor, setAnchor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());
  const [view, setView] = useState<View>("month");
  const [companyId, setCompanyId] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const year = anchor.getFullYear(), month = anchor.getMonth();
  const first = new Date(year, month, 1);
  const daysCount = Math.ceil((first.getDay() + new Date(year, month + 1, 0).getDate()) / 7) * 7;
  const days = Array.from({ length: view === "week" ? 7 : daysCount }, (_, index) => view === "week" ? new Date(year, month, anchor.getDate() - anchor.getDay() + index) : new Date(year, month, index - first.getDay() + 1));
  const months = Array.from({ length: 60 }, (_, index) => new Date(year - 2, index, 1));
  const monthValue = `${year}-${String(month + 1).padStart(2, "0")}`;
  function changePeriod(amount: number) {
    const next = view === "week" ? new Date(year, month, anchor.getDate() + amount * 7) : moveMonth(anchor, amount);
    setAnchor(next); setSelected(next);
  }
  async function refresh() {
    setRefreshing(true); setError("");
    try { await onRefresh(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível atualizar as empresas. Tente novamente."); } finally { setRefreshing(false); }
  }
  return <div className="meetings-entry">
    <div className="meetings-entry-main">
      <section className="meetings-preview-calendar" aria-label="Prévia do calendário de reuniões">
        <header><span className="meetings-preview-label"><CalendarDays size={17} />Prévia do módulo</span><div className="meetings-calendar-period"><button aria-label="Período anterior" onClick={() => changePeriod(-1)}><ChevronLeft size={17} /></button><select aria-label="Escolher mês" value={monthValue} onChange={event => { const [y,m] = event.target.value.split("-").map(Number); const next = new Date(y,m - 1,1); setAnchor(next); setSelected(next); }}>{months.map(date => <option key={`${date.getFullYear()}-${date.getMonth()}`} value={`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,"0")}`}>{date.toLocaleDateString("pt-BR", {month:"long",year:"numeric"})}</option>)}</select><button aria-label="Próximo período" onClick={() => changePeriod(1)}><ChevronRight size={17} /></button></div><div className="meetings-calendar-views" role="group" aria-label="Visualização do calendário">{([["month","Mês"],["week","Semana"],["list","Lista"]] as const).map(([value,label]) => <button key={value} aria-pressed={view === value} onClick={() => setView(value)}>{label}</button>)}</div></header>
        {view === "list" ? <div className="meetings-calendar-list-empty"><CalendarDays size={30} /><h2>Suas próximas reuniões, em um só lugar.</h2><p>Selecione uma empresa para consultar a agenda, as pautas e as decisões.</p><Button variant="outline" onClick={onCompanies}>Selecionar empresa</Button></div> : <table className={`meetings-calendar-table ${view === "week" ? "week-view" : ""}`} aria-label={`Calendário de ${anchor.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}`}><thead><tr>{weekDays.map(day => <th scope="col" key={day}>{day}</th>)}</tr></thead><tbody>{Array.from({ length: days.length / 7 }, (_, row) => <tr key={row}>{days.slice(row * 7,row * 7 + 7).map(date => <td key={date.toISOString()} className={date.getMonth() !== month ? "outside-month" : ""}><button aria-label={`${dateLabel(date)}${sameDay(date,today) ? ", hoje" : ""}`} aria-pressed={sameDay(date,selected)} aria-current={sameDay(date,today) ? "date" : undefined} onClick={() => {setSelected(date); if (date.getMonth() !== month) setAnchor(date);}}><span>{date.getDate()}</span></button></td>)}</tr>)}</tbody></table>}
        <footer><span>{dateLabel(selected)}</span><span>Selecione uma empresa para ver os compromissos.</span></footer>
      </section>
      <section className="meetings-entry-invite" aria-labelledby="meetings-entry-invite-title"><div className="meetings-entry-invite-copy"><span aria-hidden="true" className="meetings-entry-accent" /><h2 id="meetings-entry-invite-title">Organize as<br />próximas conversas.</h2><p>{organizations.length ? "Abra uma empresa para reunir pautas, decisões e responsáveis." : "Cadastre uma empresa para reunir pautas, decisões e responsáveis."}</p><Button className="meetings-entry-create" onClick={onCreate}><Building2 size={19} />Cadastrar empresa<ChevronRight size={18} /></Button><Button variant="outline" className="meetings-entry-central" onClick={onCompanies}><Building2 size={19} />Central de empresas<ChevronRight size={18} /></Button></div><ReferenceArt name="meetings" className="meetings-reference-art" /></section>
    </div>
    <div className="meetings-entry-features"><div><span><FileText size={25} /></span><div><h2>Pautas</h2><p>Estruture os temas das reuniões de forma clara e objetiva.</p></div></div><div><span><CheckCircle2 size={25} /></span><div><h2>Decisões</h2><p>Registre o que foi decidido e mantenha o histórico.</p></div></div><div><span><UsersRound size={25} /></span><div><h2>Compromissos</h2><p>Defina responsáveis, prazos e acompanhe a evolução.</p></div></div></div>
    {error && <p className="meetings-entry-error" role="alert">{error}</p>}
    <footer className="meetings-entry-companies"><span className="meetings-company-count"><Building2 size={20} /><strong>Empresas</strong><b>{organizations.length}</b></span>{organizations.length ? <div className="meetings-company-picker"><select aria-label="Selecionar empresa para reuniões" value={companyId} onChange={event => setCompanyId(event.target.value)}><option value="">Selecione uma empresa</option>{organizations.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select><Button className="action-primary" disabled={!companyId} onClick={() => onOpen(companyId)}>Abrir reuniões<ArrowRight size={16} /></Button></div> : <p>Cadastre uma empresa para utilizar este módulo.</p>}<div className="meetings-entry-footer-actions"><Button variant="outline" onClick={refresh} disabled={refreshing}><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />{refreshing ? "Atualizando…" : "Atualizar"}</Button><Button className="action-primary" onClick={onCreate}><Building2 size={17} />Cadastrar empresa</Button></div></footer>
  </div>;
}
