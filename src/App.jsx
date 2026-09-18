import React,{useState,useEffect,useRef} from 'react';
import subjects from './subjects.json' with { type: 'json' };
import themes from './themes.json';
import {read,loadRatings,ratingKey,selectionKey,practiceKey,validSelection,cleanPractice,importBackup,savedHandle} from './storage.js';

const states=['not rated',"couldn't explain it",'somewhat confident','confident'];
const themesList=['glass','poster','midnight','notebook'];
const tally=(s,ratings,pass)=>s.points.reduce((c,p)=>(c[ratings[s.id][p.id][pass]]++,c),[0,0,0,0]);
function Bar({counts}){const total=counts.reduce((a,b)=>a+b,0);return <div className="bar">{[3,2,1].map(s=><div key={s} className="seg" data-s={s} style={{width:(total?counts[s]/total*100:0)+'%'}}/>)}</div>;}
function Legend(){return <div className="legend-key">{[1,2,3].map(s=><span className="key" data-s={s} key={s}><i/>{states[s]}</span>)}</div>;}
function Chips({label,options,value,onChange}){return <div className="group"><span className="group-label">{label}</span><div className="chips" role="group" aria-label={label}>{options.map(([v,l])=><button type="button" className="chip" key={v} aria-pressed={value===v} onClick={()=>onChange(v)}>{l}</button>)}</div></div>;}
function Setup({selection,onSave,onCancel}){
 const [draft,setDraft]=useState(selection||[]),ref=useRef(null);
 useEffect(()=>{ref.current.showModal();},[]);
 return <dialog className="setup" ref={ref} aria-labelledby="setup-title" onCancel={e=>{if(!selection)e.preventDefault();else onCancel();}}>
 <form onSubmit={e=>{e.preventDefault();if(draft.length)onSave(draft);}}>
 <span className="tag">YOUR VCE REVISION</span><h2 id="setup-title">Choose your subjects.</h2><p>Build a tracker for what you study. You can change these any time.</p>
 <fieldset><legend>Select at least one subject</legend>{subjects.map(s=><label key={s.id}><input type="checkbox" checked={draft.includes(s.id)} onChange={e=>setDraft(e.target.checked?[...draft,s.id]:draft.filter(id=>id!==s.id))}/>{s.name}</label>)}</fieldset>
 <p>{subjects.length} subjects have revision content ready. More subjects can be added later.</p><p role="status">{draft.length} subjects selected</p><div className="setup-actions"><button className="ghost" disabled={!draft.length}>{selection?'Save subjects':'Start revising'}</button>{selection&&<button type="button" className="ghost" onClick={onCancel}>Cancel</button>}</div>
 </form></dialog>;
}
function Dashboard({active,ratings,onOpen,onSetup}){
 const totals=[0,1,2].map(r=>active.reduce((all,s)=>tally(s,ratings,r).map((n,i)=>n+all[i]),[0,0,0,0]));
 return <div id="home"><header className="masthead"><h1>VCE Units 3 &amp; 4</h1><p className="standfirst">Rate every key knowledge point three times, then watch the red turn green.</p><section className="totals" aria-label="Progress across selected subjects">{totals.map((c,r)=><div className="totals-row" key={r}><span className="tag">{r+1}</span><Bar counts={c}/><span className="count">{c[3]} of {c.reduce((a,b)=>a+b,0)} green</span></div>)}<Legend/></section></header>
 <p className="readout">{active.length} subjects, {active.reduce((n,s)=>n+s.points.length,0)} key knowledge points.</p><div className="subject-heading"><p className="section-label">Your subjects</p><button className="ghost" onClick={onSetup}>Change subjects</button></div>
 <div id="subject-list">{active.map(s=><button className="subject" key={s.id} onClick={()=>onOpen(s.id)} style={{'--swatch':s.theme.accent}}><div><h2><span className="dot"/>{s.name}</h2><div className="meta">{s.points.length} points</div></div><div className="minis">{[0,1,2].map(r=><div className="mini" key={r}><span>{r+1}</span><Bar counts={tally(s,ratings,r)}/></div>)}</div></button>)}</div></div>;
}
function CueCards({subject,ratings,pass}){
 const groups=[1,2].map(state=>{
 const seen=new Map();
 for(const p of subject.points.filter(p=>ratings[subject.id][p.id][pass]===state)){
 const card=p.card||{front:'Explain '+p.title+'.',back:p.detail.split(/(?:;|\. )/).filter(Boolean)};
 const key=card.key||p.id;
 if(seen.has(key))seen.get(key).refs.push(p.id);else seen.set(key,{card,refs:[p.id],title:card.title||p.title});
 }return {state,cards:[...seen.values()]};
 });
 if(groups.every(g=>!g.cards.length))return <div className="empty"><strong>Nothing red or amber in this pass.</strong><span>Rate some topics to build your revision deck.</span></div>;
 return <section id="cards">{groups.map(({state,cards})=>cards.length>0&&<section key={state}><div className="deck-head"><h3>{state===1?'Red':'Amber'}</h3><span>{cards.length} cards</span></div><div className="deck">{cards.map(({card,refs,title})=><article className={'qcard '+(state===1?'red':'amber')} key={refs[0]}><div className="qcard-head"><span className="refs">{refs.join(' + ')}</span></div><h4>{title}</h4><p className="front">{card.front}</p><ul>{card.back.map((line,i)=><li key={i}>{line}</li>)}</ul></article>)}</div></section>)}<div className="print-row"><button className="ghost" onClick={()=>window.print()}>Print the deck</button></div></section>;
}
function Question({item,attempt,onUpdate}){
 const {q,p,key}=item,max=q.marks||1;
 const a=attempt||{text:'',choice:null,revealed:false,score:null,checks:[]};
 const match=q.options&&/^([A-Z])\s*(?:[—–:.)-]|$)/.exec(q.answer?.[0]||'');
 const correct=match?match[1].charCodeAt(0)-65:-1,auto=correct>=0&&correct<(q.options?.length||0);
 const change=patch=>onUpdate(key,{...a,...patch});
 const edit=patch=>change({...patch,score:null,revealed:false,checks:[]});
 return <article className="qz"><div className="qz-head"><span className="n">{p.id}</span><span className="marks">{max} marks</span></div><p className="stem" id={key+'-question'}>{q.q}</p>
 {q.options?<fieldset className="practice-options" aria-labelledby={key+'-question'}>{q.options.map((o,i)=><label className="practice-choice" key={i}><input type="radio" name={key} checked={a.choice===i} onChange={()=>edit({choice:i})}/>{String.fromCharCode(65+i)}. {o}</label>)}</fieldset>:<label className="practice-input-label">Your answer / working<textarea className="practice-input" rows={5} value={a.text} onChange={e=>edit({text:e.target.value})}/></label>}
 <div className="practice-actions"><button className="reveal" aria-expanded={a.revealed} disabled={auto&&a.choice===null} onClick={()=>change({revealed:!a.revealed,...(!a.revealed&&auto?{score:a.choice===correct?max:0}:{})})}>{a.revealed?'Hide answer guide':auto?'Check answer':'Reveal answer guide'}</button>
 <button className="reveal" onClick={()=>{if(confirm('Clear this answer and mark for this pass?'))change({text:'',choice:null,revealed:false,score:null,checks:[]});}}>Try again</button></div>
 {a.revealed&&<div className="ans">{(q.answer||[]).map((line,i)=><label className="practice-choice" key={i}><input type="checkbox" checked={!!a.checks[i]} onChange={e=>{const checks=[...a.checks];checks[i]=e.target.checked;change({checks});}}/>{line}</label>)}</div>}
 <label className="practice-mark">Your mark <select value={a.score??''} disabled={auto} onChange={e=>change({score:e.target.value===''?null:Number(e.target.value)})}><option value="">Choose a mark</option>{Array.from({length:max+1},(_,n)=><option key={n} value={n}>{n} / {max}</option>)}</select></label>
 <p className="practice-feedback" role="status">{a.score!==null?(auto?(a.score===max?'Correct. ':'Not quite. '):'Self-marked: ')+a.score+'/'+max+' marks.':a.text?'Answer saved as a draft.':'Not marked yet.'}</p></article>;
}
function Practice({subject,ratings,pass,attempts,onUpdate}){
 const [scope,setScope]=useState('red');
 const all=subject.points.flatMap(p=>(p.questions||[]).map((q,i)=>({p,q,key:[subject.id,p.id,i,pass].join('|')})));
 const qs=all.filter(x=>scope==='all'||(scope==='red'?ratings[subject.id][x.p.id][pass]===1:attempts[x.key]?.score==null));
 const marked=all.filter(x=>attempts[x.key]?.score!=null);
 return <section id="practice"><div className="deck-head"><h3>Practice</h3><span>Pass {pass+1}</span></div><p className="deck-note">Write your answer, reveal the guide, then record your own mark.</p><Chips label="Practice questions" options={[['red','Red topics'],['all','All questions'],['unfinished','Not marked yet']]} value={scope} onChange={setScope}/><p className="practice-summary">{qs.length} shown · {marked.length}/{all.length} marked · {marked.reduce((n,x)=>n+attempts[x.key].score,0)}/{marked.reduce((n,x)=>n+(x.q.marks||1),0)} marks</p>{!qs.length&&<div className="empty">No matching questions. Choose All questions to practise any topic.</div>}{qs.map(item=><Question key={item.key} item={item} attempt={attempts[item.key]} onUpdate={onUpdate}/>)}</section>;
}
function Subject({subject,ratings,onRate,onBack,attempts,onAttempt}){
 const [pass,setPass]=useState(0),[filter,setFilter]=useState('all'),[view,setView]=useState('rate');
 const counts=tally(subject,ratings,pass);
 const visible=p=>filter==='all'||(filter==='unrated'?ratings[subject.id][p.id][pass]===0:[1,2].includes(ratings[subject.id][p.id][pass]));
 const [target,setTarget]=useState(null);
 useEffect(()=>{if(target){document.getElementById('point-'+target)?.scrollIntoView({block:'center'});setTarget(null);}},[target,view,filter]);
 return <div id="subject-view"><button className="backlink" onClick={onBack}>← All subjects</button><header className="masthead subject-band"><h1 id="subject-title">{subject.name}</h1></header>
 <section className="map" aria-label="Confidence across this subject">{[0,1,2].map(r=><div className="map-pass" key={r}><span className="tag">Pass {r+1}</span><div className="rating-map">{subject.points.map(p=><button key={p.id} data-s={ratings[subject.id][p.id][r]} title={p.title} aria-label={'Pass '+(r+1)+', '+p.title+': '+states[ratings[subject.id][p.id][r]]} onClick={()=>{setPass(r);setFilter('all');setView('rate');setTarget(p.id);}}/>)}</div></div>)}<Legend/></section>
 <section className="stats">{[3,2,1,0].map(s=><div className="stat" data-s={s} key={s}><span className="stat-n">{counts[s]}</span><span className="stat-k">{states[s]}</span></div>)}</section>
 <div className="controls"><Chips label="Working on" options={[[0,'Pass 1'],[1,'Pass 2'],[2,'Pass 3']]} value={pass} onChange={setPass}/>{view==='rate'&&<Chips label="Showing" options={[['all','Everything'],['unrated','Not yet rated'],['weak','Red and amber']]} value={filter} onChange={setFilter}/>}<Chips label="View" options={[['rate','Rate'],['cards','Cue cards'],['practice','Practice']]} value={view} onChange={setView}/></div>
 {view==='rate'&&<section id="list">{subject.areas.map(area=>{const pts=subject.points.filter(p=>p.area===area&&visible(p));return pts.length>0&&<section className="area" key={area}><div className="area-head"><h3>{area}</h3><span className="area-count">{pts.length} points</span></div>{pts.map(p=><div className="point" id={'point-'+p.id} key={p.id}><div className="boxes">{[0,1,2].map(r=><button className="box" key={r} data-state={ratings[subject.id][p.id][r]} aria-label={'Pass '+(r+1)+', '+p.id+': '+states[ratings[subject.id][p.id][r]]} onClick={e=>onRate(subject.id,p.id,r,e.shiftKey||e.altKey?-1:1)}>{r+1}</button>)}</div><div><div className="point-id">{p.id}</div><h4 className="point-title">{p.title}</h4><p className="point-detail">{p.detail}</p></div></div>)}</section>;})}{!subject.points.some(visible)&&<div className="empty">No topics match this filter.</div>}</section>}
 {view==='cards'&&<CueCards subject={subject} ratings={ratings} pass={pass}/>}
 {view==='practice'&&<>{subject.practiceNote&&<p className="deck-note">{subject.practiceNote}</p>}<Practice subject={subject} ratings={ratings} pass={pass} attempts={attempts} onUpdate={onAttempt}/></>}
 <p className="colophon">{subject.source} {subject.sourceUrl&&<a href={subject.sourceUrl} target="_blank" rel="noreferrer">{subject.sourceLabel||'Official study design'}</a>}</p>{subject.papers&&<section className="papers"><h3>Practice exams</h3><p>{subject.papers}</p>{subject.papersUrl&&<a href={subject.papersUrl} target="_blank" rel="noreferrer">Official VCAA examination resources</a>}</section>}</div>;
}

