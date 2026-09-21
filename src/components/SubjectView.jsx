import React,{useEffect,useRef,useState} from 'react';
import {loadSubject} from '../subject-loader.js';
import {Chips,Legend,ratingStates,tally} from './Common.jsx';

const emptyAttempt=question=>({
 text:'',
 choice:null,
 revealed:false,
 score:null,
 checks:Array.from({length:question.answer?.length||0},()=>false),
 startedAt:null,
 completedAt:null
});

const hasAttemptContent=attempt=>!!attempt&&(attempt.text?.trim()||attempt.choice!==null||attempt.revealed||attempt.score!==null||attempt.checks?.some(Boolean));

function bestScore(record){
 const scores=[...(record?.history||[]),record?.current].map(attempt=>attempt?.score).filter(Number.isInteger);
 return scores.length?Math.max(...scores):null;
}

function FocusedCueCard({item,index,total,onClose,onMove}){
 const ref=useRef(null),titleId='focused-cue-card-title';
 useEffect(()=>{
  const html=document.documentElement,body=document.body,htmlOverflow=html.style.overflow,bodyOverflow=body.style.overflow;
  html.style.overflow='hidden';body.style.overflow='hidden';ref.current.showModal();
  return()=>{html.style.overflow=htmlOverflow;body.style.overflow=bodyOverflow;};
 },[]);
 return <dialog className="card-focus" ref={ref} aria-labelledby={titleId} onCancel={event=>{event.preventDefault();onClose();}}>
  <div className="card-focus-toolbar"><span>{index+1} of {total}</span><button type="button" className="ghost card-focus-close" onClick={onClose} aria-label="Close focused cue card">Close</button></div>
  <article className={'qcard card-focus-card '+(item.state===1?'red':'amber')}>
   <div className="qcard-head"><span className="refs">{item.refs.join(' + ')}</span><span>Term / concept</span></div>
   <h2 id={titleId}>{item.card.front}</h2>
   <p className="card-focus-label">Definition / required knowledge</p>
   <ul>{item.card.back.map((line,lineIndex)=><li key={lineIndex}>{line}</li>)}</ul>
  </article>
  <div className="card-focus-nav"><button type="button" className="ghost" disabled={total<2} onClick={()=>onMove(-1)}>← Previous</button><button type="button" className="ghost" disabled={total<2} onClick={()=>onMove(1)}>Next →</button></div>
 </dialog>;
}

function CueCards({subject,ratings}){
 const [focusedKey,setFocusedKey]=useState(null),lastTrigger=useRef(null);
 const groups=[1,2].map(state=>{
  const seen=new Map();
  for(const point of subject.points.filter(point=>ratings[subject.id][point.id]===state)){
   const card=point.card||{front:point.title,back:[point.detail]},key=card.key||point.id;
   if(seen.has(key))seen.get(key).refs.push(point.id);
   else seen.set(key,{card,refs:[point.id]});
  }
  return {state,cards:[...seen.values()]};
 });
 const allCards=groups.flatMap(group=>group.cards.map(item=>({...item,state:group.state,key:item.card.key||item.refs[0]})));
 const focusedIndex=allCards.findIndex(item=>item.key===focusedKey),focused=allCards[focusedIndex];
 const openCard=(event,key)=>{lastTrigger.current=event.currentTarget;setFocusedKey(key);};
 const closeCard=()=>{setFocusedKey(null);requestAnimationFrame(()=>lastTrigger.current?.focus());};
 const moveCard=direction=>setFocusedKey(allCards[(focusedIndex+direction+allCards.length)%allCards.length].key);
 if(groups.every(group=>!group.cards.length))return <div className="empty"><strong>Nothing red or amber right now.</strong><span>Rate some topics to build your revision deck.</span></div>;
 return <section id="cards">{groups.map(({state,cards})=>cards.length>0&&<section key={state}>
  <div className="deck-head"><h3>{state===1?'Red':'Amber'}</h3><span>{cards.length} cards</span></div>
  <div className="deck">{cards.map(({card,refs})=>{const key=card.key||refs[0];return <article className={'qcard '+(state===1?'red':'amber')} key={refs[0]} role="button" tabIndex="0" aria-haspopup="dialog" aria-label={'Focus on cue card: '+card.front} onClick={event=>openCard(event,key)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openCard(event,key);}}}>
   <div className="qcard-head"><span className="refs">{refs.join(' + ')}</span><span>Term / concept</span></div><h4>{card.front}</h4>
   <ul>{card.back.map((line,index)=><li key={index}>{line}</li>)}</ul>
  </article>;})}</div>
 </section>)}<div className="print-row"><button className="ghost" onClick={()=>window.print()}>Print the deck</button></div>{focused&&<FocusedCueCard key={focused.key} item={focused} index={focusedIndex} total={allCards.length} onClose={closeCard} onMove={moveCard}/>}</section>;
}

