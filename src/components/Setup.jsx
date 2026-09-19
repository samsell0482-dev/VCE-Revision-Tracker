import React,{useEffect,useRef,useState} from 'react';
import subjects from '../subjects-index.json' with {type:'json'};

export default function Setup({selection,onSave,onCancel}){
 const [draft,setDraft]=useState(selection||[]),ref=useRef(null);
 useEffect(()=>{
  const html=document.documentElement,body=document.body,htmlOverflow=html.style.overflow,bodyOverflow=body.style.overflow;
  html.style.overflow='hidden';body.style.overflow='hidden';ref.current.showModal();
  return()=>{html.style.overflow=htmlOverflow;body.style.overflow=bodyOverflow;};
 },[]);
 return <dialog className="setup" ref={ref} aria-labelledby="setup-title" onCancel={event=>{if(!selection)event.preventDefault();else onCancel();}}>
  <form onSubmit={event=>{event.preventDefault();if(draft.length)onSave(draft);}}>
   <span className="tag">YOUR VCE REVISION</span><h2 id="setup-title">Choose your subjects.</h2><p>Build a tracker for what you study. You can change these any time.</p>
   <fieldset><legend>Select at least one subject</legend>{subjects.map(subject=><label key={subject.id}><input type="checkbox" checked={draft.includes(subject.id)} onChange={event=>setDraft(event.target.checked?[...draft,subject.id]:draft.filter(id=>id!==subject.id))}/>{subject.name}</label>)}</fieldset>
   <p>{subjects.length} subjects have revision content ready. More subjects can be added later.</p><p role="status">{draft.length} subjects selected</p><div className="setup-actions"><button className="ghost" disabled={!draft.length}>{selection?'Save subjects':'Start revising'}</button>{selection&&<button type="button" className="ghost" onClick={onCancel}>Cancel</button>}</div>
  </form>
 </dialog>;
}
