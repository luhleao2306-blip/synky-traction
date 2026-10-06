import type { TractionRecord } from "./traction-model";

export type AccessScope = { role: string; email: string; area_id: string | null };
const personalKinds = ["person", "assessment", "development", "vacancy"];

export function recordArea(record: TractionRecord, byId: Map<string, TractionRecord>, depth = 0): string | null {
  if (depth > 5) return null;
  if (record.kind === "area") return record.id;
  if (record.data.areaId) return record.data.areaId;
  const link = record.kind === "assessment" ? record.data.roleId || record.data.personId
    : record.kind === "development" ? record.data.personId || record.data.roleId
    : record.kind === "person" ? record.data.currentRoleId || record.data.vacancyId
    : record.kind === "vacancy" ? record.data.roleId
    : ["initiative", "result", "progress", "updateRequest", "risk", "decision"].includes(record.kind) ? record.data.priorityId || record.data.initiativeId || record.data.resultId || record.data.riskId : "";
  const target = byId.get(link);
  return target ? recordArea(target, byId, depth + 1) : null;
}

export function recordCycle(record: Pick<TractionRecord, "id" | "kind" | "data">, byId: Map<string, TractionRecord>, depth = 0): string | null {
  if (depth > 6) return null;
  if (record.kind === "cycle") return record.id;
  if (record.data.cycleId) return record.data.cycleId;
  for (const key of ["priorityId", "resultId", "initiativeId", "riskId", "reviewId"]) {
    const target = byId.get(record.data[key]);
    if (target) return recordCycle(target, byId, depth + 1);
  }
  return null;
}

export function canReadRecord(scope: AccessScope, record: TractionRecord, byId: Map<string, TractionRecord>) {
  if (scope.role === "admin") return true;
  if (["leitor", "direcao", "responsavel"].includes(scope.role)) return !personalKinds.includes(record.kind) && (record.kind !== "updateRequest" || scope.role === "direcao" || (scope.role === "responsavel" && record.data.ownerEmail?.toLowerCase() === scope.email.toLowerCase()));
  if (scope.role !== "gestor") return false;
  const area = recordArea(record, byId);
  if (personalKinds.includes(record.kind) && (!area || area !== scope.area_id)) return false;
  if (["assessment", "development"].includes(record.kind)) {
    const person = byId.get(record.data.personId);
    if (!person || recordArea(person, byId) !== scope.area_id) return false;
  }
  return !area || area === scope.area_id;
}

export function canWriteRecord(scope: AccessScope, record: TractionRecord, byId: Map<string, TractionRecord>) {
  if (scope.role === "admin") return true;
  if (scope.role === "direcao") return !["area", "role", ...personalKinds].includes(record.kind);
  if (scope.role === "responsavel") {
    if (["updateRequest", "initiative"].includes(record.kind)) return record.data.ownerEmail?.toLowerCase() === scope.email.toLowerCase();
    if (record.kind === "progress") {
      const parent = byId.get(record.data.resultId || record.data.initiativeId || record.data.priorityId);
      return !!parent && parent.data.ownerEmail?.toLowerCase() === scope.email.toLowerCase();
    }
    return false;
  }
  if (scope.role !== "gestor" || !scope.area_id) return false;
  const area = recordArea(record, byId);
  if (!area || area !== scope.area_id || ["area", "cycle", "objective", "review"].includes(record.kind)) return false;
  if (["assessment", "development"].includes(record.kind)) {
    const person = byId.get(record.data.personId);
    if (!person || recordArea(person, byId) !== scope.area_id) return false;
  }
  return true;
}