function Question({item,attempt,onUpdate}){
 const {q,p,key}=item,max=q.marks||1,record=attempt||{current:emptyAttempt(q),history:[]},history=record.history||[],a=record.current||emptyAttempt(q);
 const match=q.options&&/^([A-Z])\s*(?:[—–:.)-]|$)/.exec(q.answer?.[0]||''),correct=match?match[1].charCodeAt(0)-65:-1,auto=correct>=0&&correct<(q.options?.length||0);
 const change=patch=>onUpdate(key,{...record,history,current:{...a,startedAt:a.startedAt||new Date().toISOString(),...patch}});
 const edit=patch=>change({...patch,score:null,revealed:false,checks:Array.from({length:q.answer?.length||0},()=>false)});
 const previousBest=bestScore(record);
 function tryAgain(){
  if(!hasAttemptContent(a))return;
  if(!confirm('Save this attempt and start a new one?'))return;
  onUpdate(key,{history:[...history,{...a,completedAt:new Date().toISOString()}],current:{...emptyAttempt(q),startedAt:new Date().toISOString()}});
 }
 return <article className="qz">
  <div className="qz-head"><span className="n">{p.id} · Attempt {history.length+1}</span><span className="marks">{max} marks</span></div>
  <p className="stem" id={key+'-question'}>{q.q}</p>
  {q.options?<fieldset className="practice-options" aria-labelledby={key+'-question'}>{q.options.map((option,index)=><label className="practice-choice" key={index}><input type="radio" name={key} checked={a.choice===index} onChange={()=>edit({choice:index})}/>{String.fromCharCode(65+index)}. {option}</label>)}</fieldset>:<label className="practice-input-label">Your answer / working<textarea className="practice-input" rows={5} value={a.text} onChange={event=>edit({text:event.target.value})}/></label>}
  {!auto&&<div className="practice-mark"><span>Your mark</span><div className="mark-options" role="group" aria-label="Choose your mark">{Array.from({length:max+1},(_,mark)=><button type="button" className="mark-option" key={mark} aria-label={'Choose '+mark+' out of '+max} aria-pressed={a.score===mark} onClick={()=>change({score:mark})}>{mark} / {max}</button>)}</div></div>}
  <div className="practice-actions"><button className="reveal" aria-expanded={a.revealed} disabled={auto&&a.choice===null} onClick={()=>change({revealed:!a.revealed,...(!a.revealed&&auto?{score:a.choice===correct?max:0}:{})})}>{a.revealed?'Hide answer guide':auto?'Check answer':'Reveal answer guide'}</button><button className="reveal" disabled={!hasAttemptContent(a)} onClick={tryAgain}>Save and try again</button></div>
  {a.revealed&&<div className="ans"><p>Marking guide</p><ul>{(q.answer||[]).map((line,index)=><li key={index}>{line}</li>)}</ul></div>}
  <p className="practice-feedback" role="status">{a.score!==null?(auto?(a.score===max?'Correct. ':'Not quite. '):'Self-marked: ')+a.score+'/'+max+' marks.':a.text?'Answer saved as a draft.':'Not marked yet.'}{previousBest!==null&&<> Best: {previousBest}/{max}.</>}</p>
  {history.length>0&&<details className="attempt-history"><summary>{history.length} previous {history.length===1?'attempt':'attempts'}</summary><ol>{history.map((past,index)=><li key={index}><strong>Attempt {index+1}: {past.score===null?'not marked':past.score+'/'+max}</strong>{past.text&&<span>{past.text}</span>}{past.choice!==null&&q.options?.[past.choice]&&<span>{String.fromCharCode(65+past.choice)}. {q.options[past.choice]}</span>}</li>)}</ol></details>}
 </article>;
}

