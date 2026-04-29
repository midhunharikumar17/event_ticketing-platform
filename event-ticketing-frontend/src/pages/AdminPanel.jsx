import {useState,useEffect,useCallback} from 'react';
import Btn from '../components/ui/Btn';
import Icon from '../components/ui/Icon';
import {toast} from '../components/ui/Toast';
import API from '../api/axios';
import {ic} from '../constants/data';
import {fmt,grad} from '../utils/helpers';

export default function AdminPanel(){
  const[tab,setTab]=useState('verifications');
  const[data,setData]=useState([]);
  const[loading,setLoading]=useState(false);
  const[reviewNote,setReviewNote]=useState({});

  const load=useCallback(async t=>{
    setLoading(true);
    try{
      const map={verifications:['/users/verifications/pending','data'],users:['/users','users'],events:['/events/admin/all','events'],bookings:['/bookings/all','bookings']};
      const[url,key]=map[t];
      const r=await API.get(url);
      setData(r.data[key]||[]);
    }catch(e){toast(e.response?.data?.message||'Failed','error');}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{load(tab);},[tab]);

  const review=async(uid,action)=>{
    try{await API.post(`/users/${uid}/review-verification`,{action,rejectionNote:reviewNote[uid]||''});toast(action==='approve'?'Approved ✅':'Rejected');load('verifications');}
    catch(e){toast(e.response?.data?.message||'Failed','error');}
  };
  const deactivate=async id=>{
    if(!window.confirm('Remove user?'))return;
    try{await API.delete(`/users/${id}`);toast('User removed');load('users');}
    catch(e){toast(e.response?.data?.message||'Failed','error');}
  };
  const cancelEv=async id=>{
    if(!window.confirm('Cancel event?'))return;
    try{await API.post(`/events/${id}/cancel`);toast('Event cancelled','info');load('events');}
    catch(e){toast(e.response?.data?.message||'Failed','error');}
  };

  return(
    <div style={{maxWidth:1100,margin:'0 auto',padding:'38px 24px'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:28}}>
        <Icon d={ic.shield} size={26} color="#ff4d6d"/>
        <h1 style={{fontSize:26,fontWeight:800,fontFamily:'var(--font-head)'}}>Admin Panel</h1>
      </div>
      <div style={{display:'flex',gap:0,marginBottom:24,background:'var(--surface)',borderRadius:12,padding:4,width:'fit-content'}}>
        {[['verifications','Verifications'],['users','Users'],['events','Events'],['bookings','Bookings']].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{padding:'8px 18px',borderRadius:9,border:'none',background:tab===t?(t==='verifications'?'#f0a500':'#6c47ff'):'transparent',color:tab===t?'#fff':'var(--muted)',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'var(--font-body)',transition:'all .18s'}}>
            {l}
          </button>
        ))}
      </div>
      {loading&&<div style={{textAlign:'center',padding:40,color:'var(--muted)'}}>Loading…</div>}
      {!loading&&(
        <div style={{display:'flex',flexDirection:'column',gap:13}}>
          {data.length===0&&<p style={{color:'var(--muted)'}}>Nothing found.</p>}
          {tab==='verifications'&&data.map(u=>(
            <div key={u._id} style={{background:'var(--card)',border:'1px solid rgba(240,165,0,.3)',borderRadius:14,padding:20}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
                <div>
                  <p style={{fontWeight:700,fontSize:15,fontFamily:'var(--font-head)'}}>{u.displayName}</p>
                  <p style={{color:'var(--muted)',fontSize:12}}>{u.email}</p>
                  <p style={{color:'#f0a500',fontSize:11,marginTop:3}}>Submitted {fmt(u.verificationRequest?.submittedAt)}</p>
                </div>
                <span style={{background:'#f0a50022',color:'#f0a500',fontSize:11,padding:'3px 12px',borderRadius:10,fontWeight:700}}>PENDING</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:9,marginBottom:14}}>
                {[['Full Name',u.verificationRequest?.fullName],['Aadhaar Name',u.verificationRequest?.aadharName],['Aadhaar No.',u.verificationRequest?.aadharNumber],['PAN',u.verificationRequest?.panNumber],['Bank',u.verificationRequest?.bankName],['Account',u.verificationRequest?.accountNumber],['IFSC',u.verificationRequest?.ifscCode],['Address',u.verificationRequest?.address]].map(([l,v])=>v?(
                  <div key={l} style={{background:'var(--bg)',borderRadius:8,padding:'7px 11px'}}>
                    <p style={{fontSize:10,color:'var(--muted)',marginBottom:2}}>{l}</p>
                    <p style={{fontSize:13,fontWeight:600}}>{v}</p>
                  </div>
                ):null)}
              </div>
              <div style={{marginBottom:11}}>
                <input value={reviewNote[u._id]||''} onChange={e=>setReviewNote(p=>({...p,[u._id]:e.target.value}))} placeholder="Rejection reason (optional)…"/>
              </div>
              <div style={{display:'flex',gap:9}}>
                <Btn onClick={()=>review(u._id,'approve')} variant="success" size="sm">✅ Approve as Organizer</Btn>
                <Btn onClick={()=>review(u._id,'reject')} variant="danger" size="sm">❌ Reject</Btn>
              </div>
            </div>
          ))}
          {tab==='users'&&data.map(u=>(
            <div key={u._id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:'13px 17px',display:'flex',alignItems:'center',gap:13}}>
              <div style={{width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg,#6c47ff,#9d7fff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff',flexShrink:0}}>{(u.displayName||'?')[0]?.toUpperCase()}</div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontWeight:600,fontSize:14}}>{u.displayName}</p>
                <p style={{color:'var(--muted)',fontSize:12}}>{u.email}</p>
              </div>
              <span style={{background:u.role==='admin'?'#ff4d6d22':u.role==='organizer'?'#f0a50022':'#6c47ff22',color:u.role==='admin'?'#ff4d6d':u.role==='organizer'?'#f0a500':'#9d7fff',fontSize:10,padding:'2px 9px',borderRadius:10,fontWeight:700}}>{u.role}</span>
              <p style={{color:'var(--muted)',fontSize:11}}>{fmt(u.createdAt)}</p>
              {u.role!=='admin'&&<Btn onClick={()=>deactivate(u._id)} variant="danger" size="sm"><Icon d={ic.trash} size={13}/></Btn>}
            </div>
          ))}
          {tab==='events'&&data.map(ev=>(
            <div key={ev._id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:'13px 17px',display:'flex',alignItems:'center',gap:13}}>
              <div style={{width:44,height:44,borderRadius:9,background:grad(ev._id),flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ev.title}</p>
                <p style={{color:'var(--muted)',fontSize:11}}>{ev.venueName} · {fmt(ev.startTime)} · by {ev.organizerId?.displayName||'?'}</p>
              </div>
              <span style={{background:ev.status==='published'?'#00d68f22':'#ff4d6d22',color:ev.status==='published'?'#00d68f':'#ff4d6d',fontSize:10,padding:'2px 9px',borderRadius:10,fontWeight:700}}>{ev.status}</span>
              {ev.status!=='cancelled'&&<Btn onClick={()=>cancelEv(ev._id)} variant="danger" size="sm">Cancel</Btn>}
            </div>
          ))}
          {tab==='bookings'&&data.map(b=>(
            <div key={b._id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:12,padding:'13px 17px',display:'flex',alignItems:'center',gap:13}}>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.eventId?.title||'—'}</p>
                <p style={{color:'var(--muted)',fontSize:11}}>{b.bookingRef} · {b.userId?.displayName||'?'} · {b.tierName} · {b.quantity}×</p>
              </div>
              <span style={{background:b.status==='confirmed'?'#00d68f22':'#ff4d6d22',color:b.status==='confirmed'?'#00d68f':'#ff4d6d',fontSize:10,padding:'2px 9px',borderRadius:10,fontWeight:700}}>{b.status}</span>
              <p style={{color:'#f0a500',fontWeight:800,fontSize:14,fontFamily:'var(--font-head)'}}>₹{b.totalAmount?.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}