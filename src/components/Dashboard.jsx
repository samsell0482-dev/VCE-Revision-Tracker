import React from 'react';
import {Bar,Legend,tally} from './Common.jsx';

export default function Dashboard({active,ratings,onOpen,onSetup}){
 const totals=active.reduce((all,subject)=>tally(subject,ratings).map((count,index)=>count+all[index]),[0,0,0,0]);
 return <div id="home"><header className="masthead"><h1>VCE Units 3 &amp; 4</h1><p className="standfirst">Self-assess every key knowledge point, then focus your revision where it matters most.</p><section className="totals" aria-label="Progress across selected subjects"><div className="totals-row"><span className="tag">Now</span><Bar counts={totals}/><span className="count">{totals[3]} of {totals.reduce((sum,count)=>sum+count,0)} green</span></div><Legend/></section></header>
  <p className="readout">{active.length} subjects, {active.reduce((count,subject)=>count+subject.points.length,0)} key knowledge points.</p><div className="subject-heading"><p className="section-label">Your subjects</p><button className="ghost" onClick={onSetup}>Change subjects</button></div>
  <div id="subject-list">{active.map(subject=>{const counts=tally(subject,ratings);return <button className="subject" key={subject.id} onClick={()=>onOpen(subject.id)} style={{'--swatch':subject.theme.accent}}><div><h2><span className="dot"/>{subject.name}</h2><div className="meta">{subject.points.length} points - {counts[3]} confident</div></div><div className="minis"><div className="mini"><span>Now</span><Bar counts={counts}/></div></div></button>;})}</div>
 </div>;
}
