import React,{useEffect,useState} from 'react';
import subjects from './subjects-index.json' with {type:'json'};
import themes from './themes.json';
import {prefetchSubjects} from './subject-loader.js';
import Dashboard from './components/Dashboard.jsx';
import SubjectView from './components/SubjectView.jsx';
import Setup from './components/Setup.jsx';
import Welcome from './components/Welcome.jsx';
import AppFooter from './components/AppFooter.jsx';
import useTrackerData from './hooks/useTrackerData.js';

export default function App(){
 const tracker=useTrackerData(),[setup,setSetup]=useState(false),[welcome,setWelcome]=useState(()=>tracker.ready&&!tracker.selection),[route,setRoute]=useState(()=>location.hash.slice(1));
 const active=subjects.filter(subject=>!tracker.selection||tracker.selection.includes(subject.id)),current=active.find(subject=>subject.id===route);
 useEffect(()=>{const listener=()=>setRoute(location.hash.slice(1));window.addEventListener('hashchange',listener);return()=>window.removeEventListener('hashchange',listener);},[]);
 useEffect(()=>{if(tracker.ready&&!tracker.selection&&!setup)setWelcome(true);},[tracker.ready,tracker.selection,setup]);
 useEffect(()=>{if(route&&!current){location.hash='';setRoute('');}},[route,current]);
 useEffect(()=>{document.documentElement.dataset.theme=tracker.theme;document.documentElement.style.setProperty('--accent',current?.theme.accent||(tracker.theme==='midnight'?'#b6acff':tracker.theme==='notebook'?'#315d82':'#657d74'));},[tracker.theme,current]);
 useEffect(()=>{if(!tracker.selection)return;const timer=setTimeout(()=>prefetchSubjects(tracker.selection),500);return()=>clearTimeout(timer);},[tracker.selection]);
 function navigate(id){location.hash=id||'';setRoute(id||'');window.scrollTo(0,0);}
 return <>{themes.map((style,index)=>{const id=/id="([^"]+)"/.exec(style.attributes)?.[1],kind=id?.replace('theme-',''),enabled=!kind||kind==='glass'?tracker.theme!=='poster'||!kind:tracker.theme===kind;return <style key={index} media={enabled?'all':'not all'}>{style.css}</style>;})}
  <div className="wrap"><main id="views">{!tracker.ready?<div className="empty" role="status">Loading your revision tracker…</div>:welcome?<Welcome onContinue={()=>{setWelcome(false);setSetup(true);}}/>:current?<SubjectView key={current.id} entry={current} ratings={tracker.ratings} onRate={tracker.rate} onBack={()=>navigate(null)} attempts={tracker.attempts} onAttempt={tracker.attempt}/>:<Dashboard active={active} ratings={tracker.ratings} onOpen={navigate} onSetup={()=>setSetup(true)}/>}</main>
   {tracker.ready&&!welcome&&<AppFooter sync={tracker.sync} status={tracker.status} theme={tracker.theme} onTheme={tracker.setTheme} onExport={tracker.exportBackup} onImportFile={tracker.importFile} onImportDesktop={tracker.importDesktop} onReset={()=>tracker.reset(current,active)} active={active} isDesktop={tracker.isDesktop}/>}
  </div>
  {setup&&<Setup selection={tracker.selection} onSave={ids=>{tracker.setSelection(ids);setSetup(false);setWelcome(false);navigate(null);}} onCancel={()=>setSetup(false)}/>}</>;
}
