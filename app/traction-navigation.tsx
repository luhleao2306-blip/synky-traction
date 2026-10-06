"use client";
/* eslint-disable @next/next/no-img-element -- Authenticated company logos use their private image route. */

import { Building2, type LucideIcon } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { SynkyLogo, SynkySymbol } from "./synky-logo";
import type { Section, Workspace } from "./traction-types";
import { defaultBrand } from "@/lib/traction-brand";

type Item = { id: Section; label: string; description: string; icon: LucideIcon; group: string };
type Props = { section: Section; navigate: (section: Section) => void; workspace: Workspace | null; loading: boolean; preview: boolean; isMaster: boolean; masterView: boolean; onMaster: () => void; onCreateOrganization: () => void; displayName: string; items: Item[] };

export function TractionNavigation(props: Props) {
  const { section, navigate, workspace, loading, preview, isMaster, masterView, onMaster, onCreateOrganization, displayName, items } = props;
  const { setOpenMobile } = useSidebar();
  const roleLabel = isMaster ? "Administrador master" : workspace ? { admin: "Administrador", direcao: "Direção", gestor: "Gestor de área", responsavel: "Responsável", leitor: "Leitor" }[workspace.role] : preview ? "Prévia pública" : "Configuração inicial";
  const go = (action: () => void) => { action(); setOpenMobile(false); };
  const initials = displayName.trim().split(/\s+/).slice(0, 2).map(value => value[0]).join("").toUpperCase();
  const company = !masterView ? workspace?.organization : undefined;
  return <Sidebar collapsible="icon" className="synky-sidebar premium-sidebar" style={{ "--tenant-sidebar": company?.brand_sidebar || defaultBrand.sidebar, "--tenant-primary": company?.brand_primary || defaultBrand.primary } as React.CSSProperties}>
    <SidebarHeader className="premium-sidebar-brand">
      {company ? <div className={`tenant-identity ${company.brand_logo_url ? "has-logo" : ""}`}>
        <div className="tenant-identity-visual">{company.brand_logo_url ? <img src={company.brand_logo_url} alt={`Logo de ${company.name}`} /> : <Building2 size={22} aria-hidden="true" />}</div>
        <div className="tenant-identity-copy"><span>Empresa ativa</span><strong className="tenant-company-name" title={company.name}>{company.name}</strong></div>
      </div> : <div className="premium-product-logo"><SynkyLogo /></div>}
      <div className="premium-product-symbol">{company ? <span className="tenant-product-symbol" title={company.name}>{company.brand_logo_url ? <img src={company.brand_logo_url} alt={`Logo de ${company.name}`} /> : <Building2 size={22} aria-label={company.name} />}</span> : <SynkySymbol />}</div>
      {(!company || company.brand_tagline) && <span className="premium-product-caption">{company ? company.brand_tagline : "Pessoas, estrutura e resultados"}</span>}
    </SidebarHeader>
    <SidebarContent className="premium-sidebar-content">
      {["COMEÇAR", "PLANEJAR", "PESSOAS"].map(group => {
        const groupItems = items.filter(item => item.group === group && item.id !== "guide");
        if (!groupItems.length) return null;
        const groupLabel = { COMEÇAR: "Visão geral", PLANEJAR: "Gestão e execução", PESSOAS: "Estrutura e pessoas" }[group];
        return <SidebarGroup key={group}><SidebarGroupLabel>{groupLabel}</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{groupItems.map(item => <SidebarMenuItem key={item.id}><SidebarMenuButton className="premium-nav-button" aria-label={item.label} tooltip={item.description} isActive={!masterView && section === item.id} aria-current={!masterView && section === item.id ? "page" : undefined} onClick={() => go(() => navigate(item.id))}><item.icon size={19} /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}{group === "COMEÇAR" && isMaster && <SidebarMenuItem><SidebarMenuButton className="premium-nav-button premium-master-button" isActive={masterView} aria-current={masterView ? "page" : undefined} aria-label="Central de empresas" tooltip="Central de empresas" onClick={() => go(onMaster)}><Building2 size={19} /><span>Central de empresas</span></SidebarMenuButton></SidebarMenuItem>}</SidebarMenu></SidebarGroupContent></SidebarGroup>;
      })}
    </SidebarContent>
    <SidebarFooter className="premium-sidebar-footer">
      {items.filter(item => item.group === "SISTEMA" || item.id === "guide").map(item => <SidebarMenu key={item.id}><SidebarMenuItem><SidebarMenuButton className="premium-nav-button premium-settings-button" aria-label={item.label} tooltip={item.label} isActive={!masterView && section === item.id} aria-current={!masterView && section === item.id ? "page" : undefined} onClick={() => go(() => navigate(item.id))}><item.icon size={19} /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu>)}
      {!workspace && !isMaster && !loading && <button className="premium-start-button" onClick={() => go(onCreateOrganization)}><Building2 size={17} /><span>{preview ? "Acessar o painel" : "Cadastrar empresa"}</span></button>}
      <div className="premium-account"><span className="premium-account-avatar">{initials || "ST"}</span><span className="premium-account-copy"><strong title={displayName}>{displayName}</strong><small>{loading ? "Preparando acesso…" : roleLabel}</small></span></div>
    </SidebarFooter>
  </Sidebar>;
}
