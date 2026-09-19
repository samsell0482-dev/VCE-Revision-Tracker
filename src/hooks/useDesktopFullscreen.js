import {useEffect} from 'react';
import {isTauri} from '@tauri-apps/api/core';
import {getCurrentWindow} from '@tauri-apps/api/window';

export default function useDesktopFullscreen(){
 useEffect(()=>{
  if(!isTauri())return;
  const appWindow=getCurrentWindow();
  let changing=false;
  async function toggleFullscreen(event){
   if(event.key!=='F11'||event.repeat)return;
   event.preventDefault();
   if(changing)return;
   changing=true;
   try{await appWindow.setFullscreen(!(await appWindow.isFullscreen()));}
   catch(error){console.error('Fullscreen could not be changed.',error);}
   finally{changing=false;}
  }
  window.addEventListener('keydown',toggleFullscreen,true);
  return()=>window.removeEventListener('keydown',toggleFullscreen,true);
 },[]);
}
