import React from 'react';
import {Bar,Legend,tally} from './Common.jsx';

export default function Dashboard({active,ratings,onOpen,onSetup}){
 const totals=[0,1,2].map(pass=>active.reduce((all,subject)=>tally(subject,ratings,pass).map((count,index)=>count+all[index]),[0,0,0,0]));
 return <div id="home"><header className="masthead"><h1>VCE Units 3 &amp; 4</h1><p className="standfirst">Rate every key knowledge point three times, then watch the red turn green.</p><section className="totals" aria-label="Progress across selected subjects">{totals.map((counts,pass)=><div className="totals-row" key={pass}><span className="tag">{pass+1}</span><Bar counts={counts}/><span className="count">{counts[3]} of {counts.reduce((sum,count)=>sum+count,0)} green</span></div>)}<Legend/></section></header>
  <p className="readout">{active.length} subjects, {active.reduce((count,subject)=>count+subject.points.length,0)} key knowledge points.</p><div className="subject-heading"><p className="section-label">Your subjects</p><button className="ghost" onClick={onSetup}>Change subjects</button></div>
  <div id="subject-list">{active.map(subject=><button className="subject" key={subject.id} onClick={()=>onOpen(subject.id)} style={{'--swatch':subject.theme.accent}}><div><h2><span className="dot"/>{subject.name}</h2><div className="meta">{subject.points.length} points</div></div><div className="minis">{[0,1,2].map(pass=><div className="mini" key={pass}><span>{pass+1}</span><Bar counts={tally(subject,ratings,pass)}/></div>)}</div></button>)}</div>
 </div>;
}
