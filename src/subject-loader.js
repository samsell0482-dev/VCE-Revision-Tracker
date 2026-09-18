// Loads a subject's full content on demand. Vite turns each entry of this glob
// into its own chunk, so opening a subject downloads only that subject.
// Browser only: import.meta.glob is a Vite feature and is not available in Node,
// so tests read the files in src/subjects/ directly instead of importing this.
const loaders=import.meta.glob('./subjects/*.json');
const cache=new Map();
export function loadSubject(id){
 if(cache.has(id))return cache.get(id);
 const loader=loaders['./subjects/'+id+'.json'];
 if(!loader)return Promise.reject(Error('Unknown subject: '+id));
 const pending=loader().then(m=>m.default).catch(e=>{cache.delete(id);throw e;});
 cache.set(id,pending);
 return pending;
}
// Warms the cache without blocking: used to fetch the subjects a student has
// selected shortly after the dashboard renders, so opening one feels instant.
export const prefetchSubjects=ids=>{for(const id of ids)loadSubject(id).catch(()=>{});};
