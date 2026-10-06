export const recordKinds = [
  "cycle", "objective", "area", "role", "priority", "result", "progress", "updateRequest", "initiative", "risk",
  "decision", "vacancy", "person", "assessment", "review", "development",
] as const;

export type RecordKind = (typeof recordKinds)[number];

export const allowedFields: Record<RecordKind, readonly string[]> = {
  cycle: ["startDate", "endDate", "status", "description", "vision", "cadence", "learnings", "carryForward", "closedAt"],
  objective: ["cycleId", "owner", "ownerEmail", "description", "rationale", "dependsOnId", "status"],
  area: ["lead", "mission", "parentAreaId"],
  role: ["areaId", "level", "mission", "outcomes", "competencies", "criteria", "successMeasures"],
  priority: ["cycleId", "objectiveId", "areaId", "owner", "ownerEmail", "due", "outcome", "indicator", "baseline", "target", "current", "source", "status", "riskReason", "nextAction", "rationale", "impact", "inScope", "outOfScope", "position", "changeReason", "closeOutcome"],
  result: ["priorityId", "owner", "ownerEmail", "outcome", "indicator", "indicatorKind", "measureType", "direction", "baseline", "target", "unit", "periodStart", "periodEnd", "source", "status", "riskReason", "nextAction", "changeReason", "verification"],
  progress: ["priorityId", "resultId", "initiativeId", "observedAt", "value", "note", "status", "riskReason", "nextAction", "author"],
  updateRequest: ["cycleId", "reviewId", "priorityId", "ownerEmail", "due", "status", "message", "response"],
  initiative: ["priorityId", "resultId", "areaId", "owner", "ownerEmail", "team", "due", "milestones", "dependsOnId", "status", "update", "riskReason", "nextAction"],
  risk: ["priorityId", "initiativeId", "owner", "ownerEmail", "impact", "nextAction", "due", "escalateTo", "dependencyAreaId", "status"],
  decision: ["priorityId", "riskId", "reviewId", "owner", "ownerEmail", "decisionMaker", "decision", "rationale", "due", "status", "effect", "decidedAt"],
  vacancy: ["roleId", "priorityId", "areaId", "reason", "status", "interviewQuestions", "interviewRubric", "openingDate"],
  person: ["areaId", "currentRoleId", "vacancyId", "type", "status", "startDate"],
  assessment: ["personId", "roleId", "vacancyId", "type", "evidence", "gaps", "decision", "nextStep", "interviewer", "assessedAt", "criteriaEvidence"],
  review: ["cycleId", "meetingDate", "facilitator", "summary", "decisions", "nextReview", "cadence", "status", "agenda", "outcome"],
  development: ["personId", "roleId", "goal", "action", "due", "status", "owner"],
};

export const references: Partial<Record<RecordKind, readonly [string, RecordKind][]>> = {
  objective: [["cycleId", "cycle"], ["dependsOnId", "objective"]],
  area: [["parentAreaId", "area"]],
  role: [["areaId", "area"]],
  priority: [["cycleId", "cycle"], ["objectiveId", "objective"], ["areaId", "area"]],
  result: [["priorityId", "priority"]],
  progress: [["priorityId", "priority"], ["resultId", "result"], ["initiativeId", "initiative"]],
  updateRequest: [["cycleId", "cycle"], ["reviewId", "review"], ["priorityId", "priority"]],
  initiative: [["priorityId", "priority"], ["resultId", "result"], ["areaId", "area"], ["dependsOnId", "initiative"]],
  risk: [["priorityId", "priority"], ["initiativeId", "initiative"], ["dependencyAreaId", "area"]],
  decision: [["priorityId", "priority"], ["riskId", "risk"], ["reviewId", "review"]],
  vacancy: [["roleId", "role"], ["priorityId", "priority"], ["areaId", "area"]],
  person: [["areaId", "area"], ["currentRoleId", "role"], ["vacancyId", "vacancy"]],
  assessment: [["personId", "person"], ["roleId", "role"], ["vacancyId", "vacancy"]],
  review: [["cycleId", "cycle"]],
  development: [["personId", "person"], ["roleId", "role"]],
};

export type TractionRecord = {
  id: string;
  organization_id: string;
  kind: RecordKind;
  title: string;
  data: Record<string, string>;
  created_at: string;
  updated_at: string;
  version: number;
  archived_at: string | null;
  created_by?: string;
  updated_by?: string;
};

export function labelFor(kind: RecordKind): string {
  return ({ cycle: "Ciclo", objective: "Objetivo", area: "Área", role: "Cargo", priority: "Prioridade", result: "Resultado", progress: "Atualização", updateRequest: "Solicitação de atualização", initiative: "Iniciativa", risk: "Risco", decision: "Decisão", vacancy: "Vaga", person: "Pessoa", assessment: "Avaliação", review: "Revisão", development: "Plano de desenvolvimento" })[kind];
}
