import EventCard from '../components/EventCard';
import Btn from '../components/ui/Btn';
import {CATS} from '../constants/data';

export default function CategoriesPage({events,onEventClick,onNav}){
  return(
    <div style={{maxWidth:1200,margin:'0 auto',padding:'38px 24px'}}>
      <h1 style={{fontSize:26,fontWeight:800,marginBottom:36,fontFamily:'var(--font-head)'}}>Categories</h1>
      {CATS.map(c=>{
        const ev=events.filter(e=>e.category===c.id);
        if(!ev.length)return null;
        return(
          <div key={c.id} style={{marginBottom:48}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
              <div style={{width:32,height:32,borderRadius:9,background:`${c.color}22`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{fontSize:15}}>🎭</span>
              </div>
              <h2 style={{fontSize:19,fontWeight:800,fontFamily:'var(--font-head)'}}>{c.id}</h2>
              <Btn onClick={()=>onNav('events',c.id)} variant="ghost" size="sm">See all →</Btn>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:16}}>
              {ev.slice(0,4).map(e=><EventCard key={e._id} event={e} onClick={onEventClick}/>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}