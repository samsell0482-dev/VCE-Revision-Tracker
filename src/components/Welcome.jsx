import React from 'react';

const steps=[
 ['01','Choose','Build a tracker containing only the VCE subjects you study.'],
 ['02','Revise','Rate each knowledge point, use cue cards, and answer practice questions.'],
 ['03','Improve','Return for three passes and turn your weaker topics from red to green.']
];

export default function Welcome({onContinue}){
 return <section className="welcome" aria-labelledby="welcome-title">
  <div className="welcome-hero">
   <span className="tag">VCE REVISION TRACKER</span>
   <h1 id="welcome-title">Know what to revise next.</h1>
   <p>Keep every Units 3 &amp; 4 knowledge point in one place, see where your confidence is weakest, and make each revision session count.</p>
   <button className="welcome-action" onClick={onContinue}>Choose my subjects <span aria-hidden="true">→</span></button>
  </div>
  <div className="welcome-steps" aria-label="How the revision tracker works">{steps.map(([number,title,description])=><article key={number}><span>{number}</span><h2>{title}</h2><p>{description}</p></article>)}</div>
  <p className="welcome-privacy">Your progress is saved locally. You can optionally connect a OneDrive progress file later to work across computers.</p>
 </section>;
}
