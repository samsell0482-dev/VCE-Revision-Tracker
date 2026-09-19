// The index carries every subject's point ids and question shapes, which is all
// that validating saved progress requires. Full subject content is loaded on
// demand by subject-loader.js and is never needed here.
import subjects from './subjects-index.json' with { type: 'json' };
export const selectionKey='vce-tracker:subjects:v1';
export const practiceKey='vce-tracker:practice:v1';
export const ratingKey=id=>'vce-tracker:'+id+':ratings';
export function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
export function normalizeRatings(raw={}){
 return Object.fromEntries(subjects.map(s=>[s.id,Object.fromEntries(s.points.map(p=>[p.id,[0,1,2].map(i=>{
 const n=Number(raw?.[s.id]?.[p.id]?.[i]);return Number.isInteger(n)&&n>=0&&n<=3?n:0;
 })]))]));
}
export function cleanPractice(raw={}){
 const result={};
 for(const s of subjects)for(const p of s.points)for(const [i,q]of(p.questions||[]).entries())for(let r=0;r<3;r++){
 const key=[s.id,p.id,i,r].join('|'),a=raw?.[key];if(!a||typeof a!=='object')continue;
 result[key]={text:typeof a.text==='string'?a.text:'',choice:Number.isInteger(a.choice)&&a.choice>=0&&a.choice<(q.options||0)?a.choice:null,revealed:a.revealed===true,score:Number.isInteger(a.score)&&a.score>=0&&a.score<=(q.marks||1)?a.score:null,checks:Array.from({length:q.answer||0},(_,j)=>!!a.checks?.[j])};
 }return result;
}
export function loadRatings(){return normalizeRatings(Object.fromEntries(subjects.map(s=>[s.id,read(ratingKey(s.id),{})])));}
export function validSelection(value){const ids=Array.isArray(value)?subjects.filter(s=>value.includes(s.id)).map(s=>s.id):[];return ids.length?ids:null;}
export function importBackup(doc,existing){
 if(!doc||typeof doc!=='object')throw Error('Not a tracker backup.');
 let incoming=doc.subjects;
 if(!incoming&&doc.ratings)incoming=doc.subject?{[doc.subject]:doc.ratings}:Object.fromEntries(subjects.map(s=>[s.id,doc.ratings]));
 if(!incoming||!subjects.some(s=>s.points.some(p=>Array.isArray(incoming[s.id]?.[p.id]))))throw Error('No matching subject ratings in this backup.');
 const merged=Object.fromEntries(subjects.map(s=>[s.id,{...existing[s.id],...incoming[s.id]}]));
 const selection=validSelection(doc.settings?.selection);
 const theme=['glass','poster','midnight','notebook'].includes(doc.settings?.theme)?doc.settings.theme:null;
 return {ratings:normalizeRatings(merged),practice:doc.practice?cleanPractice(doc.practice):null,selection,theme};
}
export async function savedHandle(value){
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('vce-tracker-all',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 try{return await new Promise((resolve,reject)=>{const tx=db.transaction('kv',value===undefined?'readonly':'readwrite'),store=tx.objectStore('kv');const req=value===undefined?store.get('handle'):value===null?store.delete('handle'):store.put(value,'handle');tx.oncomplete=()=>resolve(req.result);tx.onerror=()=>reject(tx.error);});}finally{db.close();}
}
