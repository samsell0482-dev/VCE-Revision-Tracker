import test from 'node:test';
import assert from 'node:assert/strict';
import subjects from '../src/subjects.json' with {type:'json'};
import {normalizeRatings,importBackup,cleanPractice,validSelection} from '../src/storage.js';
const health=subjects.find(s=>s.id==='health-human-development-34');
test('Health covers four areas with unique persistent IDs',()=>{
 assert.equal(health.areas.length,4);
 assert.equal(health.points.length,49);
 assert.equal(new Set(health.points.map(p=>p.id)).size,49);
 for(const area of health.areas)assert.ok(health.points.some(p=>p.area===area));
 assert.deepEqual(validSelection([health.id]),[health.id]);
 assert.ok(health.sourceUrl.startsWith('https://www.vcaa.vic.edu.au/'));
});
test('Health ratings survive an older backup import and round-trip',()=>{
 const ratings=normalizeRatings();ratings[health.id]['3.1.1']=[1,2,3];
 const old={subjects:{'english-language-34':{'3.1.1':[3,0,0]}}};
 const merged=importBackup(old,ratings).ratings;
 assert.deepEqual(merged[health.id]['3.1.1'],[1,2,3]);
 assert.deepEqual(importBackup({subjects:merged},normalizeRatings()).ratings,merged);
 const key=health.id+'|3.1.1|0|0';
 assert.equal(cleanPractice({[key]:{text:'Health answer',score:2,revealed:true}})[key].text,'Health answer');
});
