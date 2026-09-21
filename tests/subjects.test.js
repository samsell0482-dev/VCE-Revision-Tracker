import test from 'node:test';
import assert from 'node:assert/strict';
import {subjects} from './subjects.js';
import {normalizeRatings,cleanPractice,validSelection} from '../src/storage.js';
const added=['biology-34','chemistry-34','psychology-34','specialist-maths-34','business-management-34','legal-studies-34','economics-34'];
const latest=['ancient-history-34','literature-34','global-politics-34','philosophy-34','environmental-science-34','sociology-34','food-studies-34'];
const skillsBased=['english-34','history-revolutions-34','geography-34','physical-education-34','accounting-34','data-analytics-34','visual-communication-design-34','media-34','product-design-34'];
test('subjects are listed in alphabetical order by file name',()=>{
 assert.deepEqual(subjects.map(s=>s.id),[...subjects.map(s=>s.id)].sort(),'per-subject files drive the order shown to students');
});
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
 assert.deepEqual(validSelection(added).sort(),[...added].sort(),'selection should validate regardless of order');
});
test('the nine skills-based subjects are present with a question on every point',()=>{
 for(const id of skillsBased){
  const s=subjects.find(x=>x.id===id);
  assert.ok(s,'missing subject '+id);
  assert.ok(s.points.length>=35,id+' has too few points');
  assert.equal(s.points.filter(p=>p.questions?.length).length,s.points.length,id+' has points without questions');
  assert.ok(s.sourceUrl.startsWith('https://www.vcaa.vic.edu.au/'),id+' must link to VCAA');
  assert.ok(s.practiceNote.length>0,id+' must disclaim that questions are not official');
 }
 assert.deepEqual(validSelection(skillsBased).sort(),[...skillsBased].sort(),'selection should validate regardless of order');
});
test('every subject has a practice question on every point',()=>{
 for(const s of subjects){
  const missing=s.points.filter(p=>!p.questions?.length).map(p=>p.id);
  assert.deepEqual(missing,[],s.id+' has points without a practice question: '+missing.join(', '));
 }
});
test('every revision point has a complete, study-design-specific flash card',()=>{
 for(const s of subjects){
  for(const p of s.points){
   assert.ok(p.card,s.id+' '+p.id+' has no flash card');
   assert.ok(p.card.key&&p.card.title&&p.card.front,s.id+' '+p.id+' has an incomplete flash-card prompt');
   assert.ok(Array.isArray(p.card.sections)&&p.card.sections.length,s.id+' '+p.id+' has no structured flash-card answer');
   assert.ok(p.card.sections.every(section=>section.heading&&Array.isArray(section.lines)&&section.lines.length),s.id+' '+p.id+' has an incomplete flash-card section');
   const lines=p.card.sections.flatMap(section=>section.lines);
   assert.ok(lines.every(line=>typeof line==='string'&&line.trim()),s.id+' '+p.id+' has a blank flash-card answer line');
   assert.equal(p.card.front,p.title,s.id+' '+p.id+' flash-card front should be the study-design concept');
   const authored=[p.detail,...p.questions[0].answer].join(' ');
   for(const line of lines)assert.ok(authored.includes(line),s.id+' '+p.id+' flash-card content must come from its authored checkpoint');
   assert.notEqual(p.card.front,p.questions?.[0]?.q,s.id+' '+p.id+' flash card repeats its practice question');
  }
 }
});
test('Politics follows the current Units 3 and 4 study',()=>{
 const politics=subjects.find(s=>s.id==='global-politics-34');
 assert.equal(politics.name,'Politics');
 assert.equal(politics.points.length,41);
 assert.ok(politics.areas.includes('Unit 3: Global cooperation and conflict — AoS 1: Global issues, global responses'));
 assert.ok(politics.areas.includes('Unit 3: Global cooperation and conflict — AoS 2: Contemporary crises: conflict, stability and change'));
 assert.ok(politics.areas.includes('Unit 4: Power in the Indo-Pacific — AoS 1: Power and the national interest'));
 assert.ok(politics.areas.includes('Unit 4: Power in the Indo-Pacific — AoS 2: Australia in the Indo-Pacific'));
 assert.ok(politics.points.every(p=>p.id.startsWith('P-')),'legacy Global Politics checkpoints remain');
 assert.equal(politics.sourceLabel,'VCAA Politics study design');
 assert.match(politics.papersUrl,/\/politics$/);
});
const officialAreas={
 'accounting-34':['Financial accounting for a trading business','Recording, reporting, budgeting and decision-making'],
 'ancient-history-34':['Living in an ancient society','People in power, societies in crisis'],
 'biology-34':['How do cells maintain life?','How does life change and respond to challenges?'],
 'business-management-34':['Managing a business','Transforming a business'],
 'chemistry-34':['How can design and innovation help to optimise chemical processes?','How are carbon-based compounds designed for purpose?'],
 'data-analytics-34':['Data analytics: analysis and design','Cyber security: data security'],
 'economics-34':['Australia’s living standards','Managing the economy'],
 'english-34':['Reading and responding to texts','Creating texts','Analysing argument'],
 'english-language-34':['Language variation and purpose','Language variation and identity'],
 'environmental-science-34':['How can biodiversity and development be sustained?','How can climate change and the impacts of human energy use be managed?'],
 'food-studies-34':['Food in daily life','Food issues, challenges and futures'],
 'general-maths-34':['Data analysis, probability and statistics','Discrete mathematics'],
 'geography-34':['Changing the land','Human population: trends and issues'],
 'global-politics-34':['Global cooperation and conflict','Power in the Indo-Pacific'],
 'health-human-development-34':['Australia’s health in a globalised world','Health and human development in a global context'],
 'history-revolutions-34':['Causes of revolution','Consequences of revolution'],
 'legal-studies-34':['Rights and justice','The people, the law and reform'],
 'literature-34':['Adaptations and transformations','Developing interpretations','Creative responses to texts','Close analysis of texts'],
 'maths-methods-34':['Functions, relations and graphs','Algebra, number and structure','Calculus','Data analysis, probability and statistics'],
 'media-34':['Media narratives, contexts and pre-production','Research, development and experimentation','Pre-production planning','Media production; agency and control in and of the media'],
 'philosophy-34':['The good life and the individual','The good life and others','On believing','Foundations of belief','Contemporary applications'],
 'physical-education-34':['Movement skills and energy for physical activity, sport and exercise','Training to improve performance','Integrated movement experiences'],
 'physics-34':['How do fields explain motion and electricity?','How have creative ideas and investigation revolutionised thinking in physics?'],
 'product-design-34':['Ethical product design and development','Production and evaluation of ethical designs','Evaluation and speculative design'],
 'psychology-34':['How does experience affect behaviour and mental processes?','How is mental wellbeing supported and maintained?'],
 'sociology-34':['Culture and ethnicity','Community, social movements and social change'],
 'software-dev-34':['Software development: programming','Cyber security: secure software development practices'],
 'specialist-maths-34':['Discrete mathematics','Functions, relations and graphs','Algebra, number and structure','Calculus','Space and measurement','Data analysis, probability and statistics'],
 'visual-communication-design-34':['Visual communication in design practice','Delivering design solutions','Presenting design solutions']
};
test('all 29 subjects include the current official Units 3 and 4 terminology',()=>{
 assert.equal(Object.keys(officialAreas).length,subjects.length);
 for(const [id,terms] of Object.entries(officialAreas)){
  const subject=subjects.find(s=>s.id===id);
  assert.ok(subject,'missing subject '+id);
  const labels=subject.areas.join('\n');
  for(const term of terms)assert.ok(labels.includes(term),`${id} is missing current official term: ${term}`);
 }
});
test('all subjects use current VCAA pages and internally consistent flash-card keys',()=>{
 for(const subject of subjects){
  assert.match(subject.sourceUrl,/^https:\/\/www\.vcaa\.vic\.edu\.au\/curriculum\/vce-curriculum\/vce-study-designs\//,subject.id+' has a retired source URL');
  assert.match(subject.papersUrl,/^https:\/\/(?:www\.)?vcaa\.vic\.edu\.au\/assessment\/vce\/examination-specifications-past-examinations-and-examination-reports\//,subject.id+' has no current assessment URL');
  for(const point of subject.points){
   assert.equal(point.card.key,`${subject.id}:${point.id}`,subject.id+' '+point.id+' has a stale flash-card key');
   assert.equal(point.card.title,point.title,subject.id+' '+point.id+' has a stale flash-card title');
  }
 }
});
test('the latest subjects are present and linked to VCAA',()=>{
 for(const id of latest){
  const s=subjects.find(x=>x.id===id);
  assert.ok(s,'missing subject '+id);
  assert.ok(s.points.length>=30,id+' has too few points');
  assert.ok(s.sourceUrl.startsWith('https://www.vcaa.vic.edu.au/'),id+' must link to VCAA');
  assert.ok(s.practiceNote.length>0,id+' must disclaim that questions are not official');
 }
 assert.deepEqual(validSelection(latest).sort(),[...latest].sort());
});
test('Health and Human Development now has full-depth practice questions',()=>{
 const hhd=subjects.find(s=>s.id==='health-human-development-34');
 assert.equal(hhd.points.length,49);
 assert.equal(hhd.points.filter(p=>p.questions?.length).length,49,'every HHD point should carry a question');
});
test('English and English Language are separate subjects',()=>{
 const english=subjects.find(s=>s.id==='english-34'),el=subjects.find(s=>s.id==='english-language-34');
 assert.ok(english&&el);
 assert.notEqual(english.name,el.name);
 const ratings=normalizeRatings({'english-language-34':{'3.1.1':[3,3,3]}});
 assert.equal(ratings['english-language-34']['3.1.1'],3);
 assert.equal(ratings['english-34'][english.points[0].id],0);
});
test('added subjects get ratings and practice slots without disturbing existing ones',()=>{
 const ratings=normalizeRatings({'english-language-34':{'3.1.1':[3,2,1]}});
 assert.equal(ratings['english-language-34']['3.1.1'],1);
 for(const id of added){
  const s=subjects.find(x=>x.id===id);
  assert.equal(Object.keys(ratings[id]).length,s.points.length);
  assert.equal(ratings[id][s.points[0].id],0);
  const legacyKey=[id,s.points[0].id,0,0].join('|'),key=[id,s.points[0].id,0].join('|');
  assert.equal(cleanPractice({[legacyKey]:{text:'draft',revealed:true,score:1}})[key].current.text,'draft');
 }
});
