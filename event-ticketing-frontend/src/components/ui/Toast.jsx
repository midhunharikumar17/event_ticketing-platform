import {useState,useEffect} from 'react';
let _st;
export const toast=(msg,type='success')=>_st?.({msg,type,id:Date.now()});
export default function Toast(){
  const[t,setT]=useState(null); _st=setT;
  useEffect(()=>{if(t){const ti=setTimeout(()=>setT(null),3400);return()=>clearTimeout(ti);}},[t]);
  if(!t)return null;
  const c={success:'#00d68f',error:'#ff4d6d',info:'#6c47ff'}[t.type];
  return(
    <div style={{position:'fixed',bottom:28,right:28,zIndex:9999,background:'var(--card)',border:`1.5px solid ${c}`,borderRadius:14,padding:'13px 20px',display:'flex',alignItems:'center',gap:10,boxShadow:`0 8px 40px ${c}33`,maxWidth:340,fontSize:13,fontFamily:'var(--font-body)'}}>
      <div style={{width:8,height:8,borderRadius:'50%',background:c,flexShrink:0,boxShadow:`0 0 10px ${c}`}}/>
      {t.msg}
    </div>
  );
}