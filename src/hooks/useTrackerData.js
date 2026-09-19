import {useCallback,useEffect,useRef,useState} from 'react';
import subjects from '../subjects-index.json' with {type:'json'};
import {cleanPractice,importBackup,loadRatingHistory,loadRatings,practiceKey,ratingHistoryKey,ratingKey,read,savedHandle,selectionKey,validSelection} from '../storage.js';
import {connectDesktopSync,disconnectDesktopSync,exportDesktopBackup,importDesktopBackup,isDesktop,loadDesktopState,reloadDesktopSync,saveDesktopLocal,syncDesktop} from '../services/desktop-storage.js';

function deviceId(){
 try{let id=localStorage.getItem('vce-tracker:device');if(!id){id=crypto.randomUUID?.()||Math.random().toString(36).slice(2);localStorage.setItem('vce-tracker:device',id);}return id;}catch{return 'temporary';}
}

export default function useTrackerData(){
 const [ratings,setRatings]=useState(loadRatings),[ratingHistory,setRatingHistory]=useState(loadRatingHistory),[attempts,setAttempts]=useState(()=>cleanPractice(read(practiceKey,{})));
 const [selection,setSelectionState]=useState(()=>validSelection(read(selectionKey,null)));
 const [theme,setThemeState]=useState(()=>{try{return localStorage.getItem('vce-revision-tracker-theme')||'glass';}catch{return 'glass';}});
 const [status,setStatus]=useState('Progress is saved locally.'),[syncStatus,setSyncStatus]=useState(isDesktop?'Loading desktop saves…':'Connect a progress file in OneDrive to sync between computers.');
 const [syncInfo,setSyncInfo]=useState({connected:false,name:null}),[pending,setPending]=useState(null),[desktopReady,setDesktopReady]=useState(!isDesktop),[conflict,setConflict]=useState(false);
 const latest=useRef(null),device=useRef(deviceId()),dirty=useRef(false),revision=useRef(0),stamp=useRef(null),syncBusy=useRef(false),conflictRef=useRef(false),webHandle=useRef(null);
 latest.current={ratings,ratingHistory,attempts,selection,theme};

 const buildDocument=useCallback(()=>({app:'vce-tracker',version:4,savedAt:new Date().toISOString(),device:device.current,subjects:latest.current.ratings,ratingHistory:latest.current.ratingHistory,practice:latest.current.attempts,settings:{selection:latest.current.selection,theme:latest.current.theme}}),[]);
 const markDirty=useCallback(()=>{dirty.current=true;revision.current+=1;conflictRef.current=false;setConflict(false);},[]);
 const adopt=useCallback((doc,shouldMark=false)=>{const next=importBackup(doc,latest.current.ratings,latest.current.ratingHistory);setRatings(next.ratings);setRatingHistory(next.ratingHistory);if(next.practice)setAttempts(next.practice);if(next.selection)setSelectionState(next.selection);if(next.theme)setThemeState(next.theme);if(shouldMark)markDirty();},[markDirty]);

 useEffect(()=>{if(!isDesktop)return;let cancelled=false;loadDesktopState().then(state=>{if(cancelled)return;if(state.document)adopt(state.document);stamp.current=state.syncModifiedMs??null;dirty.current=!!state.syncNeedsWrite;if(state.syncNeedsWrite)revision.current+=1;setSyncInfo({connected:!!state.syncPath,name:state.syncName||null});setSyncStatus(state.syncPath?'Connected to '+(state.syncName||'progress file')+'. Changes save automatically.':'Desktop progress is saved automatically with recovery snapshots.');setDesktopReady(true);}).catch(error=>{if(!cancelled){setStatus('Desktop save could not be loaded: '+error);setDesktopReady(true);}});return()=>{cancelled=true;};},[adopt]);

 useEffect(()=>{try{for(const subject of subjects)localStorage.setItem(ratingKey(subject.id),JSON.stringify(ratings[subject.id]));localStorage.setItem(ratingHistoryKey,JSON.stringify(ratingHistory));localStorage.setItem(practiceKey,JSON.stringify(attempts));if(selection)localStorage.setItem(selectionKey,JSON.stringify(selection));localStorage.setItem('vce-revision-tracker-theme',theme);if(!isDesktop)setStatus('Progress is saved locally.');}catch{setStatus('Local saving is unavailable. Export a backup before closing.');}},[ratings,ratingHistory,attempts,selection,theme]);

 useEffect(()=>{if(!isDesktop||!desktopReady)return;const value=buildDocument(),timer=setTimeout(()=>saveDesktopLocal(value).then(()=>setStatus('Progress is saved locally with recovery snapshots.')).catch(error=>setStatus('Desktop save failed: '+error)),450);return()=>clearTimeout(timer);},[ratings,ratingHistory,attempts,selection,theme,desktopReady,buildDocument]);

 useEffect(()=>{if(isDesktop)return;let cancelled=false;savedHandle().then(handle=>{if(handle&&!cancelled)setPending(handle);}).catch(()=>{});return()=>{cancelled=true;};},[]);

 const readWebHandle=useCallback(async handle=>{const file=await handle.getFile();adopt(JSON.parse(await file.text()));stamp.current=file.lastModified;dirty.current=false;},[adopt]);

 const connect=useCallback(async(create=false,reconnect=null)=>{
  try{
   if(isDesktop){const result=await connectDesktopSync(buildDocument(),create);if(!result)return;if(result.document)adopt(result.document);stamp.current=result.modifiedMs??null;dirty.current=false;setSyncInfo({connected:true,name:result.name});setConflict(false);conflictRef.current=false;setSyncStatus('Connected to '+result.name+'. Changes save automatically.');return;}
   let handle=reconnect;
   if(handle){if(await handle.requestPermission({mode:'readwrite'})!=='granted')throw Error('File permission was not granted.');}
   else if(create)handle=await window.showSaveFilePicker({suggestedName:'vce-tracker-progress.json',types:[{description:'Tracker progress',accept:{'application/json':['.json']}}]});
   else [handle]=await window.showOpenFilePicker({types:[{description:'Tracker progress',accept:{'application/json':['.json']}}]});
   if(create){const writer=await handle.createWritable();await writer.write(JSON.stringify(buildDocument(),null,2));await writer.close();stamp.current=(await handle.getFile()).lastModified;}else await readWebHandle(handle);
   await savedHandle(handle);webHandle.current=handle;setPending(null);setSyncInfo({connected:true,name:handle.name});setSyncStatus('Connected to '+handle.name+'. Changes save automatically.');
  }catch(error){if(error.name!=='AbortError')setSyncStatus(String(error.message||error));}
 },[adopt,buildDocument,readWebHandle]);

 useEffect(()=>{
  if(!desktopReady||!syncInfo.connected)return;
  let cancelled=false;
  async function sync(){
   if(syncBusy.current||conflictRef.current)return;syncBusy.current=true;const atRevision=revision.current;
   try{
    if(isDesktop){const result=await syncDesktop(buildDocument(),stamp.current,dirty.current);if(cancelled)return;stamp.current=result.modifiedMs??stamp.current;if(result.status==='conflict'){conflictRef.current=true;setConflict(true);setSyncStatus('This sync file changed on another computer while you had local edits. Save a backup, then reload the file or reconnect it.');return;}if(result.status==='loaded'&&result.document){adopt(result.document);dirty.current=false;setSyncStatus('Loaded progress from '+result.name+'.');}else if(result.status==='saved'){if(atRevision===revision.current)dirty.current=false;setSyncStatus('Saved to '+result.name+'.');}return;}
    const handle=webHandle.current;if(!handle)return;const file=await handle.getFile();if(file.lastModified!==stamp.current){if(dirty.current){conflictRef.current=true;setConflict(true);setSyncStatus('The sync file changed while you were editing. Export a backup, then reload the file to continue.');return;}await readWebHandle(handle);setSyncStatus('Loaded progress from '+handle.name+'.');return;}if(dirty.current){const writer=await handle.createWritable();await writer.write(JSON.stringify(buildDocument(),null,2));await writer.close();stamp.current=(await handle.getFile()).lastModified;if(atRevision===revision.current)dirty.current=false;setSyncStatus('Saved to '+handle.name+'.');}
   }catch(error){setSyncStatus('Sync failed: '+String(error.message||error));}finally{syncBusy.current=false;}
  }
  const timer=setInterval(sync,1200);return()=>{cancelled=true;clearInterval(timer);};
 },[adopt,desktopReady,buildDocument,readWebHandle,syncInfo.connected]);

 const reload=useCallback(async()=>{if(dirty.current&&!confirm('Replace pending local progress with the sync file? Save a backup first to keep it.'))return;try{if(isDesktop){const result=await reloadDesktopSync();if(result.document)adopt(result.document);stamp.current=result.modifiedMs;setSyncInfo({connected:true,name:result.name});}else await readWebHandle(webHandle.current);dirty.current=false;conflictRef.current=false;setConflict(false);setSyncStatus('Reloaded progress from the sync file.');}catch(error){setSyncStatus(String(error.message||error));}},[adopt,readWebHandle]);
 const disconnect=useCallback(async()=>{try{if(isDesktop)await disconnectDesktopSync();else await savedHandle(null);webHandle.current=null;stamp.current=null;dirty.current=false;conflictRef.current=false;setConflict(false);setSyncInfo({connected:false,name:null});setPending(null);setSyncStatus('File sync disconnected. Desktop recovery saves remain available.');}catch(error){setSyncStatus(String(error.message||error));}},[]);

 const exportBackup=useCallback(async()=>{try{if(isDesktop){if(await exportDesktopBackup(buildDocument()))setStatus('Backup saved.');return;}const url=URL.createObjectURL(new Blob([JSON.stringify(buildDocument(),null,2)],{type:'application/json'})),anchor=window.document.createElement('a');anchor.href=url;anchor.download='vce-tracker-progress.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(error){setStatus('Backup could not be saved: '+String(error.message||error));}},[buildDocument]);
 const importFile=useCallback(async file=>{if(!file)return;try{adopt(JSON.parse(await file.text()),true);setStatus('Backup loaded.');}catch(error){setStatus('Backup could not be loaded: '+String(error.message||error));}},[adopt]);
 const importDesktop=useCallback(async()=>{try{const value=await importDesktopBackup();if(value){adopt(value,true);setStatus('Backup loaded.');}}catch(error){setStatus('Backup could not be loaded: '+String(error.message||error));}},[adopt]);

 function setSelection(value){markDirty();setSelectionState(value);}
 function setTheme(value){markDirty();setThemeState(value);}
 function rate(subjectId,pointId,state){
  const next=Number(state);if(!Number.isInteger(next)||next<0||next>3||ratings[subjectId]?.[pointId]===next)return;
  markDirty();setRatings(previous=>({...previous,[subjectId]:{...previous[subjectId],[pointId]:next}}));
  setRatingHistory(previous=>({...previous,[subjectId]:{...previous[subjectId],[pointId]:[...(previous[subjectId]?.[pointId]||[]),{state:next,ratedAt:new Date().toISOString(),source:null}]}}));
 }
 function attempt(key,value){markDirty();setAttempts(previous=>({...previous,[key]:value}));}
 function reset(current,active){if(!confirm('Clear confidence ratings and their history for '+(current?current.name:'your selected subjects')+'?'))return;markDirty();const targets=current?[current]:active;setRatings(previous=>{const next={...previous};for(const subject of targets)next[subject.id]=Object.fromEntries(subject.points.map(point=>[point.id,0]));return next;});setRatingHistory(previous=>{const next={...previous};for(const subject of targets)next[subject.id]=Object.fromEntries(subject.points.map(point=>[point.id,[]]));return next;});}

 return {ratings,ratingHistory,attempts,selection,theme,status,ready:desktopReady,setSelection,setTheme,rate,attempt,reset,exportBackup,importFile,importDesktop,isDesktop,sync:{supported:isDesktop||typeof window.showOpenFilePicker==='function',connected:syncInfo.connected,pending,status:syncStatus,conflict,connect,reload,disconnect}};
}
