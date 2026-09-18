import test from 'node:test';
import assert from 'node:assert/strict';
import subjects from '../src/subjects.json' with {type:'json'};
import {normalizeRatings,cleanPractice,validSelection} from '../src/storage.js';
const added=['biology-34','chemistry-34','psychology-34','specialist-maths-34','business-management-34','legal-studies-34','economics-34'];
test('subject ids and names are unique',()=>{
 assert.equal(new Set(subjects.map(s=>s.id)).size,subjects.length);
 assert.equal(new Set(subjects.map(s=>s.name)).size,subjects.length);
});
for(const s of subjects)test('"'+s.name+'" is structurally valid',()=>{
 assert.ok(s.points.length>0&&s.areas.length>0);
 assert.equal(new Set(s.points.map(p=>p.id)).size,s.points.length,'duplicate point id');
 assert.deepEqual(Object.keys(s.short).sort(),[...s.areas].sort(),'short labels must cover every area');
 assert.ok(typeof s.theme.accent==='string'&&/^#[0-9a-f]{6}$/i.test(s.theme.accent));
 for(const area of s.areas)assert.ok(s.points.some(p=>p.area===area),'area with no points: '+area);
 for(const p of s.points){
  assert.ok(s.areas.includes(p.area),p.id+' has an undeclared area');
  assert.ok(p.title&&p.detail,p.id+' is missing a title or detail');
  assert.ok(p.questions===undefined||Array.isArray(p.questions),p.id+' has a malformed questions list');
  for(const q of p.questions||[]){
   assert.ok(q.q,p.id+' question has no stem');
   assert.ok(Number.isInteger(q.marks)&&q.marks>=1&&q.marks<=10,p.id+' has invalid marks');
   assert.ok(Array.isArray(q.answer)&&q.answer.length,p.id+' has no answer guide');
   if(q.options)assert.ok(/^[A-Z]\s*(?:[—–:.)-]|$)/.test(q.answer[0]),p.id+' multiple choice answer must start with the option letter');
  }
 }
});
test('the seven added subjects are present with full-depth content',()=>{
 for(const id of added){
  const s=subjects.find(x=>x.id===id);
  assert.ok(s,'missing subject '+id);
  assert.ok(s.points.length>=49,id+' has too few points');
  assert.equal(s.points.filter(p=>p.questions.length).length,s.points.length,id+' has points without questions');
  assert.ok(s.sourceUrl.startsWith('https://www.vcaa.vic.edu.au/'),id+' must link to VCAA');
  assert.ok(s.practiceNote.length>0,id+' must disclaim that questions are not official');
 }
 assert.deepEqual(validSelection(added),added);
});
test('added subjects get ratings and practice slots without disturbing existing ones',()=>{
 const ratings=normalizeRatings({'english-language-34':{'3.1.1':[3,2,1]}});
 assert.deepEqual(ratings['english-language-34']['3.1.1'],[3,2,1]);
 for(const id of added){
  const s=subjects.find(x=>x.id===id);
  assert.equal(Object.keys(ratings[id]).length,s.points.length);
  assert.deepEqual(ratings[id][s.points[0].id],[0,0,0]);
  const key=[id,s.points[0].id,0,0].join('|');
  assert.equal(cleanPractice({[key]:{text:'draft',revealed:true,score:1}})[key].text,'draft');
 }
});
