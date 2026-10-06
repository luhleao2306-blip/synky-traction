import type { RecordKind, TractionRecord } from "@/lib/traction-model";
import type { FormField } from "./traction-config";

export const formGroups: Record<RecordKind, { title: string; description: string; keys: string[] }[]> = {
  cycle: [{title:"Período",description:"Escolha quando o ciclo começa e termina.",keys:["startDate","endDate","status","cadence"]},{title:"Direção",description:"Defina o contexto e a direção do trabalho.",keys:["description","vision"]},{title:"Encerramento",description:"Registre o que aprendemos e o que vem depois.",keys:["learnings","carryForward"]}],
  objective: [{title:"Referências",description:"Conecte o objetivo ao ciclo e ao responsável.",keys:["cycleId","owner","ownerEmail","dependsOnId","status"]},{title:"Direção",description:"Explique a mudança que a empresa busca.",keys:["description","rationale"]}],
  area: [{title:"Área",description:"Defina a posição da equipe e sua responsabilidade.",keys:["parentAreaId","lead","mission"]}],
  role: [{title:"Cargo",description:"Identifique a área, o nível e a missão do cargo.",keys:["areaId","level","mission"]},{title:"Entregas e critérios",description:"Descreva o trabalho e as evidências de bom desempenho.",keys:["outcomes","competencies","successMeasures","criteria"]}],
  priority: [{title:"Referências",description:"Escolha o ciclo, o objetivo e a área.",keys:["cycleId","objectiveId","areaId"]},{title:"Escolha estratégica",description:"Defina a mudança esperada e os limites do trabalho.",keys:["outcome","rationale","impact","inScope","outOfScope"]},{title:"Execução",description:"Defina quem acompanha, o prazo e a próxima ação.",keys:["position","owner","ownerEmail","due","status","riskReason","nextAction","changeReason","closeOutcome"]}],
  result: [{title:"Resultado",description:"Escolha a prioridade e a mudança que será medida.",keys:["priorityId","outcome","indicator","indicatorKind"]},{title:"Medição",description:"Informe valor inicial, alvo e período da medição.",keys:["measureType","direction","baseline","target","unit","verification","periodStart","periodEnd","source"]},{title:"Acompanhamento",description:"Defina o responsável e como agir diante de riscos.",keys:["owner","ownerEmail","status","riskReason","nextAction","changeReason"]}],
  progress: [{title:"Item",description:"Atualize uma prioridade, um resultado ou uma iniciativa.",keys:["priorityId","resultId","initiativeId"]},{title:"Atualização",description:"Registre a observação e o próximo passo.",keys:["observedAt","value","note","status","riskReason","nextAction"]}],
  updateRequest: [{title:"Solicitação",description:"Escolha o item, a pessoa responsável e o prazo.",keys:["cycleId","reviewId","priorityId","ownerEmail","due","message"]},{title:"Resposta",description:"Acompanhe o retorno da pessoa responsável.",keys:["response","status"]}],
  initiative: [{title:"Referências",description:"Conecte o trabalho à prioridade e ao resultado.",keys:["priorityId","resultId","areaId","dependsOnId"]},{title:"Compromisso",description:"Defina responsável, equipe, prazo e entregas.",keys:["owner","ownerEmail","team","due","milestones"]},{title:"Andamento",description:"Registre o avanço e a próxima ação.",keys:["update","status","riskReason","nextAction"]}],
  risk: [{title:"Impacto",description:"Mostre o que está impedindo o avanço.",keys:["priorityId","initiativeId","impact","dependencyAreaId"]},{title:"Resolução",description:"Defina quem trata o risco, a ação e o prazo.",keys:["owner","ownerEmail","due","escalateTo","nextAction","status"]}],
  decision: [{title:"Contexto",description:"Conecte a decisão à prioridade, ao risco ou à reunião.",keys:["priorityId","riskId","reviewId"]},{title:"Decisão",description:"Registre quem decide, o prazo e a justificativa.",keys:["decisionMaker","due","status","decision","rationale","decidedAt"]},{title:"Execução",description:"Defina quem executa e qual efeito será acompanhado.",keys:["owner","ownerEmail","effect"]}],
  vacancy: [{title:"Vaga",description:"Conecte a necessidade ao cargo de referência.",keys:["roleId","areaId","priorityId","reason","openingDate","status"]},{title:"Entrevista",description:"Prepare perguntas e critérios consistentes.",keys:["interviewQuestions","interviewRubric"]}],
  teamTask: [{title:"Tarefa",description:"Defina a entrega, a pessoa e o prazo.",keys:["personId","description","due","status","response"]}],
  person: [{title:"Pessoa",description:"Identifique o vínculo e a posição na empresa.",keys:["type","vacancyId","areaId","currentRoleId","startDate","email","phone","status"]}],
  assessment: [{title:"Referências",description:"Escolha a pessoa e o cargo que será avaliado.",keys:["type","personId","roleId","vacancyId","interviewer","assessedAt"]},{title:"Evidências",description:"Relacione observações aos critérios do cargo.",keys:["criteriaEvidence","evidence","gaps"]},{title:"Próximo passo",description:"A decisão cabe à equipe responsável.",keys:["decision","nextStep"]}],
  review: [{title:"Agenda",description:"Escolha o ciclo, a data e quem conduz a reunião.",keys:["cycleId","meetingDate","cadence","facilitator","status","nextReview"]},{title:"Registro",description:"Documente a conversa e o efeito das decisões anteriores.",keys:["summary","outcome"]}],
  development: [{title:"Pessoa e cargo",description:"Conecte o plano ao colaborador e ao cargo pretendido.",keys:["personId","roleId"]},{title:"Plano de ação",description:"Defina um objetivo e uma ação que possam ser acompanhados.",keys:["goal","action","owner","due","status"]}],
};