function Practice({subject,ratings,attempts,onUpdate}){
 const [scope,setScope]=useState('red');
 const all=subject.points.flatMap(point=>(point.questions||[]).map((question,index)=>({p:point,q:question,key:[subject.id,point.id,index].join('|')})));
 const questions=all.filter(item=>scope==='all'||(scope==='red'?ratings[subject.id][item.p.id]===1:bestScore(attempts[item.key])===null));
 const marked=all.filter(item=>bestScore(attempts[item.key])!==null);
 return <section id="practice">
  <div className="deck-head"><h3>Practice</h3><span>{all.length} questions</span></div>
  <p className="deck-note">Write your answer, reveal the guide, then record your own mark. Starting again preserves the previous attempt.</p>
  <Chips label="Practice questions" options={[['red','Red topics'],['all','All questions'],['unfinished','Not marked yet']]} value={scope} onChange={setScope}/>
  <p className="practice-summary">{questions.length} shown · {marked.length}/{all.length} marked · {marked.reduce((sum,item)=>sum+bestScore(attempts[item.key]),0)}/{marked.reduce((sum,item)=>sum+(item.q.marks||1),0)} best marks</p>
  {!questions.length&&<div className="empty">No matching questions. Choose All questions to practise any topic.</div>}
  {questions.map(item=><Question key={item.key} item={item} attempt={attempts[item.key]} onUpdate={onUpdate}/>)}
 </section>;
}

function RatingHistory({entries=[]}){
 const visible=entries.filter(entry=>entry.state>0).slice(-5);
 if(!visible.length)return null;
 return <div className="rating-history" aria-label="Recent confidence history"><span>Recent</span>{visible.map((entry,index)=><i data-s={entry.state} title={(entry.source?entry.source+': ':'')+ratingStates[entry.state]} key={index}/>)}</div>;
}

const subjectSteps=[
 ['01','Self assess','Rate every knowledge point red, amber or green.','rate'],
 ['02','Revise','Use cue cards for the topics that need attention.','cards'],
 ['03','Practise','Answer questions, mark your work and try again.','practice']
];

