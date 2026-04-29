import {useState,useEffect} from 'react';
import API from '../api/axios';
import Btn from '../components/ui/Btn';
import Icon from '../components/ui/Icon';
import {ic} from '../constants/data';
import {grad} from '../utils/helpers';

export default function VenuesPage({user,onNav}){
  const[venues,setVenues]=useState([]);
  const[loading,setLoading]=useState(true);
  const[search,setSearch]=useState('');

  useEffect(()=>{
    API.get('/venues').then(r=>setVenues(r.data.venues||[])).finally(()=>setLoading(false));
  },[]);

  const filtered=venues.filter(v=>!search||v.name.toLowerCase().includes(search.toLowerCase())||v.city.toLowerCase().includes(search.toLowerCase()));

  return(
    <div style={{maxWidth:1100,margin:'0 auto',padding:'38px 24px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
        <h1 style={{fontSize:26,fontWeight:800,fontFamily:'var(--font-head)'}}>Venues</h1>
        {(user?.role==='organizer'||user?.role==='admin')&&(
          <Btn onClick={()=>onNav('profile')} size="sm"><Icon d={ic.plus} size={13}/>Register Venue</Btn>
        )}
      </div>
      <div style={{position:'relative',marginBottom:24,maxWidth:400}}>
        <div style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)'}}><Icon d={ic.search} size={15} color="var(--muted)"/></div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search venues, cities…" style={{paddingLeft:36}}/>
      </div>
      {loading?(
        <p style={{color:'var(--muted)'}}>Loading…</p>
      ):filtered.length===0?(
        <div style={{textAlign:'center',padding:'60px 0',color:'var(--muted)'}}>
          <Icon d={ic.venue} size={44}/>
          <p style={{marginTop:14,fontSize:17}}>{search?'No venues found':'No venues registered yet'}</p>
        </div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:18}}>
          {filtered.map(v=>(
            <div key={v._id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:16,overflow:'hidden',transition:'all .22s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#6c47ff';e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 12px 40px rgba(108,71,255,.15)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';}}>
              <div style={{height:100,background:grad(v._id),position:'relative',display:'flex',alignItems:'flex-end',padding:14}}>
                <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(7,7,14,.7),transparent)'}}/>
                <p style={{position:'relative',zIndex:1,fontWeight:800,fontSize:16,fontFamily:'var(--font-head)'}}>{v.name}</p>
              </div>
              <div style={{padding:16}}>
                <div style={{display:'flex',alignItems:'center',gap:6,color:'var(--muted)',fontSize:12,marginBottom:8}}>
                  <Icon d={ic.map} size={13}/>{v.address}, {v.city}, {v.state}
                </div>
                <div style={{display:'flex',gap:8,marginBottom:12}}>
                  <span style={{background:'rgba(108,71,255,.12)',color:'#9d7fff',fontSize:11,padding:'2px 9px',borderRadius:8,fontWeight:600}}>
                    {v.capacity.toLocaleString()} capacity
                  </span>
                  <span style={{background:'rgba(0,214,143,.1)',color:'#00d68f',fontSize:11,padding:'2px 9px',borderRadius:8,fontWeight:600}}>
                    {v.layouts?.length||0} layout(s)
                  </span>
                </div>
                {v.layouts?.length>0&&(
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {v.layouts.slice(0,2).map(l=>(
                      <div key={l._id} style={{background:'var(--bg)',borderRadius:8,padding:'8px 12px',border:'1px solid var(--border)'}}>
                        <p style={{fontWeight:600,fontSize:12,marginBottom:3}}>{l.name}</p>
                        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                          {l.zones?.slice(0,3).map(z=>(
                            <span key={z._id||z.name} style={{fontSize:10,color:z.color||'#9d7fff',fontWeight:600}}>{z.name}({z.totalCapacity})</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p style={{fontSize:11,color:'var(--muted)',marginTop:10}}>Owned by {v.ownerId?.displayName||'Organizer'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}