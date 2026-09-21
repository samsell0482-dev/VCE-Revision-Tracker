import React,{useEffect,useState} from 'react';
import {Bar,Legend,tally} from './Common.jsx';

export default function Dashboard({active,ratings,onOpen,onSetup}){
 const pageSize=()=>innerWidth<620||innerHeight<650?2:innerWidth<900||innerHeight<850?4:6;
 const [perPage,setPerPage]=useState(pageSize),[page,setPage]=useState(0);
 useEffect(()=>{const resize=()=>setPerPage(pageSize());addEventListener('resize',resize);return()=>removeEventListener('resize',resize);},[]);
 const pageCount=Math.max(1,Math.ceil(active.length/perPage));
 useEffect(()=>setPage(value=>Math.min(value,pageCount-1)),[pageCount]);
 const shown=active.slice(page*perPage,(page+1)*perPage);
 const totals=active.reduce((all,subject)=>tally(subject,ratings).map((count,index)=>count+all[index]),[0,0,0,0]);
 return <div id="home"><header className="masthead"><h1>VCE Units 3 &amp; 4</h1><p className="standfirst">Self-assess every key knowledge point, then focus your revision where it matters most.</p><section className="totals" aria-label="Progress across selected subjects"><div className="totals-row"><span className="tag">Now</span><Bar counts={totals}/><span className="count">{totals[3]} of {totals.reduce((sum,count)=>sum+count,0)} green</span></div><Legend/></section></header>
  <p className="readout">{active.length} subjects, {active.reduce((count,subject)=>count+subject.points.length,0)} key knowledge points.</p><div className="subject-heading"><p className="section-label">Your subjects</p><div className="dashboard-actions">{pageCount>1&&<div className="subject-pages" aria-label="Subject pages"><button className="ghost" disabled={page===0} onClick={()=>setPage(value=>value-1)} aria-label="Previous subject page">←</button><span>{page+1} / {pageCount}</span><button className="ghost" disabled={page===pageCount-1} onClick={()=>setPage(value=>value+1)} aria-label="Next subject page">→</button></div>}<button className="ghost" onClick={onSetup}>Change subjects</button></div></div>
  <div id="subject-list">{shown.map(subject=>{const counts=tally(subject,ratings);return <button className="subject" key={subject.id} onClick={()=>onOpen(subject.id)} style={{'--swatch':subject.theme.accent}}><div><h2><span className="dot"/>{subject.name}</h2><div className="meta">{subject.points.length} points - {counts[3]} confident</div></div><div className="minis"><div className="mini"><span>Now</span><Bar counts={counts}/></div></div></button>;})}</div>
 </div>;
}
