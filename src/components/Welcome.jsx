import React from 'react';

const steps=[
 ['01','Self assess','Rate each knowledge point so you can immediately see what needs attention.'],
 ['02','Revise','Use focused cue cards to strengthen your red and amber topics.'],
 ['03','Improve','Return regularly, retry questions and turn your weaker topics from red to green.']
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
