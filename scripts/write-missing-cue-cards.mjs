// Generates or refreshes each flash card from its study-design checkpoint.
// The front names the concept. The back separates the checkpoint summary from
// its authored key knowledge so multi-part definitions stay readable without
// importing generic definitions from outside the subject.
import {readdir,readFile,writeFile} from 'node:fs/promises';

const dir=new URL('../src/subjects/',import.meta.url);
const files=(await readdir(dir)).filter(file=>file.endsWith('.json')).sort();
const instructionStart=/^(?:explain|describe|identify|compare|evaluate|analyse|discuss|outline|distinguish|apply|use|calculate|construct|interpret|investigate|know|understand)\b/i;
let cardsAdded=0;
let subjectsUpdated=0;

const cleanLine=line=>line.trim().replace(/^([A-Z])\s*(?:[—–:.)-])\s+/, '');
const splitSummary=detail=>detail
 .split(/(?<=[.!?])\s+|;\s+/)
 .map(cleanLine)
 .filter(Boolean);
const uniqueLines=lines=>{
 const seen=new Set();
 return lines.filter(line=>{
  const key=line.toLocaleLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  if(!key||seen.has(key))return false;
  seen.add(key);
  return true;
 });
};

for(const file of files){
 const url=new URL(file,dir);
 const subject=JSON.parse(await readFile(url,'utf8'));
 let changed=false;

 for(const point of subject.points){
  if(!point.title?.trim()||!point.detail?.trim()){
   throw new Error(`${subject.name} ${point.id} needs a study-design concept and definition before a flash card can be written`);
  }
  const question=point.questions?.[0];
  const answer=question?.answer?.filter(line=>typeof line==='string'&&line.trim()).map(cleanLine)||[];
  const summary=instructionStart.test(point.detail)?answer.slice(0,1):splitSummary(point.detail);
  const summaryKeys=new Set(summary.map(line=>line.toLocaleLowerCase().replace(/[^a-z0-9]+/g,' ').trim()));
  const keyKnowledge=uniqueLines(answer).filter(line=>!summaryKeys.has(line.toLocaleLowerCase().replace(/[^a-z0-9]+/g,' ').trim()));
  const sections=[
   {heading:'Definition / key knowledge',lines:uniqueLines(summary)},
   ...(keyKnowledge.length?[{heading:'What to remember',lines:keyKnowledge}]:[])
  ].filter(section=>section.lines.length);
  if(!sections.length){
   throw new Error(`${subject.name} ${point.id} needs authored key knowledge for its flash card`);
  }

  const card={
   key:`${subject.id}:${point.id}`,
   title:point.title,
   front:point.title,
   sections
  };
  if(JSON.stringify(point.card)!==JSON.stringify(card)){
   point.card=card;
   cardsAdded++;
   changed=true;
  }
 }

 if(changed){
  await writeFile(url,JSON.stringify(subject,null,2)+'\n');
  subjectsUpdated++;
 }
}

console.log(`Generated or refreshed ${cardsAdded} flash cards across ${subjectsUpdated} subjects.`);