export default function App(){
 const [ratings,setRatings]=useState(loadRatings),[attempts,setAttempts]=useState(()=>cleanPractice(read(practiceKey,{})));
 const [selection,setSelection]=useState(()=>validSelection(read(selectionKey,null)));
 const [setup,setSetup]=useState(!selection),[theme,setTheme]=useState(()=>{try{return localStorage.getItem('vce-revision-tracker-theme')||'glass';}catch{return 'glass';}});
 const [route,setRoute]=useState(()=>location.hash.slice(1)),[status,setStatus]=useState('Progress saves in this browser.'),[syncStatus,setSyncStatus]=useState('Connect a progress file in OneDrive to sync between computers.');
 const [handle,setHandle]=useState(null),[pending,setPending]=useState(null),fileInput=useRef(null),latest=useRef(null),syncBusy=useRef(false),stamp=useRef(0),dirty=useRef(false);
 const active=subjects.filter(s=>!selection||selection.includes(s.id)),current=active.find(s=>s.id===route);
 const device=useRef((()=>{try{let id=localStorage.getItem('vce-tracker:device');if(!id){id=Math.random().toString(36).slice(2);localStorage.setItem('vce-tracker:device',id);}return id;}catch{return 'temporary';}})());
 latest.current={ratings,attempts};
 const supported=typeof window.showOpenFilePicker==='function';
 useEffect(()=>{const listener=()=>setRoute(location.hash.slice(1));window.addEventListener('hashchange',listener);return()=>window.removeEventListener('hashchange',listener);},[]);
 useEffect(()=>{if(route&&!current){location.hash='';setRoute('');}},[route,current]);
 useEffect(()=>{try{for(const s of subjects)localStorage.setItem(ratingKey(s.id),JSON.stringify(ratings[s.id]));localStorage.setItem(practiceKey,JSON.stringify(attempts));if(selection)localStorage.setItem(selectionKey,JSON.stringify(selection));localStorage.setItem('vce-revision-tracker-theme',theme);setStatus('Progress saved in this browser.');}catch{setStatus('Browser saving is unavailable. Export a backup before closing.');}},[ratings,attempts,selection,theme]);
 useEffect(()=>{document.documentElement.dataset.theme=theme;document.documentElement.style.setProperty('--accent',current?.theme.accent||(theme==='midnight'?'#b6acff':theme==='notebook'?'#315d82':'#657d74'));},[theme,current]);
 useEffect(()=>{let cancelled=false;savedHandle().then(h=>{if(h&&!cancelled)setPending(h);}).catch(()=>{});return()=>{cancelled=true;};},[]);
 const envelope=()=>({app:'vce-tracker',version:3,savedAt:new Date().toISOString(),device:device.current,subjects:latest.current.ratings,practice:latest.current.attempts});
 function adopt(doc){const next=importBackup(doc,latest.current.ratings);setRatings(next.ratings);if(next.practice)setAttempts(next.practice);}
 async function readHandle(h){const f=await h.getFile();const doc=JSON.parse(await f.text());adopt(doc);stamp.current=f.lastModified;dirty.current=false;}
 async function connect(create=false,reconnect=null){
 try{
 let h=reconnect;
 if(h){if(await h.requestPermission({mode:'readwrite'})!=='granted')throw Error('File permission was not granted.');}
 else if(create)h=await window.showSaveFilePicker({suggestedName:'vce-tracker-progress.json',types:[{description:'Tracker progress',accept:{'application/json':['.json']}}]});
 else [h]=await window.showOpenFilePicker({types:[{description:'Tracker progress',accept:{'application/json':['.json']}}]});
 if(create){const w=await h.createWritable();await w.write(JSON.stringify(envelope(),null,2));await w.close();stamp.current=(await h.getFile()).lastModified;}
 else await readHandle(h);
 await savedHandle(h);setHandle(h);setPending(null);setSyncStatus('Connected to '+h.name+'. Changes save automatically.');
 }catch(e){if(e.name!=='AbortError')setSyncStatus(e.message);}
 }
 useEffect(()=>{
 if(!handle)return;
 let cancelled=false;
 async function sync(){
 if(syncBusy.current)return;syncBusy.current=true;
 try{
 const file=await handle.getFile();
 if(cancelled)return;
 if(file.lastModified!==stamp.current){
 if(dirty.current){setSyncStatus('The sync file changed while you were editing. Export a backup, then reload the file to continue.');return;}
 await readHandle(handle);setSyncStatus('Loaded progress from '+handle.name+'.');return;
 }
 if(dirty.current){
 const snapshot=latest.current;
 const w=await handle.createWritable();await w.write(JSON.stringify(envelope(),null,2));await w.close();stamp.current=(await handle.getFile()).lastModified;
 if(snapshot===latest.current)dirty.current=false;
 setSyncStatus('Saved to '+handle.name+'.');
 }
 }catch(e){setSyncStatus('Sync failed: '+e.message);}finally{syncBusy.current=false;}
 }
 const timer=setInterval(sync,1000);return()=>{cancelled=true;clearInterval(timer);};
 },[handle]);
 function navigate(id){location.hash=id||'';setRoute(id||'');window.scrollTo(0,0);}
 function rate(id,point,pass,step){dirty.current=true;setRatings(prev=>({...prev,[id]:{...prev[id],[point]:prev[id][point].map((n,i)=>i===pass?(n+step+4)%4:n)}}));}
 function attempt(key,value){dirty.current=true;setAttempts(prev=>({...prev,[key]:value}));}
 function exportFile(){const url=URL.createObjectURL(new Blob([JSON.stringify(envelope(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='vce-tracker-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 async function importFile(file){if(!file)return;try{adopt(JSON.parse(await file.text()));dirty.current=true;setStatus('Backup loaded.');}catch(e){setStatus('Backup could not be loaded: '+e.message);}}
 function reset(){if(!confirm('Clear all three passes for '+(current?current.name:'your selected subjects')+'?'))return;dirty.current=true;setRatings(prev=>{const next={...prev};for(const s of current?[current]:active)next[s.id]=Object.fromEntries(s.points.map(p=>[p.id,[0,0,0]]));return next;});}
 return <>{themes.map((style,i)=>{const id=/id="([^"]+)"/.exec(style.attributes)?.[1];const kind=id?.replace('theme-','');const enabled=!kind||kind==='glass'?theme!=='poster'||!kind:theme===kind;return <style key={i} media={enabled?'all':'not all'}>{style.css}</style>;})}
 <div className="wrap"><main id="views">{current?<Subject key={current.id} subject={current} ratings={ratings} onRate={rate} onBack={()=>navigate(null)} attempts={attempts} onAttempt={attempt}/>:<Dashboard active={active} ratings={ratings} onOpen={navigate} onSetup={()=>setSetup(true)}/>}</main>
 <section className="sync"><p className="sync-head">Sync between computers</p><p className="sync-status" role="status">{syncStatus}</p><div className="sync-actions">{supported?<>{handle?<><button className="ghost" onClick={async()=>{if(dirty.current&&!confirm('Replace pending local progress with the sync file? Export a backup first to keep it.'))return;try{await readHandle(handle);setSyncStatus('Reloaded progress.');}catch(e){setSyncStatus(e.message);}}}>Reload from file</button><button className="ghost" onClick={()=>{setHandle(null);savedHandle(null).catch(()=>{});setSyncStatus('File sync disconnected.');}}>Stop syncing</button></>:<>{pending&&<button className="ghost" onClick={()=>connect(false,pending)}>Reconnect sync file</button>}<button className="ghost" onClick={()=>connect(true)}>Create sync file</button><button className="ghost" onClick={()=>connect(false)}>Open sync file</button></>}</>:<p>Use Chrome or Edge for automatic file sync, or use the backup buttons below.</p>}</div></section>
 <footer><button className="ghost" onClick={exportFile}>Save a backup file</button><button className="ghost" onClick={()=>fileInput.current.click()}>Load a backup file</button><input hidden type="file" ref={fileInput} accept=".json,application/json" onChange={e=>{importFile(e.target.files[0]);e.target.value='';}}/><div className="footer-rating-actions"><button className="ghost danger" onClick={reset}>Clear ratings</button><div className="theme-picker"><span className="theme-picker-label">Theme</span><div className="theme-options" role="group" aria-label="Theme">{themesList.map(t=><button className="theme-option" key={t} aria-pressed={theme===t} onClick={()=>setTheme(t)}>{t[0].toUpperCase()+t.slice(1)}</button>)}</div></div></div><span className="status" role="status">{status}</span><p className="colophon">Shift-click a rating to step backwards. {active.reduce((n,s)=>n+s.points.length,0)} points across {active.length} selected subjects.</p></footer></div>
 {setup&&<Setup selection={selection} onSave={ids=>{setSelection(ids);setSetup(false);navigate(null);}} onCancel={()=>setSetup(false)}/>}</>;
}
