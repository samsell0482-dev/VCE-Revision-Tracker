// The index carries every subject's point ids and question shapes, which is all
// that validating saved progress requires. Full subject content is loaded on
// demand by subject-loader.js and is never needed here.
import subjects from './subjects-index.json' with { type: 'json' };
export const selectionKey='vce-tracker:subjects:v1';
export const practiceKey='vce-tracker:practice:v1';
export const ratingHistoryKey='vce-tracker:rating-history:v1';
export const ratingKey=id=>'vce-tracker:'+id+':ratings';
export function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
const validRating=value=>{const number=Number(value);return Number.isInteger(number)&&number>=0&&number<=3?number:0;};
const currentRating=value=>Array.isArray(value)?value.map(validRating).filter(Boolean).at(-1)||0:validRating(value);
export function normalizeRatings(raw={}){
 return Object.fromEntries(subjects.map(s=>[s.id,Object.fromEntries(s.points.map(p=>[p.id,currentRating(raw?.[s.id]?.[p.id])]))]));
}
function cleanRatingHistory(entries=[]){
 return Array.isArray(entries)?entries.flatMap(entry=>{const state=validRating(typeof entry==='object'?entry?.state:entry);if(!state)return[];return[{state,ratedAt:typeof entry?.ratedAt==='string'?entry.ratedAt:null,source:typeof entry?.source==='string'?entry.source:null}];}):[];
}
export function normalizeRatingHistory(raw={},legacyRatings={}){
 return Object.fromEntries(subjects.map(s=>[s.id,Object.fromEntries(s.points.map(p=>{
  const explicit=cleanRatingHistory(raw?.[s.id]?.[p.id]);
  const legacy=explicit.length?[]:(Array.isArray(legacyRatings?.[s.id]?.[p.id])?legacyRatings[s.id][p.id].flatMap((value,index)=>{const state=validRating(value);return state?[{state,ratedAt:null,source:'Pass '+(index+1)}]:[];}):[]);
  return[p.id,explicit.length?explicit:legacy];
 }))]));
}
function cleanAttempt(value,q){
 if(!value||typeof value!=='object')return null;
 return {text:typeof value.text==='string'?value.text:'',choice:Number.isInteger(value.choice)&&value.choice>=0&&value.choice<(q.options||0)?value.choice:null,revealed:value.revealed===true,score:Number.isInteger(value.score)&&value.score>=0&&value.score<=(q.marks||1)?value.score:null,checks:Array.from({length:q.answer||0},(_,j)=>!!value.checks?.[j]),startedAt:typeof value.startedAt==='string'?value.startedAt:null,completedAt:typeof value.completedAt==='string'?value.completedAt:null};
}
const meaningfulAttempt=value=>!!value&&(value.text.trim()!==''||value.choice!==null||value.revealed||value.score!==null||value.checks.some(Boolean));
export function cleanPractice(raw={}){
 const result={};
 for(const s of subjects)for(const p of s.points)for(const [i,q]of(p.questions||[]).entries()){
  const key=[s.id,p.id,i].join('|'),saved=raw?.[key];
  if(saved&&typeof saved==='object'&&('current'in saved||'history'in saved)){
   const current=cleanAttempt(saved.current,q),history=Array.isArray(saved.history)?saved.history.map(value=>cleanAttempt(value,q)).filter(meaningfulAttempt):[];
   if(meaningfulAttempt(current)||history.length)result[key]={current:current||cleanAttempt({},q),history};
   continue;
  }
  const direct=cleanAttempt(saved,q),legacy=[0,1,2].map(pass=>cleanAttempt(raw?.[[s.id,p.id,i,pass].join('|')],q)).filter(meaningfulAttempt);
  const attempts=[...(meaningfulAttempt(direct)?[direct]:[]),...legacy];
  if(attempts.length)result[key]={current:attempts.at(-1),history:attempts.slice(0,-1).map(value=>({...value,completedAt:value.completedAt||null}))};
 }return result;
}
const loadRawRatings=()=>Object.fromEntries(subjects.map(s=>[s.id,read(ratingKey(s.id),{})]));
export function loadRatings(){return normalizeRatings(loadRawRatings());}
export function loadRatingHistory(){const legacy=loadRawRatings();return normalizeRatingHistory(read(ratingHistoryKey,{}),legacy);}
export function validSelection(value){const ids=Array.isArray(value)?subjects.filter(s=>value.includes(s.id)).map(s=>s.id):[];return ids.length?ids:null;}
export function importBackup(doc,existing,existingHistory=normalizeRatingHistory()){
 if(!doc||typeof doc!=='object')throw Error('Not a tracker backup.');
 let incoming=doc.subjects;
 if(!incoming&&doc.ratings)incoming=doc.subject?{[doc.subject]:doc.ratings}:Object.fromEntries(subjects.map(s=>[s.id,doc.ratings]));
 if(!incoming||!subjects.some(s=>s.points.some(p=>Array.isArray(incoming[s.id]?.[p.id])||Number.isInteger(incoming[s.id]?.[p.id]))))throw Error('No matching subject ratings in this backup.');
 const merged=Object.fromEntries(subjects.map(s=>[s.id,{...existing[s.id],...incoming[s.id]}]));
 const importedHistory=normalizeRatingHistory(doc.ratingHistory||{},incoming);
 const ratingHistory=Object.fromEntries(subjects.map(s=>[s.id,Object.fromEntries(s.points.map(p=>[p.id,importedHistory[s.id][p.id].length?importedHistory[s.id][p.id]:existingHistory?.[s.id]?.[p.id]||[]]))]));
 const selection=validSelection(doc.settings?.selection);
 const theme=['glass','poster','midnight','notebook'].includes(doc.settings?.theme)?doc.settings.theme:null;
 return {ratings:normalizeRatings(merged),ratingHistory,practice:doc.practice?cleanPractice(doc.practice):null,selection,theme};
}
export async function savedHandle(value){
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('vce-tracker-all',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 try{return await new Promise((resolve,reject)=>{const tx=db.transaction('kv',value===undefined?'readonly':'readwrite'),store=tx.objectStore('kv');const req=value===undefined?store.get('handle'):value===null?store.delete('handle'):store.put(value,'handle');tx.oncomplete=()=>resolve(req.result);tx.onerror=()=>reject(tx.error);});}finally{db.close();}
}
