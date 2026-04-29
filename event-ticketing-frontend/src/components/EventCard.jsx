import {useState} from 'react';
import Icon from './ui/Icon';
import {ic,CATS} from '../constants/data';
import {fmt,fmtT,minP,grad} from '../utils/helpers';

export default function EventCard({event,onClick}){
  const[hov,setHov]=useState(false);
  const cat=CATS.find(c=>c.id===event.category);
  const rem=event.tiers?.reduce((s,t)=>s+(t.remainingQuantity??0),0)??null;
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={()=>onClick(event)}
      style={{background:'var(--card)',borderRadius:16,overflow:'hidden',cursor:'pointer',border:'1px solid',borderColor:hov?'#6c47ff':'var(--border)',transform:hov?'translateY(-5px)':'none',transition:'all .22s',boxShadow:hov?'0 16px 48px rgba(108,71,255,.2)':'none',position:'relative'}}>
      <div style={{height:155,background:event.posterUrl?`url(${event.posterUrl}) center/cover`:grad(event._id),position:'relative',display:'flex',alignItems:'flex-end',padding:14}}>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(7,7,14,.8),transparent)'}}/>
        <span style={{background:cat?.color||'#6c47ff',color:'#fff',fontSize:10,fontWeight:800,padding:'2px 10px',borderRadius:20,position:'relative',zIndex:1,letterSpacing:.5}}>{event.category}</span>
        <span style={{marginLeft:'auto',background:'rgba(0,0,0,.6)',color:'#f0a500',fontSize:11,fontWeight:800,padding:'2px 10px',borderRadius:20,position:'relative',zIndex:1}}>₹{minP(event.tiers).toLocaleString()}+</span>
      </div>
      <div style={{padding:'14px 16px 16px'}}>
        <h3 style={{fontSize:14,fontWeight:700,marginBottom:9,lineHeight:1.4,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',fontFamily:'var(--font-head)'}}>{event.title}</h3>
        <div style={{display:'flex',flexDirection:'column',gap:5}}>
          <div style={{display:'flex',alignItems:'center',gap:5,color:'var(--muted)',fontSize:11}}><Icon d={ic.cal} size={12}/>{fmt(event.startTime)} · {fmtT(event.startTime)}</div>
          <div style={{display:'flex',alignItems:'center',gap:5,color:'var(--muted)',fontSize:11}}><Icon d={ic.map} size={12}/>{event.venueName}</div>
        </div>
        {rem!==null&&(
          <div style={{marginTop:10,display:'flex',alignItems:'center',gap:5}}>
            <div style={{flex:1,height:3,background:'var(--border)',borderRadius:2,overflow:'hidden'}}>
              <div style={{height:'100%',background:rem<20?'#ff4d6d':rem<50?'#f0a500':'#00d68f',borderRadius:2,width:`${Math.min(100,(rem/200)*100)}%`,transition:'width .3s'}}/>
            </div>
            <span style={{fontSize:10,color:rem<20?'#ff4d6d':rem<50?'#f0a500':'var(--muted)',fontWeight:700,flexShrink:0}}>{rem===0?'SOLD OUT':`${rem} left`}</span>
          </div>
        )}
      </div>
    </div>
  );
}