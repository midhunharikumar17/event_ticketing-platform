import {useState,useEffect} from 'react';
import EventCard from '../components/EventCard';
import Btn from '../components/ui/Btn';
import {CATS} from '../constants/data';
import {fmt,minP,grad} from '../utils/helpers';

export default function HomePage({events,onEventClick,onNav}){
  const featured=events.slice(0,4);
  const[fi,setFi]=useState(0);
  useEffect(()=>{const t=setInterval(()=>setFi(p=>(p+1)%featured.length),4500);return()=>clearInterval(t);},[featured.length]);
  const fe=featured[fi];
  if(!fe)return null;
  return(
    <div>
      <div style={{minHeight:440,background:fe.posterUrl?`url(${fe.posterUrl}) center/cover`:grad(fe._id),position:'relative',display:'flex',alignItems:'flex-end',padding:'56px 44px'}}>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(7,7,14,.97) 0%,rgba(7,7,14,.2) 70%,transparent 100%)'}}/>
        <div style={{position:'relative',zIndex:1,maxWidth:580}}>
          <span style={{background:'#6c47ff',color:'#fff',padding:'3px 13px',borderRadius:20,fontSize:11,fontWeight:700,display:'inline-block',marginBottom:12}}>{fe.category}</span>
          <h1 style={{fontSize:'clamp(24px,4vw,50px)',fontWeight:900,lineHeight:1.1,marginBottom:12,fontFamily:'var(--font-head)'}}>{fe.title}</h1>
          <p style={{color:'var(--muted)',fontSize:14,marginBottom:22}}>{fe.venueName} · {fmt(fe.startTime)}</p>
          <div style={{display:'flex',gap:10}}>
            <Btn onClick={()=>onEventClick(fe)} variant="gold" size="lg">Book Now — ₹{minP(fe.tiers).toLocaleString()}+</Btn>
            <Btn onClick={()=>onNav('events')} variant="outline" size="lg">Browse All</Btn>
          </div>
        </div>
        <div style={{position:'absolute',bottom:22,right:44,display:'flex',gap:7}}>
          {featured.map((_,i)=><div key={i} onClick={()=>setFi(i)} style={{width:i===fi?28:8,height:8,borderRadius:4,background:i===fi?'#9d7fff':'rgba(255,255,255,.2)',cursor:'pointer',transition:'all .3s'}}/>)}
        </div>
      </div>
      <div style={{maxWidth:1200,margin:'0 auto',padding:'44px 24px'}}>
        <h2 style={{fontSize:20,fontWeight:800,marginBottom:18,fontFamily:'var(--font-head)'}}>Browse by Category</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:12,marginBottom:48}}>
          {CATS.map(c=>(
            <div key={c.id} onClick={()=>onNav('events',c.id)}
              style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:'16px 12px',textAlign:'center',cursor:'pointer',transition:'all .2s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=c.color;e.currentTarget.style.transform='translateY(-3px)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='none';}}>
              <div style={{width:38,height:38,borderRadius:'50%',background:`${c.color}22`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 8px'}}>
                <span style={{fontSize:16}}>🎭</span>
              </div>
              <p style={{fontWeight:600,fontSize:13,fontFamily:'var(--font-head)'}}>{c.id}</p>
            </div>
          ))}
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
          <h2 style={{fontSize:20,fontWeight:800,fontFamily:'var(--font-head)'}}>Trending Events</h2>
          <Btn onClick={()=>onNav('events')} variant="outline" size="sm">View All →</Btn>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:18}}>
          {events.slice(0,6).map(e=><EventCard key={e._id} event={e} onClick={onEventClick}/>)}
        </div>
      </div>
    </div>
  );
}