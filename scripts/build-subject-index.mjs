// Generates src/subjects-index.json from the per-subject files in src/subjects/.
// The index holds only what the setup screen, the dashboard and saved-progress
// validation need: the subject's identity and, for every point, its id and the
// shape of its questions (marks, number of options, number of answer lines).
// The heavy content - detail text, question stems and answer guides - stays in
// the per-subject files, which the app loads on demand when a subject is opened.
// Run with `npm run build:index`; `npm run build` and `npm run dev` run it first.
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const dir=new URL('../src/subjects/',import.meta.url);
const out=new URL('../src/subjects-index.json',import.meta.url);
export async function buildIndex(){
 const files=(await readdir(dir)).filter(f=>f.endsWith('.json')).sort();
 const entries=[];
 for(const file of files){
  const subject=JSON.parse(await readFile(new URL(file,dir),'utf8'));
  if(subject.id+'.json'!==file)throw Error(`${file} declares id "${subject.id}"; the file must be named after its id`);
  entries.push({
   id:subject.id,
   name:subject.name,
   theme:subject.theme,
   points:subject.points.map(p=>({
    id:p.id,
    questions:(p.questions||[]).map(q=>({marks:q.marks||1,options:(q.options||[]).length,answer:(q.answer||[]).length}))
   }))
  });
 }
 return entries;
}
export const serialise=entries=>JSON.stringify(entries,null,1)+'\n';
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const entries=await buildIndex();
 await writeFile(out,serialise(entries));
 const points=entries.reduce((n,s)=>n+s.points.length,0);
 console.log(`subjects-index.json: ${entries.length} subjects, ${points} points`);
}
