import React,{useEffect,useState} from 'react';
import {isTauri} from '@tauri-apps/api/core';
import {getCurrentWindow} from '@tauri-apps/api/window';

function Icon({name}){
 const paths={
  minimize:<path d="M4 12h16"/>,
  maximize:<rect x="5" y="5" width="14" height="14" rx="1"/>,
  fullscreen:<><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></>,
  restore:<><path d="M8 8h11v11H8z"/><path d="M5 16V5h11"/></>,
  close:<path d="m6 6 12 12M18 6 6 18"/>
 };
 return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export default function DesktopTitlebar(){
 const desktop=isTauri(),[fullscreen,setFullscreenState]=useState(false),[maximized,setMaximized]=useState(false),[revealed,setRevealed]=useState(true);
 useEffect(()=>{
  if(!desktop)return;
  const appWindow=getCurrentWindow(),html=document.documentElement;
  html.dataset.desktop='true';
  let cancelled=false,unlisten;
  const update=async()=>{
   const [isFullscreen,isMaximized]=await Promise.all([appWindow.isFullscreen(),appWindow.isMaximized()]);
   if(cancelled)return;
   setFullscreenState(isFullscreen);setMaximized(isMaximized);html.dataset.appFullscreen=String(isFullscreen);
   if(!isFullscreen)setRevealed(true);
  };
  update();
  appWindow.onResized(update).then(value=>{unlisten=value;});
  const reveal=event=>{if(!fullscreen)return;if(event.clientY<=7)setRevealed(true);else if(event.clientY>48)setRevealed(false);};
  window.addEventListener('mousemove',reveal);
  return()=>{cancelled=true;unlisten?.();window.removeEventListener('mousemove',reveal);delete html.dataset.desktop;delete html.dataset.appFullscreen;};
 },[desktop,fullscreen]);
 if(!desktop)return null;
 const appWindow=getCurrentWindow();
 const toggleFullscreen=async()=>{await appWindow.setFullscreen(!fullscreen);setFullscreenState(!fullscreen);setRevealed(!fullscreen);};
 return <header className="desktop-titlebar" data-fullscreen={fullscreen} data-revealed={revealed} data-tauri-drag-region onDoubleClick={()=>appWindow.toggleMaximize()}>
  <span className="desktop-title" data-tauri-drag-region>VCE Revision Tracker</span>
  <div className="window-actions">
   <button type="button" aria-label="Minimise app" onDoubleClick={event=>event.stopPropagation()} onClick={()=>appWindow.minimize()}><Icon name="minimize"/></button>
   <button type="button" aria-label={maximized?'Restore app window':'Maximise app'} onDoubleClick={event=>event.stopPropagation()} onClick={()=>appWindow.toggleMaximize()}><Icon name={maximized?'restore':'maximize'}/></button>
   <button type="button" aria-label={fullscreen?'Exit fullscreen':'Enter fullscreen'} onDoubleClick={event=>event.stopPropagation()} onClick={toggleFullscreen}><Icon name="fullscreen"/></button>
   <button type="button" className="window-close" aria-label="Close app" onDoubleClick={event=>event.stopPropagation()} onClick={()=>appWindow.close()}><Icon name="close"/></button>
  </div>
 </header>;
}
