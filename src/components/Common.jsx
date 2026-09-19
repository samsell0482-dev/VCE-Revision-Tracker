import React from 'react';

export const ratingStates=['not rated',"couldn't explain it",'somewhat confident','confident'];
export const themeNames=['glass','poster','midnight','notebook'];
export const tally=(subject,ratings,pass)=>subject.points.reduce((counts,point)=>(counts[ratings[subject.id][point.id][pass]]++,counts),[0,0,0,0]);

export function Bar({counts}){
 const total=counts.reduce((sum,count)=>sum+count,0);
 return <div className="bar">{[3,2,1].map(state=><div key={state} className="seg" data-s={state} style={{width:(total?counts[state]/total*100:0)+'%'}}/>)}</div>;
}

export function Legend(){
 return <div className="legend-key">{[1,2,3].map(state=><span className="key" data-s={state} key={state}><i/>{ratingStates[state]}</span>)}</div>;
}

export function Chips({label,options,value,onChange}){
 return <div className="group"><span className="group-label">{label}</span><div className="chips" role="group" aria-label={label}>{options.map(([option,text])=><button type="button" className="chip" key={option} aria-pressed={value===option} onClick={()=>onChange(option)}>{text}</button>)}</div></div>;
}
