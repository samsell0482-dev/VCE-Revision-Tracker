// Generates or refreshes each cue card from its study-design checkpoint.
// The point title is the term or concept to recall and the authored detail is
// the subject-specific definition or key knowledge. Practice questions stay
// separate so the cue-card deck teaches content instead of repeating the quiz.
import {readdir,readFile,writeFile} from 'node:fs/promises';

const dir=new URL('../src/subjects/',import.meta.url);
const files=(await readdir(dir)).filter(file=>file.endsWith('.json')).sort();
const instructionStart=/^(?:explain|describe|identify|compare|evaluate|analyse|discuss|outline|distinguish|apply|use|calculate|construct|interpret|investigate|know|understand)\b/i;
let cardsAdded=0;
let subjectsUpdated=0;

for(const file of files){
 const url=new URL(file,dir);
 const subject=JSON.parse(await readFile(url,'utf8'));
 let changed=false;

 for(const point of subject.points){
  if(!point.title?.trim()||!point.detail?.trim()){
   throw new Error(`${subject.name} ${point.id} needs a study-design concept and definition before a cue card can be written`);
  }
  const question=point.questions?.[0];
  const back=instructionStart.test(point.detail)
   ?question?.answer?.filter(line=>typeof line==='string'&&line.trim())
   :[point.detail];
  if(!back?.length){
   throw new Error(`${subject.name} ${point.id} needs authored key knowledge for its definition card`);
  }

  const card={
   key:`${subject.id}:${point.id}`,
   title:point.title,
   front:point.title,
   back
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

console.log(`Generated or refreshed ${cardsAdded} cue cards across ${subjectsUpdated} subjects.`);
