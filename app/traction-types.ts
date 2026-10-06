import type { RecordKind, TractionRecord } from "@/lib/traction-model";

export type Section = "team" | "overview" | "guide" | "planning" | "structure" | "hiring" | "promotions" | "reviews" | "results" | "admin";
export type PersonType = "Candidato" | "Colaborador";
export type OrganizationSummary = { id: string; name: string; role: string; area_id: string | null };
export type MemberRow = { email: string; name: string; role: string; area_id: string | null; user_id: string | null; has_account?: number };
export type AuditRow = { id: string; record_id: string | null; action: string; actor: string; created_at: string; before: string | null; after: string | null };
export type Workspace = {
  organization: { id: string; name: string; created_by: string; retention_days: number | null; privacy_contact: string; reportPlan: "gratuito" | "completo"; brand_primary: string; brand_sidebar: string; brand_tagline: string; brand_logo_url: string | null };
  role: "admin" | "direcao" | "gestor" | "responsavel" | "leitor";
  areaId: string | null;
  currentUser: { id: string; email: string; name: string };
  records: TractionRecord[];
  members: MemberRow[];
  audit: AuditRow[];
};

export type SectionProps = {
  section: Section;
  records: TractionRecord[];
  workspace: Workspace | null;
  demo: boolean;
  onCreate: (kind: RecordKind, personType?: PersonType, preset?: Record<string, string>) => void;
  canCreate: (kind: RecordKind) => boolean;
  onOpen: (record: TractionRecord) => void;
  onNavigate: (section: Section) => void;
  onCreateOrganization: () => void;
  onExport: () => void;
  onPrint: () => void;
  onPost: (payload: Record<string, unknown>) => Promise<unknown>;
  onReload: () => Promise<void>;
  onManageMember: (member?: MemberRow) => void;
  onRemoveMember: (member: MemberRow) => void;
  onProvisionMember: (member: MemberRow) => void;
};
