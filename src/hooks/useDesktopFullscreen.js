import {useEffect} from 'react';
import {isTauri} from '@tauri-apps/api/core';
import {getCurrentWindow} from '@tauri-apps/api/window';

export default function useDesktopFullscreen(){
 useEffect(()=>{
  if(!isTauri())return;
  const appWindow=getCurrentWindow();
  let changing=false;
  async function toggleFullscreen(event){
   if(!['F11','Escape'].includes(event.key)||event.repeat)return;
   const fullscreen=await appWindow.isFullscreen();
   if(event.key==='Escape'&&!fullscreen)return;
   event.preventDefault();
   if(changing)return;
   changing=true;
   try{await appWindow.setFullscreen(event.key==='Escape'?false:!fullscreen);}
   catch(error){console.error('Fullscreen could not be changed.',error);}
   finally{changing=false;}
  }
  window.addEventListener('keydown',toggleFullscreen,true);
  return()=>window.removeEventListener('keydown',toggleFullscreen,true);
 },[]);
}