function Subject({subject,ratings,ratingHistory,onRate,onBack,attempts,onAttempt}){
 const [filter,setFilter]=useState('all'),[view,setView]=useState('rate'),[target,setTarget]=useState(null),counts=tally(subject,ratings);
 const visible=point=>filter==='all'||(filter==='unrated'?ratings[subject.id][point.id]===0:[1,2].includes(ratings[subject.id][point.id]));
 useEffect(()=>{if(target){document.getElementById('point-'+target)?.scrollIntoView({block:'center'});setTarget(null);}},[target,view,filter]);
 return <div id="subject-view">
  <button className="backlink" onClick={onBack}>← All subjects</button>
  <header className="masthead subject-band"><h1 id="subject-title">{subject.name}</h1></header>
  <nav className="subject-steps" aria-label="How to revise this subject">{subjectSteps.map(([number,title,description,target])=><button type="button" key={number} aria-current={view===target?'step':undefined} onClick={()=>setView(target)}><span>{number}</span><strong>{title}</strong><small>{description}</small></button>)}</nav>
  <section className="map" aria-label="Current confidence across this subject"><div className="rating-map">{subject.points.map(point=><button key={point.id} data-s={ratings[subject.id][point.id]} title={point.title} aria-label={point.title+': '+ratingStates[ratings[subject.id][point.id]]} onClick={()=>{setFilter('all');setView('rate');setTarget(point.id);}}/>)}</div><Legend/></section>
  <section className="stats">{[3,2,1,0].map(state=><div className="stat" data-s={state} key={state}><span className="stat-n">{counts[state]}</span><span className="stat-k">{ratingStates[state]}</span></div>)}</section>
  <div className="controls">{view==='rate'&&<Chips label="Showing" options={[['all','Everything'],['unrated','Not yet rated'],['weak','Red and amber']]} value={filter} onChange={setFilter}/>}<Chips label="View" options={[['rate','Rate'],['cards','Cue cards'],['practice','Practice']]} value={view} onChange={setView}/></div>
  {view==='rate'&&<section id="list">{subject.areas.map(area=>{const points=subject.points.filter(point=>point.area===area&&visible(point));return points.length>0&&<section className="area" key={area}><div className="area-head"><h3>{area}</h3><span className="area-count">{points.length} points</span></div>{points.map(point=>{const current=ratings[subject.id][point.id];return <div className="point" id={'point-'+point.id} key={point.id}><div><div className="boxes" role="group" aria-label={'Confidence for '+point.id}>{[1,2,3].map(state=><button className="box" key={state} data-state={current===state?state:0} aria-pressed={current===state} aria-label={'Mark '+point.id+' as '+ratingStates[state]} onClick={()=>onRate(subject.id,point.id,current===state?0:state)}>{['','R','A','G'][state]}</button>)}</div><RatingHistory entries={ratingHistory[subject.id]?.[point.id]}/></div><div><div className="point-id">{point.id}</div><h4 className="point-title">{point.title}</h4><p className="point-detail">{point.detail}</p></div></div>;})}</section>;})}{!subject.points.some(visible)&&<div className="empty">No topics match this filter.</div>}</section>}
  {view==='cards'&&<CueCards subject={subject} ratings={ratings}/>}
  {view==='practice'&&<>{subject.practiceNote&&<p className="deck-note">{subject.practiceNote}</p>}<Practice subject={subject} ratings={ratings} attempts={attempts} onUpdate={onAttempt}/></>}
  <p className="colophon">{subject.source} {subject.sourceUrl&&<a href={subject.sourceUrl} target="_blank" rel="noreferrer">{subject.sourceLabel||'Official study design'}</a>}</p>
  {subject.papers&&<section className="papers"><h3>Practice exams</h3><p>{subject.papers}</p>{subject.papersUrl&&<a href={subject.papersUrl} target="_blank" rel="noreferrer">Official VCAA examination resources</a>}</section>}
 </div>;
}

export default function SubjectView({entry,...props}){
 const [subject,setSubject]=useState(null),[error,setError]=useState(null);
 useEffect(()=>{let cancelled=false;setSubject(null);setError(null);loadSubject(entry.id).then(value=>{if(!cancelled)setSubject(value);}).catch(reason=>{if(!cancelled)setError(reason.message);});return()=>{cancelled=true;};},[entry.id]);
 if(error)return <div id="subject-view"><button className="backlink" onClick={props.onBack}>← All subjects</button><div className="empty"><strong>{entry.name} could not be loaded.</strong><span>{error} Check your connection and try again.</span></div></div>;
 if(!subject)return <div id="subject-view"><button className="backlink" onClick={props.onBack}>← All subjects</button><header className="masthead subject-band"><h1 id="subject-title">{entry.name}</h1></header><div className="empty" role="status"><strong>Loading {entry.name}…</strong><span>Fetching this subject's points and practice questions.</span></div></div>;
 return <Subject subject={subject} {...props}/>;
}
