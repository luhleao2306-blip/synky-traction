import type { TractionRecord } from "./traction-model";
import { decisionsForCycle, latestProgress, priorityFor } from "./traction-flow";

export type ReportPlan = "gratuito" | "completo";
export type ReportItem = { title: string; detail: string; context?: string };
export type ReportSection = { title: string; introduction: string; items: ReportItem[]; empty: string };
export type TractionReport = {
  organization: string;
  generatedAt: string;
  plan: ReportPlan;
  metrics: { label: string; value: number; detail: string }[];
  highlights: string[];
  sections?: ReportSection[];
  method?: string;
};

const active = (records: TractionRecord[], kind: TractionRecord["kind"]) =>
  records.filter((record) => record.kind === kind && !record.archived_at);
const first = (value: string | undefined, fallback: string) => value?.trim().replace(/[.!?]+$/u, "") || fallback;
const amount = (count: number, singular: string, plural: string) => `${count} ${count === 1 ? singular : plural}`;
const displayDate = (value?: string) => value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}` : "não definida";

export function buildTractionReport(records: TractionRecord[], organization: string, plan: ReportPlan): TractionReport {
  const areas = active(records, "area");
  const roles = active(records, "role");
  const cycles = active(records, "cycle");
  const objectives = active(records, "objective");
  const priorities = active(records, "priority");
  const results = active(records, "result");
  const progress = active(records, "progress");
  const requests = active(records, "updateRequest");
  const initiatives = active(records, "initiative");
  const risks = active(records, "risk");
  const decisions = active(records, "decision");
  const vacancies = active(records, "vacancy");
  const people = active(records, "person");
  const assessments = active(records, "assessment");
  const development = active(records, "development");
  const reviews = active(records, "review");
  const currentCycle = cycles.find((record) => record.data.status === "Ativo") || cycles.find((record) => record.data.status === "Planejado");
  const currentPriorities = priorities.filter((record) => record.data.cycleId === currentCycle?.id);
  const currentPriorityIds = new Set(currentPriorities.map((record) => record.id));
  const currentResults = results.filter((record) => currentPriorityIds.has(record.data.priorityId));
  const currentRisks = risks.filter((record) => currentPriorityIds.has(priorityFor(record, records)) && record.data.status !== "Resolvido");
  const currentDecisions = decisionsForCycle(records, currentCycle?.id).filter((record) => record.data.status !== "Concluída");
  const names = new Map(records.map((record) => [record.id, record.title]));
  const name = (id?: string) => id ? names.get(id) || "Vínculo indisponível" : "Não vinculado";
  const completeRoles = roles.filter((record) => record.data.mission && record.data.competencies && record.data.criteria);
  const openRisks = risks.filter((record) => record.data.status !== "Resolvido");
  const pendingDecisions = decisions.filter((record) => record.data.status !== "Concluída");
  const assessed = assessments.filter((record) => record.data.evidence && record.data.criteriaEvidence);
  const updatedResults = currentResults.filter((record) => latestProgress(records, record.id)).length;
  const ownedAndMeasured = currentPriorities.filter((record) => record.data.owner && currentResults.some((result) => result.data.priorityId === record.id)).length;
  const metrics = [
    { label: "Prioridades do ciclo", value: currentPriorities.length, detail: `${currentPriorities.filter((record) => record.data.status === "Atenção").length} em atenção` },
    { label: "Resultados do ciclo", value: currentResults.length, detail: amount(updatedResults, "atualizado", "atualizados") },
    { label: "Riscos do ciclo", value: currentRisks.length, detail: "sem resolução registrada" },
    { label: "Decisões do ciclo", value: currentDecisions.length, detail: "aguardando conclusão" },
  ];
  const highlights = currentCycle ? [
    currentPriorities.length ? `Responsável e resultado verificável em ${ownedAndMeasured} de ${currentPriorities.length} ${currentPriorities.length === 1 ? "prioridade" : "prioridades"} de ${currentCycle.title}.` : `O ciclo ${currentCycle.title} ainda não tem prioridades registradas.`,
    currentPriorities.length && (currentPriorities.some((record) => record.data.status === "Atenção") || currentRisks.length || currentDecisions.length) ? `${amount(currentPriorities.filter((record) => record.data.status === "Atenção").length, "prioridade", "prioridades")} em atenção, ${amount(currentRisks.length, "risco sem resolução", "riscos sem resolução")} e ${amount(currentDecisions.length, "decisão pendente", "decisões pendentes")} neste ciclo.` : "Não há riscos nem decisões pendentes no ciclo atual.",
  ] : [
    cycles.length ? "Nenhum ciclo está em andamento. Os registros dos ciclos encerrados permanecem no histórico completo." : "Crie o primeiro ciclo e suas prioridades para acompanhar a execução.",
    cycles.length ? "Inicie um novo ciclo para acompanhar prioridades, riscos e decisões atuais." : "Os indicadores aparecem quando a empresa registra dados reais.",
  ];
  const base: TractionReport = { organization, generatedAt: new Date().toISOString(), plan, metrics, highlights };
  if (plan === "gratuito") return base;

  const sections: ReportSection[] = [
    {
      title: "01 · Estrutura e critérios",
      introduction: `${amount(areas.length, "área", "áreas")} e ${amount(roles.length, "cargo", "cargos")}. ${amount(completeRoles.length, "cargo possui", "cargos possuem")} os três campos essenciais para orientar uma avaliação.`,
      items: [
        ...areas.map((record) => ({ title: record.title, context: "Área", detail: `Papel: ${first(record.data.mission, "não definido")}. Responsável: ${first(record.data.lead, "não definido")}. Área superior: ${record.data.parentAreaId ? name(record.data.parentAreaId) : "não vinculada"}.` })),
        ...roles.map((record) => ({
        title: record.title,
        context: `${name(record.data.areaId)} · ${first(record.data.level, "Nível não informado")}`,
        detail: `Missão: ${first(record.data.mission, "pendente")}. Competências: ${first(record.data.competencies, "pendentes")}. Critérios de evolução: ${first(record.data.criteria, "pendentes")}. Medidas de sucesso: ${first(record.data.successMeasures, "pendentes")}.`,
        })),
      ],
      empty: "Nenhum cargo cadastrado. Comece pela descrição de cargos e critérios ligados ao trabalho.",
    },
    {
      title: "02 · Direção e execução",
      introduction: `${amount(cycles.length, "ciclo", "ciclos")}, ${amount(objectives.length, "objetivo", "objetivos")}, ${amount(priorities.length, "prioridade", "prioridades")} e ${amount(initiatives.length, "iniciativa", "iniciativas")}.`,
      items: [
        ...cycles.map((record) => ({ title: record.title, context: `Ciclo · ${first(record.data.status, "Sem situação")}`, detail: `Período: ${displayDate(record.data.startDate)} a ${displayDate(record.data.endDate)}. Contexto: ${first(record.data.description, "não registrado")}. Norte: ${first(record.data.vision, "não registrado")}. Aprendizados: ${first(record.data.learnings, "pendentes")}. Para o próximo ciclo: ${first(record.data.carryForward, "a definir")}.` })),
        ...objectives.map((record) => ({ title: record.title, context: `Objetivo · ${name(record.data.cycleId)}`, detail: `Direção: ${first(record.data.description, "não registrada")}. Responsável: ${first(record.data.owner, "não definido")}. Situação: ${first(record.data.status, "não definida")}.` })),
        ...priorities.map((record) => ({
        title: record.title,
        context: `${cycles.some((cycle) => cycle.id === record.data.cycleId && cycle.data.status === "Encerrado") ? first(record.data.closeOutcome, "Desfecho não classificado") : first(record.data.status, "Sem situação")} · ${name(record.data.objectiveId)} · ${name(record.data.areaId)}`,
        detail: `Resultado: ${first(record.data.outcome, "não definido")}. Justificativa: ${first(record.data.rationale, "não registrada")}. Impacto: ${first(record.data.impact, "não descrito")}. Dentro do escopo: ${first(record.data.inScope, "não definido")}. Fora do escopo: ${first(record.data.outOfScope, "não definido")}. Responsável: ${first(record.data.owner, "não definido")}. Próxima ação: ${first(record.data.nextAction, "não definida")}. Encerramento: ${first(record.data.closeOutcome, "pendente")}.`,
        })),
        ...results.map((record) => { const update = latestProgress(records, record.id); return { title: record.title, context: `Resultado · ${name(record.data.priorityId)}`, detail: `Esperado: ${first(record.data.outcome, "não definido")}. Indicador: ${record.data.indicator} (${record.data.indicatorKind || "classificação pendente"}; ${record.data.measureType || "tipo a definir"}). Inicial: ${first(record.data.baseline, "—")} ${record.data.unit}; último valor observado: ${update ? `${update.data.value} ${record.data.unit}` : "sem atualização"}; alvo: ${record.data.target} ${record.data.unit}. Período: ${displayDate(record.data.periodStart)} a ${displayDate(record.data.periodEnd)}. Fonte: ${first(record.data.source, "não informada")}. Responsável: ${first(record.data.owner, "não definido")}. Última atualização: ${update ? `${displayDate(update.data.observedAt)} por ${update.data.author}` : "não registrada"}. Alteração de alvo: ${first(record.data.changeReason, "nenhuma registrada")}.` }; }),
        ...initiatives.map((record) => ({ title: record.title, context: `Iniciativa · ${name(record.data.priorityId)}`, detail: `Equipe: ${first(record.data.team, "não informada")}. Marcos: ${first(record.data.milestones, "não definidos")}. Atualização: ${first(record.data.update, "não registrada")}. Responsável: ${first(record.data.owner, "não definido")}. Prazo: ${displayDate(record.data.due)}.`, })),
        ...progress.map((record) => ({ title: record.title, context: `Atualização · ${name(record.data.resultId || record.data.initiativeId || record.data.priorityId)} · ${displayDate(record.data.observedAt)}`, detail: `Valor: ${first(record.data.value, "não se aplica")}. Situação: ${first(record.data.status, "não definida")}. Contexto: ${first(record.data.note, "não informado")}. Próxima ação: ${first(record.data.nextAction, "não definida")}. Autor: ${first(record.data.author, "não registrado")}.` })),
      ],
      empty: "Nenhuma prioridade cadastrada. Defina resultados, indicadores e responsáveis para acompanhar o ciclo.",
    },
    {
      title: "03 · Contratações",
      introduction: `${amount(vacancies.length, "vaga", "vagas")} e ${amount(people.filter((record) => record.data.type === "Candidato").length, "candidatura registrada", "candidaturas registradas")}. O relatório descreve evidências; não classifica pessoas automaticamente.`,
      items: [
        ...vacancies.map((record) => ({
        title: record.title,
        context: `${first(record.data.status, "Sem etapa")} · ${name(record.data.roleId)}`,
        detail: `Motivo da vaga: ${first(record.data.reason, "não informado")}. Perguntas estruturadas: ${first(record.data.interviewQuestions, "pendentes")}. Critérios da entrevista: ${first(record.data.interviewRubric, "pendentes")}.`,
        })),
        ...people.filter((record) => record.data.type === "Candidato").map((record) => ({ title: record.title, context: `Candidatura · ${name(record.data.vacancyId)}`, detail: `Situação: ${first(record.data.status, "não informada")}. A avaliação, quando registrada, aparece na seção seguinte.` })),
      ],
      empty: "Nenhuma vaga cadastrada. Relacione uma necessidade do negócio a um cargo antes da seleção.",
    },
    {
      title: "04 · Avaliações e promoção",
      introduction: `${amount(assessments.length, "avaliação", "avaliações")}; ${assessed.length} com evidência e critérios observados registrados. Cada decisão permanece com a equipe responsável.`,
      items: assessments.map((record) => ({
        title: name(record.data.personId),
        context: `${first(record.data.type, "Avaliação")} · ${name(record.data.roleId)} · ${first(record.data.decision, "Em análise")}`,
        detail: `Critérios observados: ${first(record.data.criteriaEvidence, "não registrados")}. Evidências: ${first(record.data.evidence, "não registradas")}. Pontos a desenvolver: ${first(record.data.gaps, "não registrados")}. Próxima ação: ${first(record.data.nextStep, "não definida")}.`,
      })),
      empty: "Nenhuma avaliação registrada. Utilize critérios do cargo e evidências observáveis em cada conversa.",
    },
    {
      title: "05 · Desenvolvimento",
      introduction: `${amount(development.length, "plano de desenvolvimento registrado", "planos de desenvolvimento registrados")}.`,
      items: [
        ...people.filter((record) => record.data.type === "Colaborador").map((record) => ({ title: record.title, context: `Colaborador · ${name(record.data.areaId)}`, detail: `Cargo atual: ${name(record.data.currentRoleId)}. Situação: ${first(record.data.status, "não informada")}.` })),
        ...development.map((record) => ({
        title: record.title,
        context: `${name(record.data.personId)} · ${first(record.data.status, "Sem situação")}`,
        detail: `Objetivo: ${first(record.data.goal, "não definido")}. Ação prática: ${first(record.data.action, "não definida")}. Responsável: ${first(record.data.owner, "não definido")}. Prazo: ${displayDate(record.data.due)}.`,
        })),
      ],
      empty: "Nenhum plano registrado. Converta lacunas observadas em ações com responsável e prazo.",
    },
    {
      title: "06 · Riscos e decisões",
      introduction: `${amount(openRisks.length, "risco sem resolução registrada", "riscos sem resolução registrada")} e ${amount(pendingDecisions.length, "decisão ainda não concluída", "decisões ainda não concluídas")} no histórico da empresa.`,
      items: [
        ...risks.map((record) => ({ title: record.title, context: `Risco · ${name(priorityFor(record, records))} · ${first(record.data.status, "Sem situação")}`, detail: `Impacto: ${first(record.data.impact, "não informado")}. Próxima ação: ${first(record.data.nextAction, "não definida")}. Responsável: ${first(record.data.owner, "não definido")}. Dependência: ${name(record.data.dependencyAreaId)}. Escalonar para: ${first(record.data.escalateTo, "não definido")}.` })),
        ...decisions.map((record) => ({ title: record.title, context: `Decisão · ${name(priorityFor(record, records))} · ${first(record.data.status, "Sem situação")}`, detail: `Decidido: ${first(record.data.decision, "pendente")}. Justificativa: ${first(record.data.rationale, "não registrada")}. Quem decide: ${first(record.data.decisionMaker, "não definido")}. Responsável: ${first(record.data.owner, "não definido")}. Prazo: ${displayDate(record.data.due)}. Efeito: ${first(record.data.effect, "a acompanhar")}. Revisão: ${name(record.data.reviewId)}.` })),
      ],
      empty: "Não há riscos ou decisões pendentes nos registros atuais.",
    },
    {
      title: "07 · Próximos passos sugeridos",
      introduction: `Síntese das lacunas documentais e dos pontos que pedem acompanhamento. ${amount(reviews.length, "revisão já foi registrada", "revisões já foram registradas")}.`,
      items: [
        ...(!currentCycle && cycles.length ? [{ title: "Preparar o próximo ciclo", detail: `Consulte os aprendizados e revise explicitamente ${amount(priorities.filter((record) => record.data.closeOutcome === "Transferida").length, "prioridade transferida", "prioridades transferidas")} antes de definir novos compromissos.`, context: "Planejamento" }] : []),
        ...(roles.length === 0 ? [{ title: "Cadastrar o primeiro cargo", detail: "Defina a missão, as competências e os critérios do cargo antes de abrir vagas ou avaliar promoções.", context: "Estrutura" }] : completeRoles.length < roles.length ? [{ title: "Completar critérios dos cargos", detail: `${amount(roles.length - completeRoles.length, "cargo ainda precisa", "cargos ainda precisam")} de missão, competências ou critérios completos.`, context: "Estrutura" }] : []),
        ...(currentPriorities.some((record) => !currentResults.some((result) => result.data.priorityId === record.id && result.data.indicator && result.data.target && result.data.source)) ? [{ title: "Definir medidas das prioridades", detail: "Vincule a cada prioridade um resultado com indicador, alvo, fonte e responsável.", context: "Planejamento" }] : []),
        ...(vacancies.some((record) => !record.data.interviewQuestions || !record.data.interviewRubric) ? [{ title: "Padronizar entrevistas", detail: "Prepare perguntas e critérios antes de comparar candidaturas para a mesma vaga.", context: "Contratações" }] : []),
        ...(currentCycle && (currentPriorities.some((record) => record.data.status === "Atenção") || currentRisks.length || currentDecisions.length) ? [{ title: "Levar pendências à próxima revisão", detail: `${amount(currentPriorities.filter((record) => record.data.status === "Atenção").length, "prioridade", "prioridades")} em atenção, ${amount(currentRisks.length, "risco sem resolução", "riscos sem resolução")} e ${amount(currentDecisions.length, "decisão pendente", "decisões pendentes")}. Registre responsáveis e próximos passos.`, context: "Gestão" }] : []),
      ],
      empty: "Os campos principais estão preenchidos e não há pendências destacadas. Mantenha a revisão periódica dos dados.",
    },
    {
      title: "08 · Histórico de revisões",
      introduction: `${amount(reviews.length, "revisão registrada", "revisões registradas")}. Use este histórico para acompanhar decisões e aprendizados ao longo do tempo.`,
      items: [
        ...reviews.map((record) => ({ title: record.title, context: `${displayDate(record.data.meetingDate)} · ${name(record.data.cycleId)} · ${record.data.status || "Preparação"}`, detail: `Resumo: ${first(record.data.summary, "não registrado")}. Efeito anterior: ${first(record.data.outcome, "a verificar")}. Decisões vinculadas: ${decisions.filter((decision) => decision.data.reviewId === record.id).length}. Próxima revisão: ${displayDate(record.data.nextReview)}.` })),
        ...requests.map((record) => ({ title: record.title, context: `Solicitação · ${name(record.data.reviewId)} · ${record.data.status}`, detail: `Prioridade: ${name(record.data.priorityId)}. Responsável: ${record.data.ownerEmail}. Prazo: ${displayDate(record.data.due)}. Resposta: ${first(record.data.response, "pendente")}.` })),
      ],
      empty: "Nenhuma revisão registrada. Registre o resumo, os compromissos e a próxima data após cada reunião.",
    },
  ];
  return { ...base, sections, method: "Síntese dos registros ativos visíveis para seu perfil nesta empresa. Campos ausentes aparecem como pendentes. Este relatório apoia conversas e decisões humanas; não atribui nota nem recomenda automaticamente contratar ou promover alguém." };
}
