import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeRatingHistory,normalizeRatings,importBackup,validSelection,cleanPractice} from '../src/storage.js';
const backup=JSON.parse(fs.readFileSync(new URL('../vce-tracker-progress.json',import.meta.url)));
test('existing progress export migrates passes into current ratings and history',()=>{
 const result=importBackup(backup,normalizeRatings());
 for(const [id,points]of Object.entries(backup.subjects))for(const [key,value]of Object.entries(points))if(result.ratings[id]?.[key]!==undefined){
  const completed=value.filter(rating=>Number.isInteger(rating)&&rating>=1&&rating<=3);
  assert.equal(result.ratings[id][key],completed.at(-1)||0);
  assert.deepEqual(result.ratingHistory[id][key].map(entry=>entry.state),completed);
 }
});
test('invalid imports are rejected and values are bounded',()=>{assert.throws(()=>importBackup({},normalizeRatings()));const r=normalizeRatings({'english-language-34':{'3.1.1':[-1,9,2]}});assert.equal(r['english-language-34']['3.1.1'],2);});
test('selection validates and deduplicates',()=>{assert.equal(validSelection(['unknown']),null);assert.deepEqual(validSelection(['physics-34','english-language-34','english-language-34']).filter(x=>x==='english-language-34'),['english-language-34']);});
test('malformed practice is ignored',()=>assert.deepEqual(cleanPractice({bad:{}}),{}));
test('legacy practice passes become question-level attempt history',()=>{
 const raw={
  'english-language-34|3.1.1|0|0':{text:'First answer',score:1,revealed:true},
  'english-language-34|3.1.1|0|1':{text:'Improved answer',score:2,revealed:true}
 };
 const migrated=cleanPractice(raw)['english-language-34|3.1.1|0'];
 assert.equal(migrated.history.length,1);
 assert.equal(migrated.history[0].text,'First answer');
 assert.equal(migrated.current.text,'Improved answer');
});
test('current rating history is validated',()=>{
 const history=normalizeRatingHistory({'english-language-34':{'3.1.1':[{state:1,ratedAt:'2026-01-01T00:00:00.000Z'},{state:9}]}});
 assert.deepEqual(history['english-language-34']['3.1.1'].map(entry=>entry.state),[1]);
});
test('backup settings restore valid subjects and themes',()=>{
 const doc={...backup,settings:{selection:['physics-34','unknown'],theme:'midnight'}};
 const result=importBackup(doc,normalizeRatings());
 assert.deepEqual(result.selection,['physics-34']);
 assert.equal(result.theme,'midnight');
 assert.equal(importBackup({...backup,settings:{theme:'invalid'}},normalizeRatings()).theme,null);
});
