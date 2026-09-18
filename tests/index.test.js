import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {subjects,files} from './subjects.js';
import index from '../src/subjects-index.json' with {type:'json'};
import {buildIndex,serialise} from '../scripts/build-subject-index.mjs';
test('the committed index matches the per-subject files',async()=>{
 const rebuilt=serialise(await buildIndex());
 const committed=readFileSync(new URL('../src/subjects-index.json',import.meta.url),'utf8');
 assert.equal(rebuilt,committed,'src/subjects-index.json is stale - run npm run build:index');
});
test('the index covers every subject and every point id',()=>{
 assert.equal(index.length,subjects.length);
 assert.equal(index.length,files.length);
 for(const s of subjects){
  const entry=index.find(e=>e.id===s.id);
  assert.ok(entry,'index is missing '+s.id);
  assert.equal(entry.name,s.name);
  assert.equal(entry.theme.accent,s.theme.accent);
  assert.deepEqual(entry.points.map(p=>p.id),s.points.map(p=>p.id),s.id+' point ids differ');
 }
});
test('the index records the shape of every question',()=>{
 for(const s of subjects){
  const entry=index.find(e=>e.id===s.id);
  for(const [i,p] of s.points.entries()){
   const shapes=entry.points[i].questions,actual=p.questions||[];
   assert.equal(shapes.length,actual.length,s.id+' '+p.id+' question count differs');
   for(const [j,q] of actual.entries()){
    assert.equal(shapes[j].marks,q.marks,s.id+' '+p.id+' marks differ');
    assert.equal(shapes[j].options,(q.options||[]).length,s.id+' '+p.id+' option count differs');
    assert.equal(shapes[j].answer,q.answer.length,s.id+' '+p.id+' answer line count differs');
   }
  }
 }
});
test('the index carries no subject content, only identity and shape',()=>{
 for(const entry of index){
  assert.deepEqual(Object.keys(entry).sort(),['id','name','points','theme'],entry.id+' has unexpected index fields');
  for(const p of entry.points){
   assert.deepEqual(Object.keys(p).sort(),['id','questions'],entry.id+' point '+p.id+' has unexpected fields');
   for(const q of p.questions){
    assert.deepEqual(Object.keys(q).sort(),['answer','marks','options'],entry.id+' point '+p.id+' has unexpected question fields');
    for(const [k,v] of Object.entries(q))assert.ok(Number.isInteger(v),entry.id+' question field '+k+' should be a count, got '+typeof v);
   }
  }
 }
});
test('the index stays small enough to be worth loading up front',()=>{
 const bytes=readFileSync(new URL('../src/subjects-index.json',import.meta.url)).length;
 assert.ok(bytes<400000,'index has grown to '+bytes+' bytes; check it is not carrying subject content');
 const content=readFileSync(new URL('../src/subjects/physics-34.json',import.meta.url)).length;
 assert.ok(bytes<content*6,'the index should stay far smaller than the content it indexes');
});
