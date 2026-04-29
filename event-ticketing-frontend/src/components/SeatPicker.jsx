import {useState,useEffect,useRef,useCallback} from 'react';
import API from '../api/axios';
import Btn from './ui/Btn';

const SC = {
  available:'#141422', locked:'#f0a500', booked:'#ff4d6d',
  mine:'#6c47ff', unavailable:'#0a0a12', hover:'#1e1e32',
};

function SeatBox({seat,isMyLock,onClick}){
  const[hov,setHov]=useState(false);
  const taken=seat.isLocked&&!isMyLock;
  const booked=seat.status==='booked';
  const unavail=seat.status==='unavailable';
  const canClick=!taken&&!booked&&!unavail;
  const bg=isMyLock?SC.mine:taken?SC.locked:booked?SC.booked:unavail?SC.unavailable:hov?SC.hover:SC.available;
  const border=isMyLock?'#9d7fff':taken?'#f0a50044':booked?'#ff4d6d44':'var(--border)';
  return(
    <div onMouseEnter={()=>canClick&&setHov(true)} onMouseLeave={()=>setHov(false)} onClick={()=>canClick&&onClick(seat)}
      title={`Row ${seat.rowLabel} · Seat ${seat.seatNumber} · ₹${seat.price}${taken?' (held)':''}`}
      style={{width:26,height:26,borderRadius:5,background:bg,border:`1.5px solid ${border}`,cursor:canClick?'pointer':'not-allowed',transition:'all .12s',display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,color:'rgba(255,255,255,.4)',fontWeight:700,transform:hov&&canClick?'scale(1.2)':'none',boxShadow:isMyLock?'0 0 8px #6c47ff88':'none'}}>
      {seat.seatNumber}
    </div>
  );
}

