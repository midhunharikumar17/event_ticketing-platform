import {useState,useEffect,useCallback} from 'react';
import Btn from '../components/ui/Btn';
import Field from '../components/ui/Field';
import Icon from '../components/ui/Icon';
import Modal from '../components/ui/Modal';
import CreateEventModal from '../components/CreateEventModal';
import VerificationModal from '../components/VerificationModal';
import ResaleModal from '../components/ResaleModal';
import {toast} from '../components/ui/Toast';
import API from '../api/axios';
import {ic} from '../constants/data';
import {uname,fmt,grad} from '../utils/helpers';

// ── Venue management sub-component ───────────────────────────────────────────
function VenueManager(){
  const[venues,setVenues]=useState([]);
  const[createOpen,setCreateOpen]=useState(false);
  const[layoutOpen,setLayoutOpen]=useState(null);
  const[expanded,setExpanded]=useState(null);

  const fetch=()=>API.get('/venues/my').then(r=>setVenues(r.data.venues||[])).catch(()=>{});
  useEffect(()=>{fetch();},[]);

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h3 style={{fontSize:15,fontWeight:700,fontFamily:'var(--font-head)'}}>My Venues</h3>
        <Btn onClick={()=>setCreateOpen(true)} size="sm"><Icon d={ic.plus} size={13}/>Add Venue</Btn>
      </div>
      {venues.length===0?(
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:14,padding:32,textAlign:'center',color:'var(--muted)'}}>
          <Icon d={ic.venue} size={32} color="var(--border)"/>
          <p style={{marginTop:10,fontSize:14}}>No venues yet</p>
          <p style={{fontSize:12,marginTop:4}}>Register a venue to host events with custom seat maps</p>
          <Btn onClick={()=>setCreateOpen(true)} variant="outline" size="sm" style={{marginTop:14}}>Register Venue</Btn>
        </div>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {venues.map(v=>(
            <div key={v._id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden'}}>
              {/* Venue header */}
              <div style={{padding:'14px 18px',display:'flex',alignItems:'center',gap:12,cursor:'pointer'}} onClick={()=>setExpanded(expanded===v._id?null:v._id)}>
                <div style={{width:40,height:40,borderRadius:10,background:grad(v._id),flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontWeight:700,fontSize:14,fontFamily:'var(--font-head)'}}>{v.name}</p>
                  <p style={{color:'var(--muted)',fontSize:12}}>{v.address}, {v.city} · {v.capacity.toLocaleString()} capacity</p>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{background:'rgba(108,71,255,.15)',color:'#9d7fff',fontSize:11,padding:'2px 9px',borderRadius:10,fontWeight:600}}>
                    {v.layouts?.length||0} layout(s)
                  </span>
                  <span style={{color:'var(--muted)',fontSize:18,transition:'transform .2s',transform:expanded===v._id?'rotate(90deg)':'none'}}>›</span>
                </div>
              </div>

              {/* Layouts */}
              {expanded===v._id&&(
                <div style={{borderTop:'1px solid var(--border)',padding:'14px 18px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                    <p style={{fontSize:12,fontWeight:600,color:'var(--muted)',letterSpacing:.5}}>SEATING LAYOUTS</p>
                    <Btn onClick={()=>setLayoutOpen(v._id)} variant="outline" size="sm"><Icon d={ic.layout} size={12}/>Add Layout</Btn>
                  </div>
                  {(!v.layouts||v.layouts.length===0)?(
                    <p style={{color:'var(--muted)',fontSize:12,textAlign:'center',padding:'12px 0'}}>No layouts yet — add one to enable seat selection</p>
                  ):(
                    <div style={{display:'flex',flexDirection:'column',gap:9}}>
                      {v.layouts.map(l=>(
                        <div key={l._id} style={{background:'var(--bg)',borderRadius:10,padding:'12px 14px',border:'1px solid var(--border)'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                            <p style={{fontWeight:600,fontSize:13}}>{l.name}</p>
                            <span style={{fontSize:11,color:'var(--muted)'}}>{l.totalCapacity?.toLocaleString()} total</span>
                          </div>
                          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                            {l.zones?.map(z=>(
                              <div key={z._id||z.name} style={{background:'var(--card)',borderRadius:8,padding:'5px 10px',border:'1px solid var(--border)'}}>
                                <p style={{fontSize:11,fontWeight:600,color:z.color||'#9d7fff'}}>{z.name}</p>
                                <p style={{fontSize:10,color:'var(--muted)'}}>{z.type} · {z.totalCapacity} seats</p>
                                {z.type==='seated'&&<p style={{fontSize:10,color:'var(--muted)'}}>{z.rowCount} rows × {z.seatsPerRow}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <CreateVenueModal open={createOpen} onClose={()=>setCreateOpen(false)} onCreated={()=>{setCreateOpen(false);fetch();toast('Venue registered!');}}/>
      {layoutOpen&&<AddLayoutModal venueId={layoutOpen} onClose={()=>setLayoutOpen(null)} onCreated={()=>{setLayoutOpen(null);fetch();toast('Layout saved!');}}/>}
    </div>
  );
}

function CreateVenueModal({open,onClose,onCreated}){
  const[form,setForm]=useState({name:'',address:'',city:'',state:'',capacity:500,description:''});
  const[loading,setLoading]=useState(false);
  const s=(k,v)=>setForm(p=>({...p,[k]:v}));
  const submit=async()=>{
    setLoading(true);
    try{
      await API.post('/venues',{...form,capacity:Number(form.capacity),location:{type:'Point',coordinates:[76.27,9.93]}});
      onCreated?.();
    }catch(e){toast(e.response?.data?.message||'Failed','error');}
    finally{setLoading(false);}
  };
  return(
    <Modal open={open} onClose={onClose} title="Register a Venue">
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <Field label="Venue Name *"><input value={form.name} onChange={e=>s('name',e.target.value)} placeholder="e.g. City Arena"/></Field>
        <Field label="Address *"><input value={form.address} onChange={e=>s('address',e.target.value)}/></Field>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:11}}>
          <Field label="City *"><input value={form.city} onChange={e=>s('city',e.target.value)}/></Field>
          <Field label="State *"><input value={form.state} onChange={e=>s('state',e.target.value)}/></Field>
        </div>
        <Field label="Total Capacity *"><input type="number" value={form.capacity} onChange={e=>s('capacity',e.target.value)}/></Field>
        <Field label="Description"><textarea value={form.description} onChange={e=>s('description',e.target.value)} rows={2} style={{resize:'vertical'}}/></Field>
        <Btn onClick={submit} full disabled={loading}>{loading?'Saving…':'Register Venue'}</Btn>
      </div>
    </Modal>
  );
}

function AddLayoutModal({venueId,onClose,onCreated}){
  const[form,setForm]=useState({name:'',zones:[{name:'Floor',type:'seated',rowCount:10,seatsPerRow:20,totalCapacity:200,color:'#6c47ff'}]});
  const[loading,setLoading]=useState(false);
  const addZ=()=>setForm(p=>({...p,zones:[...p.zones,{name:'',type:'seated',rowCount:5,seatsPerRow:10,totalCapacity:50,color:'#00d68f'}]}));
  const updZ=(i,k,v)=>setForm(p=>{const z=[...p.zones];z[i]={...z[i],[k]:['rowCount','seatsPerRow','totalCapacity'].includes(k)?Number(v):v};return{...p,zones:z};});
  const rmZ=i=>setForm(p=>({...p,zones:p.zones.filter((_,j)=>j!==i)}));
  const submit=async()=>{
    setLoading(true);
    try{await API.post(`/venues/${venueId}/layouts`,form);onCreated?.();}
    catch(e){toast(e.response?.data?.message||'Failed','error');}
    finally{setLoading(false);}
  };
  return(
    <Modal open={true} onClose={onClose} title="Add Seating Layout" width={560}>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        <Field label="Layout Name *"><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Main Stage Config"/></Field>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <p style={{fontWeight:600,fontSize:13}}>Zones / Sections</p>
          <Btn onClick={addZ} variant="outline" size="sm"><Icon d={ic.plus} size={13}/>Add Zone</Btn>
        </div>
        {form.zones.map((z,i)=>(
          <div key={i} style={{background:'var(--bg)',borderRadius:12,padding:13,border:'1px solid var(--border)'}}>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:10,marginBottom:10}}>
              <Field label="Zone Name"><input value={z.name} onChange={e=>updZ(i,'name',e.target.value)} placeholder="Floor / VIP / Balcony"/></Field>
              <Field label="Type">
                <select value={z.type} onChange={e=>updZ(i,'type',e.target.value)}>
                  <option value="seated">Seated</option>
                  <option value="standing">Standing</option>
                  <option value="vip">VIP</option>
                </select>
              </Field>
              <Field label="Capacity"><input type="number" value={z.totalCapacity} onChange={e=>updZ(i,'totalCapacity',e.target.value)}/></Field>
            </div>
            {z.type==='seated'&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
                <Field label="Rows"><input type="number" value={z.rowCount} onChange={e=>updZ(i,'rowCount',e.target.value)}/></Field>
                <Field label="Seats/Row"><input type="number" value={z.seatsPerRow} onChange={e=>updZ(i,'seatsPerRow',e.target.value)}/></Field>
                <Field label="Color"><input type="color" value={z.color} onChange={e=>updZ(i,'color',e.target.value)} style={{padding:4,height:40}}/></Field>
              </div>
            )}
            {form.zones.length>1&&<Btn onClick={()=>rmZ(i)} variant="danger" size="sm">Remove</Btn>}
          </div>
        ))}
        <Btn onClick={submit} full disabled={loading}>{loading?'Saving…':'Save Layout'}</Btn>
      </div>
    </Modal>
  );
}

// ── Main ProfilePage ──────────────────────────────────────────────────────────
export default function ProfilePage({user,onUpdate,onLogout,onNav}){
  const[form,setForm]=useState({name:uname(user),phone:user?.phone||''});
  const[saving,setSaving]=useState(false);
  const[bookings,setBookings]=useState([]);
  const[myListings,setMyListings]=useState([]);
  const[myEvents,setMyEvents]=useState([]);
  const[loadingB,setLoadingB]=useState(true);
  const[tab,setTab]=useState('bookings'); // 'bookings' | 'venues' | 'events'
  const[createOpen,setCreateOpen]=useState(false);
  const[verifyOpen,setVerifyOpen]=useState(false);
  const[resaleOpen,setResaleOpen]=useState(false);
  const[resaleBooking,setResaleBooking]=useState(null);
  const[cancellingId,setCancellingId]=useState(null);
  const[venues,setVenues]=useState([]);

  const fetchBookings=useCallback(()=>{
    setLoadingB(true);
    Promise.all([
      API.get('/bookings/me').then(r=>setBookings(r.data.bookings||[])).catch(()=>{}),
      API.get('/resale/me').then(r=>setMyListings(r.data.listings||[])).catch(()=>{}),
    ]).finally(()=>setLoadingB(false));
  },[]);

  const fetchVenues=useCallback(()=>{
    API.get('/venues/my').then(r=>setVenues(r.data.venues||[])).catch(()=>{});
  },[]);

  const fetchMyEvents=useCallback(()=>{
    API.get('/events/organizer/me').then(r=>setMyEvents(r.data.events||[])).catch(()=>{});
  },[]);

  useEffect(()=>{fetchBookings();},[]);
  useEffect(()=>{if(isOrganizer){fetchVenues();fetchMyEvents();}},[user?.role]);

  const save=async()=>{
    setSaving(true);
    try{const res=await API.patch('/users/me',{name:form.name,phone:form.phone});onUpdate(res.data.data||user);toast('Profile updated!');}
    catch{toast('Failed to save','error');}
    finally{setSaving(false);}
  };

  const cancel=async id=>{
    if(!window.confirm('Cancel this booking?'))return;
    setCancellingId(id);
    try{await API.post(`/bookings/${id}/cancel`);toast('Booking cancelled','info');fetchBookings();}
    catch(e){toast(e.response?.data?.message||'Failed','error');}
    finally{setCancellingId(null);}
  };

  const isOrganizer=user?.role==='organizer'||user?.role==='admin';
  const isAttendee=user?.role==='attendee';
  const vStatus=user?.verificationRequest?.status||'none';

  const TABS=[
    ['bookings','My Bookings'],
    ...(isOrganizer?[['venues','Venues & Layouts'],['events','My Events']]:[] ),
  ];

  return(
    <div style={{maxWidth:1000,margin:'0 auto',padding:'38px 22px'}}>
      <h1 style={{fontSize:26,fontWeight:800,marginBottom:28,fontFamily:'var(--font-head)'}}>My Profile</h1>
      <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:24,alignItems:'start'}}>

        {/* Left */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {/* Profile card */}
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:16,padding:22}}>
            <div style={{display:'flex',alignItems:'center',gap:13,marginBottom:20}}>
              <div style={{width:50,height:50,borderRadius:'50%',background:'linear-gradient(135deg,#6c47ff,#9d7fff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:800,color:'#fff',flexShrink:0,boxShadow:'0 0 20px #6c47ff44'}}>
                {uname(user)[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{fontWeight:700,fontSize:15,fontFamily:'var(--font-head)'}}>{uname(user)}</p>
                <p style={{color:'var(--muted)',fontSize:12}}>{user?.email}</p>
                <span style={{background:user?.role==='admin'?'#ff4d6d22':user?.role==='organizer'?'#f0a50022':'#6c47ff22',color:user?.role==='admin'?'#ff4d6d':user?.role==='organizer'?'#f0a500':'#9d7fff',fontSize:10,padding:'2px 9px',borderRadius:10,fontWeight:700}}>
                  {user?.role}
                </span>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:11}}>
              <Field label="Full Name"><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></Field>
              <Field label="Phone"><input value={form.phone} placeholder="+91 xxxxxxxxxx" onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></Field>
              <Btn onClick={save} full disabled={saving}>{saving?'Saving…':'Save Changes'}</Btn>
              <Btn onClick={onLogout} variant="danger" full>Logout</Btn>
            </div>
          </div>

          {/* Verification card */}
          {isAttendee&&(()=>{
            const cfg={
              none:{label:'Become an Organizer',color:'#9d7fff',bg:'rgba(108,71,255,.1)',border:'rgba(108,71,255,.25)',action:true,desc:'Register as an organizer to host events and sell tickets.'},
              pending:{label:'⏳ Verification Pending',color:'#f0a500',bg:'rgba(240,165,0,.08)',border:'rgba(240,165,0,.2)',action:false,desc:"Your request is under review. We'll notify you once approved."},
              approved:{label:'✅ Verified',color:'#00d68f',bg:'rgba(0,214,143,.08)',border:'rgba(0,214,143,.2)',action:false,desc:'Your account is verified as an organizer.'},
              rejected:{label:'❌ Rejected — Reapply',color:'#ff4d6d',bg:'rgba(255,77,109,.08)',border:'rgba(255,77,109,.2)',action:true,desc:user?.verificationRequest?.rejectionNote||'Your request was rejected.'},
            }[vStatus];
            return(
              <div style={{background:cfg.bg,border:`1px solid ${cfg.border}`,borderRadius:14,padding:18,textAlign:'center'}}>
                <p style={{fontWeight:700,fontSize:13,color:cfg.color,marginBottom:6,fontFamily:'var(--font-head)'}}>{cfg.label}</p>
                <p style={{color:'var(--muted)',fontSize:12,marginBottom:cfg.action?14:0,lineHeight:1.5}}>{cfg.desc}</p>
                {cfg.action&&<Btn onClick={()=>setVerifyOpen(true)} full size="sm">Apply for Verification</Btn>}
              </div>
            );
          })()}

          {/* Host event card */}
          {isOrganizer&&(
            <div style={{background:'linear-gradient(135deg,rgba(108,71,255,.12),rgba(157,127,255,.06))',border:'1px solid rgba(108,71,255,.25)',borderRadius:14,padding:18,textAlign:'center'}}>
              <Icon d={ic.plus} size={22} color="#9d7fff"/>
              <p style={{fontWeight:700,marginBottom:4,marginTop:8,fontFamily:'var(--font-head)'}}>Host an Event</p>
              <p style={{color:'var(--muted)',fontSize:12,marginBottom:12}}>Create & publish to start selling tickets.</p>
              <Btn onClick={()=>setCreateOpen(true)} full size="sm"><Icon d={ic.plus} size={13}/>Create Event</Btn>
            </div>
          )}
        </div>

        {/* Right */}
        <div>
          {/* Tabs */}
          <div style={{display:'flex',gap:0,marginBottom:20,background:'var(--bg)',borderRadius:11,padding:3,width:'fit-content'}}>
            {TABS.map(([t,l])=>(
              <button key={t} onClick={()=>setTab(t)}
                style={{padding:'7px 18px',borderRadius:9,border:'none',background:tab===t?'#6c47ff':'transparent',color:tab===t?'#fff':'var(--muted)',fontWeight:600,fontSize:12,cursor:'pointer',fontFamily:'var(--font-body)',transition:'all .18s'}}>
                {l}
              </button>
            ))}
          </div>

          {/* BOOKINGS TAB */}
          {tab==='bookings'&&(
            <>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <p style={{fontWeight:700,fontSize:14,fontFamily:'var(--font-head)'}}>My Bookings</p>
                <Btn onClick={fetchBookings} variant="ghost" size="sm">↻ Refresh</Btn>
              </div>
              {loadingB?(
                <div style={{textAlign:'center',padding:40,color:'var(--muted)'}}>Loading…</div>
              ):bookings.length===0?(
                <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:16,padding:40,textAlign:'center',color:'var(--muted)'}}>
                  <Icon d={ic.ticket} size={34} color="var(--border)"/>
                  <p style={{marginTop:10}}>No bookings yet</p>
                  <Btn onClick={()=>onNav('events')} variant="outline" size="sm" style={{marginTop:14}}>Browse Events</Btn>
                </div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:11}}>
                  {bookings.map(b=>{
                    const ev=b.eventId;
                    const canCancel=['pending','confirmed'].includes(b.status);
                    const canResell=b.status==='confirmed';
                    return(
                      <div key={b._id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:14,padding:15}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:7}}>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontWeight:700,fontSize:14,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'var(--font-head)'}}>{ev?.title||'Event'}</p>
                            <p style={{color:'var(--muted)',fontSize:11}}>{b.bookingRef}</p>
                          </div>
                          <span style={{background:b.status==='confirmed'?'#00d68f22':b.status==='cancelled'?'#ff4d6d22':'#f0a50022',color:b.status==='confirmed'?'#00d68f':b.status==='cancelled'?'#ff4d6d':'#f0a500',fontSize:10,padding:'2px 9px',borderRadius:10,fontWeight:700,marginLeft:8,flexShrink:0}}>
                            {b.status}
                          </span>
                        </div>
                        <div style={{display:'flex',gap:12,marginBottom:9,fontSize:11,color:'var(--muted)'}}>
                          {ev?.startTime&&<span>{fmt(ev.startTime)}</span>}
                          {ev?.venueName&&<span>{ev.venueName}</span>}
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <div>
                            <span style={{fontSize:11,color:'var(--muted)'}}>{b.tierName} · {b.quantity} ticket(s)</span>
                            <p style={{color:'#f0a500',fontSize:15,fontWeight:800,fontFamily:'var(--font-head)'}}>₹{b.totalAmount?.toLocaleString()}</p>
                          </div>
                          <div style={{display:'flex',gap:7}}>
                            {canResell&&<Btn onClick={()=>{setResaleBooking(b);setResaleOpen(true);}} variant="outline" size="sm">🔁 Resell</Btn>}
                            {canCancel&&<Btn onClick={()=>cancel(b._id)} variant="danger" size="sm" disabled={cancellingId===b._id}>{cancellingId===b._id?'…':'Cancel'}</Btn>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* My resale listings */}
              {myListings.length>0&&(
                <div style={{marginTop:24}}>
                  <p style={{fontWeight:700,fontSize:14,marginBottom:14,fontFamily:'var(--font-head)'}}>My Resale Listings</p>
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    {myListings.map(l=>(
                      <div key={l._id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:14,padding:14}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.eventId?.title||'Event'}</p>
                            <p style={{color:'var(--muted)',fontSize:11,marginTop:2}}>{l.tierName} · {l.quantity} ticket(s)</p>
                          </div>
                          <span style={{background:l.status==='active'?'#00d68f22':l.status==='sold'?'#6c47ff22':'#ff4d6d22',color:l.status==='active'?'#00d68f':l.status==='sold'?'#9d7fff':'#ff4d6d',fontSize:10,padding:'2px 9px',borderRadius:10,fontWeight:700,marginLeft:8}}>{l.status}</span>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <p style={{fontSize:11,color:'var(--muted)'}}>Face ₹{l.originalPrice?.toLocaleString()} · Listed <span style={{color:'#f0a500',fontWeight:700}}>₹{l.resalePrice?.toLocaleString()}</span></p>
                          {l.status==='active'&&(
                            <Btn onClick={async()=>{
                              try{await API.post(`/resale/${l._id}/cancel`);toast('Listing cancelled','info');setMyListings(p=>p.map(x=>x._id===l._id?{...x,status:'cancelled'}:x));}
                              catch(e){toast(e.response?.data?.message||'Failed','error');}
                            }} variant="danger" size="sm">Cancel</Btn>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* VENUES TAB */}
          {tab==='venues'&&isOrganizer&&<VenueManager/>}

          {/* EVENTS TAB */}
          {tab==='events'&&isOrganizer&&(
            <>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <p style={{fontWeight:700,fontSize:14,fontFamily:'var(--font-head)'}}>My Events</p>
                <Btn onClick={fetchMyEvents} variant="ghost" size="sm">↻ Refresh</Btn>
              </div>
              {myEvents.length===0?(
                <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:16,padding:40,textAlign:'center',color:'var(--muted)'}}>
                  <Icon d={ic.ticket} size={34} color="var(--border)"/>
                  <p style={{marginTop:10}}>No events yet</p>
                  <Btn onClick={()=>setCreateOpen(true)} variant="outline" size="sm" style={{marginTop:14}}>Create First Event</Btn>
                </div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:11}}>
                  {myEvents.map(ev=>(
                    <div key={ev._id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:14,padding:15,display:'flex',gap:14,alignItems:'center'}}>
                      <div style={{width:46,height:46,borderRadius:10,background:ev.posterUrl?`url(${ev.posterUrl}) center/cover`:grad(ev._id),flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontWeight:700,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:'var(--font-head)'}}>{ev.title}</p>
                        <p style={{color:'var(--muted)',fontSize:11,marginTop:2}}>{ev.venueName} · {fmt(ev.startTime)}</p>
                        <div style={{display:'flex',gap:6,marginTop:5,flexWrap:'wrap'}}>
                          {ev.tiers?.map(t=>(
                            <span key={t.name} style={{fontSize:10,background:'rgba(108,71,255,.12)',color:'#9d7fff',padding:'1px 8px',borderRadius:8,fontWeight:600}}>
                              {t.name}: {t.remainingQuantity}/{t.totalQuantity}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span style={{background:ev.status==='published'?'#00d68f22':ev.status==='cancelled'?'#ff4d6d22':'#f0a50022',color:ev.status==='published'?'#00d68f':ev.status==='cancelled'?'#ff4d6d':'#f0a500',fontSize:10,padding:'3px 10px',borderRadius:10,fontWeight:700,flexShrink:0}}>
                        {ev.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <CreateEventModal open={createOpen} onClose={()=>setCreateOpen(false)} onCreated={()=>{setCreateOpen(false);fetchMyEvents();}} venues={venues}/>
      <VerificationModal open={verifyOpen} onClose={()=>setVerifyOpen(false)} onSubmitted={()=>window.location.reload()}/>
      <ResaleModal open={resaleOpen} onClose={()=>setResaleOpen(false)} booking={resaleBooking} onListed={fetchBookings}/>
    </div>
  );
}