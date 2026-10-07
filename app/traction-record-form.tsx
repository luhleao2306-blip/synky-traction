"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Building2, Check, ClipboardCheck, FileText, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RecordKind, TractionRecord } from "@/lib/traction-model";
import type { MemberRow, PersonType } from "./traction-types";
import { formSpec } from "./traction-config";
import { conditionalFields, fieldMaxLength, formGroups, recordFormErrors, titlePlaceholders } from "./traction-form-model";

const emptyReferences:Record<string,string>={cycleId:"Cadastre um ciclo no Plano do ciclo.",objectiveId:"Cadastre um objetivo no ciclo selecionado.",priorityId:"Cadastre uma prioridade no Plano do ciclo.",areaId:"Cadastre uma área em Áreas e cargos.",roleId:"Cadastre um cargo em Áreas e cargos.",personId:"Cadastre uma pessoa neste módulo.",vacancyId:"Cadastre uma vaga em Contratações.",resultId:"Defina um resultado na prioridade.",initiativeId:"Cadastre uma iniciativa na prioridade."};

export function RecordForm({kind,title,data,records,personType,selected,replyOnly,saving,companyName,members,onTitle,onData,onSelect,onSave,onCancel}: {
  kind:RecordKind; title:string; data:Record<string,string>; records:TractionRecord[]; personType:PersonType; selected:TractionRecord|null; replyOnly:boolean; saving:boolean; companyName:string; members:MemberRow[];
  onTitle:(value:string)=>void; onData:(key:string,value:string)=>void; onSelect:(key:string,value:string)=>void; onSave:()=>Promise<void>; onCancel:()=>void;
}) {
  const [step,setStep]=useState(0);
  const [checked,setChecked]=useState<string[]>([]);
  const [serverError,setServerError]=useState("");
  const [focusKey,setFocusKey]=useState("");
  const root=useRef<HTMLFormElement>(null);
  const fields=useMemo(()=>conditionalFields(kind,formSpec(kind,records,personType,data,selected?.id),data,!!selected,replyOnly),[kind,records,personType,data,selected,replyOnly]);
  const groups=formGroups[kind].map(group=>({...group,fields:group.keys.map(key=>fields.find(field=>field.key===key)).filter(field=>!!field)})).filter(group=>group.fields.length);
  const review=step>=groups.length;
  const current=groups[Math.min(step,groups.length-1)];
  const errors=recordFormErrors(kind,title,data,fields,records,selected);
  const required=fields.filter(field=>field.required);
  const requiredTotal=required.length+1;
  const filled=required.filter(field=>data[field.key]?.trim() && !errors[field.key]).length+(title.trim().length>=2?1:0);
  const linkedPerson=records.find(record=>record.id===data.personId);
  const linkedRole=records.find(record=>record.id===(data.roleId||data.currentRoleId));
  const currentRole=records.find(record=>record.id===linkedPerson?.data.currentRoleId);
  const human=["assessment","development"].includes(kind);
  useEffect(()=>{setStep(value=>Math.min(value,groups.length));},[groups.length]);
  useEffect(()=>{setServerError("");},[title,data]);
  useEffect(()=>{if(focusKey) { root.current?.querySelector<HTMLElement>(`#record-${focusKey}`)?.focus(); setFocusKey(""); }},[focusKey,step]);

  function validate(keys:string[]) {
    setChecked(previous=>[...new Set([...previous,...keys])]);
    const first=keys.find(key=>errors[key]);
    if(first) {
      setStep(first==="title"?0:Math.max(0,groups.findIndex(group=>group.fields.some(field=>field.key===first))));
      setFocusKey(first); return false;
    }
    return true;
  }
  function next() { if(validate([...(step===0 && !replyOnly?["title"]:[]),...current.fields.map(field=>field.key)])) setStep(step+1); }
  async function submit() {
    if(saving) return;
    if(!review) {next();return;}
    if(!validate(["title",...fields.map(field=>field.key)])) return;
    try {setServerError("");await onSave();} catch(error) {setServerError(error instanceof Error?error.message:"Não foi possível salvar. Seus campos foram mantidos; tente novamente.");}
  }
  const titleLabel=kind==="person"?"Nome completo":"Título";
  function displayed(key:string,value:string) {
    if(key.endsWith("Id")) return records.find(record=>record.id===value)?.title || "Registro indisponível";
    const field=fields.find(item=>item.key===key);
    if(field?.type==="date") return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
    return value;
  }
  return <form ref={root} className="record-studio" noValidate onSubmit={event=>{event.preventDefault();void submit();}}>
    <nav className="record-studio-steps" aria-label="Etapas do preenchimento">{[...groups.map(group=>group.title),"Revisar"].map((name,index)=><button key={name} type="button" disabled={saving} aria-current={step===index?"step":undefined} onClick={()=>{setStep(index);}}><span>{index<step?<Check size={14}/>:index+1}</span><b>{name}</b></button>)}</nav>
    <div className="record-studio-layout">
      <main className="record-studio-main" aria-live="polite">
        {serverError && <div className="record-studio-error" role="alert"><AlertCircle size={18}/><div><strong>O registro não foi salvo</strong><p>{serverError}</p></div></div>}
        {!review ? <>
          <header className="record-step-heading"><span>ETAPA {step+1} DE {groups.length+1}</span><h3>{current.title}</h3><p>{current.description}</p></header>
          <div className="record-fields">
            {step===0 && <div className="record-field record-field-wide"><label htmlFor="record-title">{titleLabel}<span>Obrigatório</span></label><Input id="record-title" autoFocus value={title} disabled={saving} readOnly={replyOnly} maxLength={160} placeholder={titlePlaceholders[kind]} aria-required="true" aria-invalid={checked.includes("title") && !!errors.title} aria-describedby={checked.includes("title") && errors.title?"record-title-error":undefined} onChange={event=>onTitle(event.target.value)}/>{checked.includes("title") && errors.title && <small id="record-title-error" className="record-field-error">{errors.title}</small>}</div>}
            {current.fields.map(field=>{
              const error=checked.includes(field.key)?errors[field.key]:"";
              const helpId=`record-${field.key}-help`;
              const missingOptions=field.type==="select" && !field.options?.length;
              const inputMode=["baseline","target","value"].includes(field.key) && (kind==="result" && data.measureType==="Número" || kind==="progress" && records.find(record=>record.id===data.resultId)?.data.measureType==="Número")?"decimal":field.key==="position"?"numeric":undefined;
              const props={id:`record-${field.key}`,disabled:saving,"aria-required":!!field.required,"aria-invalid":!!error,"aria-describedby":`${helpId}${error?` record-${field.key}-error`:""}`};
              return <div className={`record-field ${field.type==="textarea"?"record-field-wide":""}`} key={field.key}><label htmlFor={`record-${field.key}`}>{field.label}<span>{field.required?"Obrigatório":"Opcional"}</span></label>
                {field.type==="textarea"?<Textarea {...props} value={data[field.key]||""} rows={3} maxLength={fieldMaxLength(field.key)} placeholder={field.placeholder} onChange={event=>onData(field.key,event.target.value)}/>:field.type==="select"?<Select value={data[field.key] || "none"} onValueChange={value=>onSelect(field.key,value)} disabled={saving || missingOptions}><SelectTrigger {...props} disabled={saving || missingOptions}><SelectValue placeholder="Selecione"/></SelectTrigger><SelectContent><SelectItem value="none">{!field.required && field.key.endsWith("Id")?"Sem vínculo":"Selecione…"}</SelectItem>{field.options?.map(option=><SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>:<Input {...props} type={field.type==="date"?"date":field.key==="ownerEmail"?"email":"text"} inputMode={inputMode} list={field.key==="ownerEmail"?"record-member-emails":undefined} value={data[field.key]||""} maxLength={field.type==="date"?undefined:fieldMaxLength(field.key)} onInput={field.type==="date"?event=>onData(field.key,event.currentTarget.value):undefined} placeholder={field.placeholder} onChange={event=>onData(field.key,event.target.value)}/>}{field.type==="textarea" && <small className="record-character-count">{(data[field.key]||"").length} / {fieldMaxLength(field.key)}</small>}<small id={helpId} className="record-field-help">{missingOptions?emptyReferences[field.key]||"Nenhum registro disponível para este vínculo.":field.hint}</small>{error && <small className="record-field-error" id={`record-${field.key}-error`}>{error}</small>}</div>;
            })}
          </div>
          {checked.some(key=>errors[key] && (current.fields.some(field=>field.key===key) || step===0 && key==="title")) && <p className="record-validation-message" role="alert">Revise os campos destacados para continuar.</p>}
        </>:<>
          <header className="record-step-heading"><span>ANTES DE SALVAR</span><h3>Confira o registro</h3><p>{Object.keys(errors).length?"Ainda há informações que precisam ser preenchidas ou corrigidas.":"Revise as informações. O registro será salvo nesta empresa."}</p></header>
          <div className="record-review-title"><FileText size={21}/><div><small>{titleLabel}</small><strong>{title.trim()||"Título não informado"}</strong></div><button type="button" aria-label={`Editar ${titleLabel.toLowerCase()}`} onClick={()=>setStep(0)}>Editar</button></div>
          {groups.map((group,index)=><section className="record-review-group" key={group.title}><header><h4>{group.title}</h4><button type="button" aria-label={`Editar ${group.title.toLowerCase()}`} onClick={()=>setStep(index)}>Editar</button></header><dl>{group.fields.filter(field=>data[field.key]?.trim() || field.required).map(field=><div key={field.key}><dt>{field.label}</dt><dd className={errors[field.key]?"record-review-missing":""}>{data[field.key]?.trim()?displayed(field.key,data[field.key]):"Não informado"}{errors[field.key] && <small>{errors[field.key]}</small>}</dd></div>)}</dl>{!group.fields.some(field=>data[field.key]?.trim() || field.required) && <p className="record-field-help">Nenhuma informação opcional preenchida.</p>}</section>)}
        </>}
        <datalist id="record-member-emails">{members.map(member=><option key={member.email} value={member.email}>{member.name||member.role}</option>)}</datalist>
      </main>
      <aside className="record-studio-context" aria-label="Contexto do registro"><div className="record-company"><Building2 size={19}/><div><small>EMPRESA</small><strong>{companyName}</strong></div></div><div className="record-completion"><ClipboardCheck size={20}/><h4>Informações essenciais</h4><p>{filled} de {requiredTotal} campos preenchidos</p><progress value={filled} max={requiredTotal} aria-label="Campos obrigatórios preenchidos"/></div>
        {linkedPerson && <div className="record-context-block"><small>PESSOA</small><strong>{linkedPerson.title}</strong><p>{currentRole?`Cargo atual: ${currentRole.title}`:"Cargo atual não registrado."}</p></div>}
        {linkedRole && <div className="record-context-block"><small>{kind==="assessment"?"CARGO AVALIADO":kind==="development"?"CARGO PRETENDIDO":"CARGO DE REFERÊNCIA"}</small><strong>{linkedRole.title}</strong>{["mission","competencies","criteria"].filter(key=>linkedRole.data[key]).map(key=><details key={key}><summary>{key==="mission"?"Missão":key==="competencies"?"Competências":"Critérios de evolução"}</summary><p>{linkedRole.data[key]}</p></details>)}</div>}
        {human && <div className="record-human-note"><ShieldCheck size={19}/><p>Critérios e evidências apoiam a conversa. A decisão sobre pessoas continua com a equipe.</p></div>}
        <p className="record-save-note">Seus dados só serão gravados ao clicar em <strong>Salvar registro</strong>.</p>
      </aside>
    </div>
    <footer className="record-studio-footer"><Button type="button" variant="outline" disabled={saving} onClick={onCancel}>Cancelar</Button><span>Etapa {Math.min(step+1,groups.length+1)} de {groups.length+1}</span><div>{step>0 && <Button type="button" variant="outline" disabled={saving} onClick={()=>setStep(step-1)}>Voltar</Button>}<Button type="submit" className="action-primary" disabled={saving}>{review?<><Save size={16}/>{saving?"Salvando…":"Salvar registro"}</>:"Continuar"}</Button></div></footer>
  </form>;
}
