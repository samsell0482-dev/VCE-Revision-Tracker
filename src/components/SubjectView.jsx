import React,{useEffect,useState} from 'react';
import {loadSubject} from '../subject-loader.js';
import {Chips,Legend,ratingStates,tally} from './Common.jsx';

function CueCards({subject,ratings,pass}){
 const groups=[1,2].map(state=>{const seen=new Map();for(const point of subject.points.filter(point=>ratings[subject.id][point.id][pass]===state)){const card=point.card||{front:'Explain '+point.title+'.',back:point.detail.split(/(?:;|\. )/).filter(Boolean)},key=card.key||point.id;if(seen.has(key))seen.get(key).refs.push(point.id);else seen.set(key,{card,refs:[point.id],title:card.title||point.title});}return {state,cards:[...seen.values()]};});
 if(groups.every(group=>!group.cards.length))return <div className="empty"><strong>Nothing red or amber in this pass.</strong><span>Rate some topics to build your revision deck.</span></div>;
 return <section id="cards">{groups.map(({state,cards})=>cards.length>0&&<section key={state}><div className="deck-head"><h3>{state===1?'Red':'Amber'}</h3><span>{cards.length} cards</span></div><div className="deck">{cards.map(({card,refs,title})=><article className={'qcard '+(state===1?'red':'amber')} key={refs[0]}><div className="qcard-head"><span className="refs">{refs.join(' + ')}</span></div><h4>{title}</h4><p className="front">{card.front}</p><ul>{card.back.map((line,index)=><li key={index}>{line}</li>)}</ul></article>)}</div></section>)}<div className="print-row"><button className="ghost" onClick={()=>window.print()}>Print the deck</button></div></section>;
}

function Question({item,attempt,onUpdate}){
 const {q,p,key}=item,max=q.marks||1,a=attempt||{text:'',choice:null,revealed:false,score:null,checks:[]};
 const match=q.options&&/^([A-Z])\s*(?:[—–:.)-]|$)/.exec(q.answer?.[0]||''),correct=match?match[1].charCodeAt(0)-65:-1,auto=correct>=0&&correct<(q.options?.length||0);
 const change=patch=>onUpdate(key,{...a,...patch}),edit=patch=>change({...patch,score:null,revealed:false,checks:[]});
 return <article className="qz"><div className="qz-head"><span className="n">{p.id}</span><span className="marks">{max} marks</span></div><p className="stem" id={key+'-question'}>{q.q}</p>
  {q.options?<fieldset className="practice-options" aria-labelledby={key+'-question'}>{q.options.map((option,index)=><label className="practice-choice" key={index}><input type="radio" name={key} checked={a.choice===index} onChange={()=>edit({choice:index})}/>{String.fromCharCode(65+index)}. {option}</label>)}</fieldset>:<label className="practice-input-label">Your answer / working<textarea className="practice-input" rows={5} value={a.text} onChange={event=>edit({text:event.target.value})}/></label>}
  <div className="practice-actions"><button className="reveal" aria-expanded={a.revealed} disabled={auto&&a.choice===null} onClick={()=>change({revealed:!a.revealed,...(!a.revealed&&auto?{score:a.choice===correct?max:0}:{})})}>{a.revealed?'Hide answer guide':auto?'Check answer':'Reveal answer guide'}</button><button className="reveal" onClick={()=>{if(confirm('Clear this answer and mark for this pass?'))change({text:'',choice:null,revealed:false,score:null,checks:[]});}}>Try again</button></div>
  {a.revealed&&<div className="ans">{(q.answer||[]).map((line,index)=><label className="practice-choice" key={index}><input type="checkbox" checked={!!a.checks[index]} onChange={event=>{const checks=[...a.checks];checks[index]=event.target.checked;change({checks});}}/>{line}</label>)}</div>}
  <label className="practice-mark">Your mark <select value={a.score??''} disabled={auto} onChange={event=>change({score:event.target.value===''?null:Number(event.target.value)})}><option value="">Choose a mark</option>{Array.from({length:max+1},(_,mark)=><option key={mark} value={mark}>{mark} / {max}</option>)}</select></label>
  <p className="practice-feedback" role="status">{a.score!==null?(auto?(a.score===max?'Correct. ':'Not quite. '):'Self-marked: ')+a.score+'/'+max+' marks.':a.text?'Answer saved as a draft.':'Not marked yet.'}</p>
 </article>;
}

function Practice({subject,ratings,pass,attempts,onUpdate}){
 const [scope,setScope]=useState('red');
 const all=subject.points.flatMap(point=>(point.questions||[]).map((question,index)=>({p:point,q:question,key:[subject.id,point.id,index,pass].join('|')})));
 const questions=all.filter(item=>scope==='all'||(scope==='red'?ratings[subject.id][item.p.id][pass]===1:attempts[item.key]?.score==null)),marked=all.filter(item=>attempts[item.key]?.score!=null);
 return <section id="practice"><div className="deck-head"><h3>Practice</h3><span>Pass {pass+1}</span></div><p className="deck-note">Write your answer, reveal the guide, then record your own mark.</p><Chips label="Practice questions" options={[['red','Red topics'],['all','All questions'],['unfinished','Not marked yet']]} value={scope} onChange={setScope}/><p className="practice-summary">{questions.length} shown · {marked.length}/{all.length} marked · {marked.reduce((sum,item)=>sum+attempts[item.key].score,0)}/{marked.reduce((sum,item)=>sum+(item.q.marks||1),0)} marks</p>{!questions.length&&<div className="empty">No matching questions. Choose All questions to practise any topic.</div>}{questions.map(item=><Question key={item.key} item={item} attempt={attempts[item.key]} onUpdate={onUpdate}/>)}</section>;
}

