
import {useState,useEffect} from 'react';
import EventCard from '../components/EventCard';
import Icon from '../components/ui/Icon';
import {ic,CATS} from '../constants/data';
import {minP} from '../utils/helpers';

export default function EventsPage({events,onEventClick,initCategory}){
  const[search,setSearch]=useState('');
  const[cat,setCat]=useState(initCategory||'');
  const[sort,setSort]=useState('date');
  useEffect(()=>setCat(initCategory||''),[initCategory]);
  const filtered=events
    .filter(e=>!cat||e.category===cat)
    .filter(e=>!search||e.title.toLowerCase().includes(search.toLowerCase())||e.venueAddress?.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>sort==='price'?minP(a.tiers)-minP(b.tiers):new Date(a.startTime)-new Date(b.startTime));
  return(
    <div style={{maxWidth:1200,margin:'0 auto',padding:'38px 24px'}}>
      <h1 style={{fontSize:26,fontWeight:800,marginBottom:24,fontFamily:'var(--font-head)'}}>All Events</h1>
      <div style={{display:'flex',gap:12,marginBottom:24,flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:'1 1 260px'}}>
          <div style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)'}}><Icon d={ic.search} size={15} color="var(--muted)"/></div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search events, venues…" style={{paddingLeft:36}}/>
        </div>
        <select value={cat} onChange={e=>setCat(e.target.value)} style={{width:150}}>
          <option value="">All Categories</option>
          {CATS.map(c=><option key={c.id} value={c.id}>{c.id}</option>)}
        </select>
        <select value={sort} onChange={e=>setSort(e.target.value)} style={{width:150}}>
          <option value="date">Sort: Date</option>
          <option value="price">Sort: Price ↑</option>
        </select>
      </div>
      <p style={{color:'var(--muted)',fontSize:13,marginBottom:18}}>{filtered.length} event{filtered.length!==1?'s':''} found</p>
      {filtered.length===0
        ?<div style={{textAlign:'center',padding:'70px 0',color:'var(--muted)'}}><Icon d={ic.search} size={44}/><p style={{marginTop:14,fontSize:17}}>No events found</p></div>
        :<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:18}}>{filtered.map(e=><EventCard key={e._id} event={e} onClick={onEventClick}/>)}</div>
      }
    </div>
  );
}