export default function SeatPicker({event,user,onSeatsSelected,onTotalChange}){
  const[seats,setSeats]=useState([]);
  const[selected,setSelected]=useState([]);
  const[activeSection,setActiveSection]=useState(null);
  const[loading,setLoading]=useState(true);
  const[wsConnected,setWsConnected]=useState(false);
  const socketRef=useRef(null);

  // Group seats: section → row → seats[]
  const grouped=seats.reduce((acc,s)=>{
    const sec=s.sectionName||'General';
    if(!acc[sec])acc[sec]={};
    if(!acc[sec][s.rowLabel])acc[sec][s.rowLabel]=[];
    acc[sec][s.rowLabel].push(s);
    acc[sec][s.rowLabel].sort((a,b)=>a.seatNumber-b.seatNumber);
    return acc;
  },{});

  const sections=Object.keys(grouped);
  const curSection=activeSection||sections[0];

  // Load seats via HTTP (fallback when no socket or demo event)
  const loadSeats=useCallback(async()=>{
    if(!event?._id||event._id.startsWith('d')){setLoading(false);return;}
    try{
      const r=await API.get(`/seats/event/${event._id}`);
      const s=r.data.seats||[];
      setSeats(s);
    }catch(_){}
    finally{setLoading(false);}
  },[event?._id]);

  // Try Socket.IO for real-time
  useEffect(()=>{
    if(!event?._id||event._id.startsWith('d')){loadSeats();return;}
    let socket=null;
    const token=localStorage.getItem('token');
    // Dynamic import to avoid crash if socket.io-client not installed
    import('socket.io-client').then(({io})=>{
      socket=io('http://localhost:5001',{auth:{token},timeout:3000});
      socketRef.current=socket;
      socket.on('connect',()=>{
        setWsConnected(true);
        socket.emit('event:join',event._id);
      });
      socket.on('seat:snapshot',snapshotSeats=>{
        setSeats(snapshotSeats);
        setLoading(false);
      });
      socket.on('seat:locked',({seatId,lockedBy})=>{
        setSeats(prev=>prev.map(s=>s._id===seatId?{...s,isLocked:true,lockedBy}:s));
      });
      socket.on('seat:unlocked',({seatId})=>{
        setSeats(prev=>prev.map(s=>s._id===seatId?{...s,isLocked:false,lockedBy:null}:s));
      });
      socket.on('seat:booked',({seatId})=>{
        setSeats(prev=>prev.map(s=>s._id===seatId?{...s,status:'booked',isLocked:false}:s));
        setSelected(prev=>prev.filter(id=>id!==seatId));
      });
      socket.on('connect_error',()=>{setWsConnected(false);loadSeats();});
    }).catch(()=>loadSeats());
    return()=>{
      if(socket){
        selected.forEach(seatId=>socket.emit('seat:unlock',{seatId,eventId:event._id}));
        socket.emit('event:leave',event._id);
        socket.disconnect();
      }
    };
  },[event?._id]);

  const toggleSeat=useCallback(seat=>{
    const seatId=seat._id;
    const isSel=selected.includes(seatId);
    if(isSel){
      if(socketRef.current&&wsConnected){
        socketRef.current.emit('seat:unlock',{seatId,eventId:event._id},res=>{
          if(res?.success){
            setSelected(p=>p.filter(id=>id!==seatId));
            setSeats(p=>p.map(s=>s._id===seatId?{...s,isLocked:false,lockedBy:null}:s));
          }
        });
      }else{
        setSelected(p=>p.filter(id=>id!==seatId));
      }
    }else{
      if(selected.length>=6){alert('Maximum 6 seats per booking');return;}
      if(socketRef.current&&wsConnected){
        socketRef.current.emit('seat:lock',{seatId,eventId:event._id},res=>{
          if(res?.success){
            setSelected(p=>[...p,seatId]);
            setSeats(p=>p.map(s=>s._id===seatId?{...s,isLocked:true,lockedBy:user?.id}:s));
          }else alert(res?.reason||'Could not hold seat');
        });
      }else{
        setSelected(p=>[...p,seatId]);
      }
    }
  },[selected,event?._id,wsConnected,user]);

  const selectedSeats=seats.filter(s=>selected.includes(s._id));
  const myTotal=selectedSeats.reduce((sum,s)=>sum+s.price,0);

  useEffect(()=>{onTotalChange?.(myTotal,selectedSeats);},[myTotal]);

  if(loading)return(
    <div style={{textAlign:'center',padding:'40px 0',color:'var(--muted)'}}>
      <p style={{fontSize:14}}>Loading seat map…</p>
    </div>
  );

  if(!seats.length&&!event._id.startsWith('d'))return(
    <div style={{textAlign:'center',padding:'40px 0',color:'var(--muted)'}}>
      <p>No seat map available for this event</p>
      <p style={{fontSize:12,marginTop:6}}>Use tier selection below</p>
    </div>
  );

  if(event._id.startsWith('d')||!seats.length)return null;

  return(
    <div>
      {/* Stage */}
      <div style={{background:'linear-gradient(135deg,rgba(108,71,255,.2),rgba(157,127,255,.1))',border:'1px solid rgba(108,71,255,.3)',borderRadius:8,padding:'7px 0',textAlign:'center',marginBottom:18,fontSize:11,fontWeight:800,color:'#9d7fff',letterSpacing:3}}>
        ▲ STAGE / SCREEN
      </div>

      {/* Section tabs */}
      {sections.length>1&&(
        <div style={{display:'flex',gap:7,marginBottom:14,flexWrap:'wrap'}}>
          {sections.map(sec=>(
            <button key={sec} onClick={()=>setActiveSection(sec)}
              style={{padding:'5px 14px',borderRadius:8,border:'1px solid',borderColor:curSection===sec?'#6c47ff':'var(--border)',background:curSection===sec?'rgba(108,71,255,.15)':'transparent',color:curSection===sec?'#9d7fff':'var(--muted)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'var(--font-body)'}}>
              {sec}
            </button>
          ))}
        </div>
      )}

      {/* Seat grid */}
      <div style={{maxHeight:300,overflowY:'auto',marginBottom:14,paddingRight:4}}>
        {Object.entries(grouped[curSection]||{}).map(([row,rowSeats])=>(
          <div key={row} style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
            <span style={{width:18,fontSize:10,color:'var(--muted)',fontWeight:700,flexShrink:0,textAlign:'right'}}>{row}</span>
            <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
              {rowSeats.map(seat=>(
                <SeatBox key={seat._id} seat={seat} isMyLock={selected.includes(seat._id)} onClick={toggleSeat}/>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{display:'flex',gap:14,marginBottom:14,flexWrap:'wrap'}}>
        {[['Available',SC.available,'var(--border)'],['Selected',SC.mine,'#9d7fff'],['Held',SC.locked,'#f0a50044'],['Booked',SC.booked,'#ff4d6d44']].map(([l,bg,b])=>(
          <div key={l} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--muted)'}}>
            <div style={{width:13,height:13,borderRadius:3,background:bg,border:`1px solid ${b}`}}/>
            {l}
          </div>
        ))}
        {wsConnected&&<span style={{fontSize:10,color:'#00d68f',marginLeft:'auto'}}>🟢 Live</span>}
      </div>

      {/* Selection summary */}
      {selected.length>0&&(
        <div style={{background:'var(--bg)',borderRadius:12,padding:'12px 16px',border:'1px solid rgba(108,71,255,.3)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <p style={{fontSize:12,color:'var(--muted)',marginBottom:2}}>{selected.length} seat(s) · held 10 min</p>
            <p style={{fontSize:19,fontWeight:800,color:'#f0a500',fontFamily:'var(--font-head)'}}>₹{myTotal.toLocaleString()}</p>
          </div>
          <Btn onClick={()=>onSeatsSelected?.(selectedSeats)} variant="gold" size="lg">Proceed to Pay →</Btn>
        </div>
      )}
    </div>
  );
}