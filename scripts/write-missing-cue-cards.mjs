// Generates or refreshes each cue card from the point's first exam-style
// practice question. Refreshing existing cards keeps keys, titles and answers
// aligned when a curriculum checkpoint is renamed or moved.
import {readdir,readFile,writeFile} from 'node:fs/promises';

const dir=new URL('../src/subjects/',import.meta.url);
const files=(await readdir(dir)).filter(file=>file.endsWith('.json')).sort();
let cardsAdded=0;
let subjectsUpdated=0;

for(const file of files){
 const url=new URL(file,dir);
 const subject=JSON.parse(await readFile(url,'utf8'));
 let changed=false;

 for(const point of subject.points){
  const question=point.questions?.[0];
  if(!question?.q||!Array.isArray(question.answer)||question.answer.length===0){
   throw new Error(`${subject.name} ${point.id} needs a complete question and answer before a cue card can be written`);
  }

  const card={
   key:`${subject.id}:${point.id}`,
   title:point.title,
   front:question.q,
   back:[...question.answer]
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
