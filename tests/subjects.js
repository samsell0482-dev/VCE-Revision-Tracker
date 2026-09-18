// Test helper: reads the per-subject files directly. The app loads them through
// src/subject-loader.js, which uses Vite's import.meta.glob and so cannot run in
// Node, but the files themselves are plain JSON.
import {readdirSync,readFileSync} from 'node:fs';
const dir=new URL('../src/subjects/',import.meta.url);
export const files=readdirSync(dir).filter(f=>f.endsWith('.json')).sort();
export const subjects=files.map(f=>JSON.parse(readFileSync(new URL(f,dir),'utf8')));
export const bySubjectId=id=>subjects.find(s=>s.id===id);