function Subject({subject,ratings,onRate,onBack,attempts,onAttempt}){
 const [pass,setPass]=useState(0),[filter,setFilter]=useState('all'),[view,setView]=useState('rate'),[target,setTarget]=useState(null),counts=tally(subject,ratings,pass);
 const visible=point=>filter==='all'||(filter==='unrated'?ratings[subject.id][point.id][pass]===0:[1,2].includes(ratings[subject.id][point.id][pass]));
 useEffect(()=>{if(target){document.getElementById('point-'+target)?.scrollIntoView({block:'center'});setTarget(null);}},[target,view,filter]);
 return <div id="subject-view"><button className="backlink" onClick={onBack}>← All subjects</button><header className="masthead subject-band"><h1 id="subject-title">{subject.name}</h1></header>
  <section className="map" aria-label="Confidence across this subject">{[0,1,2].map(reviewPass=><div className="map-pass" key={reviewPass}><span className="tag">Pass {reviewPass+1}</span><div className="rating-map">{subject.points.map(point=><button key={point.id} data-s={ratings[subject.id][point.id][reviewPass]} title={point.title} aria-label={'Pass '+(reviewPass+1)+', '+point.title+': '+ratingStates[ratings[subject.id][point.id][reviewPass]]} onClick={()=>{setPass(reviewPass);setFilter('all');setView('rate');setTarget(point.id);}}/>)}</div></div>)}<Legend/></section>
  <section className="stats">{[3,2,1,0].map(state=><div className="stat" data-s={state} key={state}><span className="stat-n">{counts[state]}</span><span className="stat-k">{ratingStates[state]}</span></div>)}</section>
  <div className="controls"><Chips label="Working on" options={[[0,'Pass 1'],[1,'Pass 2'],[2,'Pass 3']]} value={pass} onChange={setPass}/>{view==='rate'&&<Chips label="Showing" options={[['all','Everything'],['unrated','Not yet rated'],['weak','Red and amber']]} value={filter} onChange={setFilter}/>}<Chips label="View" options={[['rate','Rate'],['cards','Cue cards'],['practice','Practice']]} value={view} onChange={setView}/></div>
  {view==='rate'&&<section id="list">{subject.areas.map(area=>{const points=subject.points.filter(point=>point.area===area&&visible(point));return points.length>0&&<section className="area" key={area}><div className="area-head"><h3>{area}</h3><span className="area-count">{points.length} points</span></div>{points.map(point=><div className="point" id={'point-'+point.id} key={point.id}><div className="boxes">{[0,1,2].map(reviewPass=><button className="box" key={reviewPass} data-state={ratings[subject.id][point.id][reviewPass]} aria-label={'Pass '+(reviewPass+1)+', '+point.id+': '+ratingStates[ratings[subject.id][point.id][reviewPass]]} onClick={event=>onRate(subject.id,point.id,reviewPass,event.shiftKey||event.altKey?-1:1)}>{reviewPass+1}</button>)}</div><div><div className="point-id">{point.id}</div><h4 className="point-title">{point.title}</h4><p className="point-detail">{point.detail}</p></div></div>)}</section>;})}{!subject.points.some(visible)&&<div className="empty">No topics match this filter.</div>}</section>}
  {view==='cards'&&<CueCards subject={subject} ratings={ratings} pass={pass}/>} {view==='practice'&&<>{subject.practiceNote&&<p className="deck-note">{subject.practiceNote}</p>}<Practice subject={subject} ratings={ratings} pass={pass} attempts={attempts} onUpdate={onAttempt}/></>}
  <p className="colophon">{subject.source} {subject.sourceUrl&&<a href={subject.sourceUrl} target="_blank" rel="noreferrer">{subject.sourceLabel||'Official study design'}</a>}</p>{subject.papers&&<section className="papers"><h3>Practice exams</h3><p>{subject.papers}</p>{subject.papersUrl&&<a href={subject.papersUrl} target="_blank" rel="noreferrer">Official VCAA examination resources</a>}</section>}
 </div>;
}

export default function SubjectView({entry,...props}){
 const [subject,setSubject]=useState(null),[error,setError]=useState(null);
 useEffect(()=>{let cancelled=false;setSubject(null);setError(null);loadSubject(entry.id).then(value=>{if(!cancelled)setSubject(value);}).catch(reason=>{if(!cancelled)setError(reason.message);});return()=>{cancelled=true;};},[entry.id]);
 if(error)return <div id="subject-view"><button className="backlink" onClick={props.onBack}>← All subjects</button><div className="empty"><strong>{entry.name} could not be loaded.</strong><span>{error} Check your connection and try again.</span></div></div>;
 if(!subject)return <div id="subject-view"><button className="backlink" onClick={props.onBack}>← All subjects</button><header className="masthead subject-band"><h1 id="subject-title">{entry.name}</h1></header><div className="empty" role="status"><strong>Loading {entry.name}…</strong><span>Fetching this subject's points and practice questions.</span></div></div>;
 return <Subject subject={subject} {...props}/>;
}
