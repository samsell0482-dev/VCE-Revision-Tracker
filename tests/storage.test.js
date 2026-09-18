import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeRatings,importBackup,validSelection,cleanPractice} from '../src/storage.js';
const backup=JSON.parse(fs.readFileSync(new URL('../vce-tracker-progress.json',import.meta.url)));
test('existing progress export imports without losing ratings',()=>{const result=importBackup(backup,normalizeRatings());for(const [id,points]of Object.entries(backup.subjects))for(const [key,value]of Object.entries(points))if(result.ratings[id]?.[key])assert.deepEqual(result.ratings[id][key],value);});
test('invalid imports are rejected and values are bounded',()=>{assert.throws(()=>importBackup({},normalizeRatings()));const r=normalizeRatings({'english-language-34':{'3.1.1':[-1,9,2]}});assert.deepEqual(r['english-language-34']['3.1.1'],[0,0,2]);});
test('selection validates and deduplicates',()=>{assert.equal(validSelection(['unknown']),null);assert.deepEqual(validSelection(['physics-34','english-language-34','english-language-34']).filter(x=>x==='english-language-34'),['english-language-34']);});
test('malformed practice is ignored',()=>assert.deepEqual(cleanPractice({bad:{}}),{}));