export const titlePlaceholders: Record<RecordKind,string> = {
  teamTask:"Ex.: Preparar a pauta da próxima reunião",cycle:"Ex.: Ciclo estratégico — 4º trimestre",objective:"Ex.: Melhorar a experiência de contratação",area:"Ex.: Recursos Humanos",role:"Ex.: Analista de RH Pleno",priority:"Ex.: Reduzir o tempo de contratação",result:"Ex.: Tempo médio de contratação",progress:"Ex.: Atualização da seleção — outubro",updateRequest:"Ex.: Atualização das vagas abertas",initiative:"Ex.: Revisar o processo de entrevistas",risk:"Ex.: Atraso na aprovação das vagas",decision:"Ex.: Aprovar abertura da vaga",vacancy:"Ex.: Analista de RH — time de Pessoas",person:"Nome completo",assessment:"Ex.: Avaliação para Analista de RH",review:"Ex.: Revisão semanal do ciclo",development:"Ex.: Plano de desenvolvimento — liderança",
};

export function fieldMaxLength(key:string) {return ["evidence","summary","interviewQuestions","criteriaEvidence","description"].includes(key)?4000:1600;}

export function conditionalFields(kind:RecordKind,fields:FormField[],data:Record<string,string>,editing:boolean,replyOnly:boolean) {
  const atRisk=["Atenção","Em risco","Bloqueado"].includes(data.status);
  return fields.filter(field=>{
    if(replyOnly) return ["response","status"].includes(field.key);
    if(kind==="cycle" && ["learnings","carryForward"].includes(field.key)) return data.status==="Encerrado" || !!data[field.key];
    if(["priority","result","progress","initiative"].includes(kind) && ["riskReason","nextAction"].includes(field.key)) return atRisk || !!data[field.key];
    if(field.key==="changeReason") return editing || !!data[field.key];
    if(field.key==="closeOutcome") return editing || data.status==="Concluída" || !!data[field.key];
    if(kind==="result" && field.key==="verification") return data.measureType==="Verificável" || !!data.verification;
    if(kind==="progress" && field.key==="value") return !!data.resultId;
    return true;
  }).map(field=>({...field,required:field.required || (atRisk && ["riskReason","nextAction"].includes(field.key)) || (kind==="cycle" && data.status==="Encerrado" && field.key==="learnings") || (kind==="decision" && data.status!=="Pendente" && field.key==="decision") || (kind==="review" && data.status==="Concluída" && field.key==="summary") || (kind==="updateRequest" && data.status==="Respondida" && field.key==="response") || (kind==="progress" && !!data.resultId && field.key==="value")}));
}

export function recordFormErrors(kind:RecordKind,title:string,data:Record<string,string>,fields:FormField[],records:TractionRecord[],previous?:TractionRecord|null) {
  const errors:Record<string,string>={};
  if(title.trim().length<2) errors.title="Informe pelo menos 2 caracteres.";
  for(const field of fields) {
    const value=data[field.key]?.trim() || "";
    if(field.required && !value) errors[field.key]=field.type==="select" ? "Selecione uma opção." : "Preencha este campo.";
    if(value && field.type==="select" && !field.options?.some(option=>option.value===value)) errors[field.key]="Escolha uma opção disponível neste contexto.";
    if(value && field.type==="date") {
      const date=new Date(`${value}T12:00:00Z`);
      if(!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime()) || date.toISOString().slice(0,10)!==value) errors[field.key]="Informe uma data válida.";
    }
  }
  if(data.ownerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.ownerEmail.trim())) errors.ownerEmail="Informe um email válido.";
  if(kind==="cycle" && data.startDate && data.endDate && data.endDate<data.startDate) errors.endDate="O fim não pode ser anterior ao início.";
  if(kind==="result" && data.periodStart && data.periodEnd && data.periodEnd<data.periodStart) errors.periodEnd="O fim da medição não pode ser anterior ao início.";
  const numeric=kind==="result" && data.measureType==="Número" ? ["baseline","target"] : kind==="progress" && records.find(r=>r.id===data.resultId)?.data.measureType==="Número" ? ["value"] : [];
  for(const key of numeric) if(data[key]?.trim() && !Number.isFinite(Number(data[key]))) errors[key]="Informe um número válido. Use ponto para casas decimais.";
  if(kind==="progress" && [data.priorityId,data.resultId,data.initiativeId].filter(Boolean).length!==1) errors.priorityId="Escolha exatamente um item para atualizar.";
  if(kind==="risk" && !data.priorityId && !data.initiativeId) errors.priorityId="Selecione uma prioridade ou uma iniciativa.";
  if(previous && kind==="priority" && data.position!==previous.data.position && (!data.changeReason?.trim() || data.changeReason.trim()===previous.data.changeReason?.trim())) errors.changeReason="Adicione uma nova justificativa para a mudança de ordem.";
  if(previous && kind==="result" && data.target!==previous.data.target && (!data.changeReason?.trim() || data.changeReason.trim()===previous.data.changeReason?.trim())) errors.changeReason="Adicione uma nova justificativa para a alteração do alvo.";
  return errors;
}
