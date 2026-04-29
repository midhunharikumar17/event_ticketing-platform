import {useState,useEffect} from 'react';
import Modal from './ui/Modal';
import Btn from './ui/Btn';
import Icon from './ui/Icon';
import {toast} from './ui/Toast';
import API from '../api/axios';
import {ic} from '../constants/data';
import {fmt,fmtT,grad} from '../utils/helpers';
import SeatPicker from './SeatPicker';

const RAZORPAY_KEY=import.meta.env.VITE_RAZORPAY_KEY_ID||'rzp_test_xxxx';

function openRazorpay({orderId,amount,bookingRef,userName,userEmail,onSuccess,onFailure}){
  const opts={
    key:RAZORPAY_KEY,amount,currency:'INR',name:'TicketVerse',
    description:`Booking ${bookingRef}`,order_id:orderId,
    prefill:{name:userName,email:userEmail},
    theme:{color:'#6c47ff'},
    modal:{ondismiss:()=>onFailure?.('Payment cancelled')},
    handler:async r=>onSuccess?.(r),
  };
  const rzp=new window.Razorpay(opts);
  rzp.on('payment.failed',r=>onFailure?.(r.error?.description||'Payment failed'));
  rzp.open();
}

export default function EventDetailModal({event,open,onClose,user,onLoginNeeded,onBooked}){
  const[mode,setMode]=useState('tiers');  // 'tiers' | 'seats' | 'resale'
  const[selTier,setSelTier]=useState(null);
  const[qty,setQty]=useState(1);
  const[selSeats,setSelSeats]=useState([]);
  const[seatTotal,setSeatTotal]=useState(0);
  const[booking,setBooking]=useState(null);
  const[loading,setLoading]=useState(false);
  const[payStep,setPayStep]=useState('select');
  const[listings,setListings]=useState([]);
  const[buyingId,setBuyingId]=useState(null);
  const[hasSeatMap,setHasSeatMap]=useState(false);

  useEffect(()=>{
    if(event?.tiers?.length){setSelTier(event.tiers[0]);setQty(1);setBooking(null);setPayStep('select');setMode('tiers');setSelSeats([]);}
  },[event]);

  useEffect(()=>{
    if(open&&event?._id&&!event._id.startsWith('d')){
      API.get(`/resale/event/${event._id}`).then(r=>setListings(r.data.listings||[])).catch(()=>setListings([]));
      // Check if seat map exists
      API.get(`/seats/event/${event._id}`).then(r=>{if((r.data.seats||[]).length>0)setHasSeatMap(true);}).catch(()=>{});
    }
  },[open,event]);

  if(!event)return null;
  const tier=selTier||event.tiers?.[0];
  const tierTotal=(tier?.price||0)*qty;
  const totalRemaining=event.tiers?.reduce((s,t)=>s+(t.remainingQuantity??0),0)??null;
  const isSoldOut=totalRemaining===0;
  const isDummy=event._id.startsWith('d');

  const pay=async(bookingPayload,tierName,quantity,totalAmount)=>{
    if(isDummy){toast('Demo event — create a real event to test payments','info');return;}
    setLoading(true);setPayStep('paying');
    let created=null;
    try{
      const br=await API.post('/bookings',bookingPayload);
      created=br.data.booking;
      const or=await API.post('/payments/create-order',{bookingId:created._id});
      const{razorpayOrderId,payment}=or.data;
      openRazorpay({
        orderId:razorpayOrderId,amount:payment.amount,
        bookingRef:created.bookingRef,
        userName:user?.displayName||user?.name||'',
        userEmail:user?.email||'',
        onSuccess:async rp=>{
          try{await API.post('/payments/verify',{razorpay_order_id:rp.razorpay_order_id,razorpay_payment_id:rp.razorpay_payment_id,razorpay_signature:rp.razorpay_signature,bookingId:created._id});}
          catch(_){}
          setBooking({...created,status:'confirmed',razorpayPaymentId:rp.razorpay_payment_id,tierName,quantity,totalAmount});
          setPayStep('success');
          onBooked?.();
          toast('Payment successful! 🎉');
          setLoading(false);
        },
        onFailure:async reason=>{
          try{await API.post(`/bookings/${created._id}/cancel`);}catch(_){}
          toast(reason||'Payment failed','error');
          setPayStep('select');setLoading(false);
        },
      });
    }catch(e){
      if(created){try{await API.post(`/bookings/${created._id}/cancel`);}catch(_){}}
      toast(e.response?.data?.message||'Something went wrong','error');
      setPayStep('select');setLoading(false);
    }
  };

  const handleTierBook=()=>{
    if(!user){onLoginNeeded();return;}
    pay({eventId:event._id,tierName:tier.name,quantity:qty},tier.name,qty,tierTotal);
  };

  const handleSeatBook=()=>{
    if(!user){onLoginNeeded();return;}
    if(!selSeats.length){toast('Select at least one seat','error');return;}
    const tierName=selSeats[0]?.tierName||tier?.name||'General';
    pay({eventId:event._id,tierName,quantity:selSeats.length,seatIds:selSeats.map(s=>s._id)},tierName,selSeats.length,seatTotal);
  };

  const buyResale=async l=>{
    if(!user){onLoginNeeded();return;}
    setBuyingId(l._id);
    try{
      const r=await API.post(`/resale/${l._id}/buy`);
      setBooking({...r.data.booking,status:'confirmed'});
      setPayStep('success');
      setListings(p=>p.filter(x=>x._id!==l._id));
      onBooked?.();
      toast('Resale ticket purchased! 🎉');
    }catch(e){toast(e.response?.data?.message||'Purchase failed','error');}
    finally{setBuyingId(null);}
  };

  const handleClose=()=>{
    if(payStep==='paying')return;
    onClose();setBooking(null);setPayStep('select');
  };

  return(
    <Modal open={open} onClose={handleClose} title="" width={600}>

      {/* SUCCESS */}
      {payStep==='success'&&booking&&(
        <div style={{textAlign:'center',padding:'8px 0'}}>
          <div style={{width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#00d68f,#3b82f6)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 0 30px #00d68f44'}}>
            <Icon d={ic.check} size={28} color="#fff"/>
          </div>
          <h3 style={{fontSize:22,fontWeight:800,marginBottom:6,fontFamily:'var(--font-head)'}}>Payment Successful!</h3>
          <p style={{color:'var(--muted)',marginBottom:22,fontSize:14}}>Your booking is confirmed.</p>
          <div style={{background:'var(--bg)',borderRadius:14,padding:20,textAlign:'left'}}>
            <p style={{fontSize:10,color:'var(--muted)',letterSpacing:1,marginBottom:4}}>BOOKING REFERENCE</p>
            <p style={{fontWeight:800,fontSize:20,letterSpacing:3,color:'#9d7fff',marginBottom:16,fontFamily:'var(--font-head)'}}>{booking.bookingRef}</p>
            {[['Event',event.title],['Venue',event.venueName],['Date',`${fmt(event.startTime)} · ${fmtT(event.startTime)}`],['Tier',booking.tierName],['Qty',`${booking.quantity} ticket(s)`]].map(([l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:9,paddingBottom:9,borderBottom:'1px solid var(--border)'}}>
                <span style={{color:'var(--muted)'}}>{l}</span><span style={{fontWeight:600}}>{v}</span>
              </div>
            ))}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:4}}>
              <span style={{fontWeight:700,fontSize:14}}>Amount Paid</span>
              <span style={{fontWeight:900,color:'#f0a500',fontSize:22,fontFamily:'var(--font-head)'}}>₹{booking.totalAmount?.toLocaleString()}</span>
            </div>
            {booking.razorpayPaymentId&&<p style={{fontSize:10,color:'var(--muted)',marginTop:10}}>Payment ID: {booking.razorpayPaymentId}</p>}
          </div>
          <Btn onClick={handleClose} full style={{marginTop:20}} size="lg">Done</Btn>
        </div>
      )}

      {/* BOOKING FLOW */}
      {payStep!=='success'&&(
        <>
          {/* Banner */}
          <div style={{height:185,borderRadius:13,marginBottom:16,background:event.posterUrl?`url(${event.posterUrl}) center/cover`:grad(event._id),display:'flex',alignItems:'flex-end',padding:18,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(7,7,14,.9),transparent)'}}/>
            <div style={{position:'relative',zIndex:1}}>
              <span style={{background:'rgba(0,0,0,.6)',color:'#f0a500',fontSize:11,padding:'2px 9px',borderRadius:20,display:'inline-block',marginBottom:7}}>{event.category}</span>
              <h2 style={{fontSize:20,fontWeight:800,fontFamily:'var(--font-head)'}}>{event.title}</h2>
            </div>
            {totalRemaining!==null&&(
              <div style={{position:'absolute',top:14,right:14,background:isSoldOut?'rgba(255,77,109,.9)':totalRemaining<20?'rgba(240,165,0,.9)':'rgba(0,214,143,.9)',borderRadius:10,padding:'5px 12px'}}>
                <p style={{fontSize:11,fontWeight:800,color:isSoldOut?'#fff':'#07070e'}}>{isSoldOut?'🔴 SOLD OUT':totalRemaining<20?`🟡 ${totalRemaining} LEFT`:`🟢 ${totalRemaining} LEFT`}</p>
              </div>
            )}
          </div>

          {/* Meta */}
          <div style={{display:'flex',gap:16,marginBottom:16,flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:7,color:'var(--muted)',fontSize:12}}><Icon d={ic.cal} size={14}/>{fmt(event.startTime)}, {fmtT(event.startTime)}</div>
            <div style={{display:'flex',alignItems:'center',gap:7,color:'var(--muted)',fontSize:12}}><Icon d={ic.map} size={14}/>{event.venueName}</div>
          </div>

          {/* Mode tabs */}
          <div style={{display:'flex',background:'var(--bg)',borderRadius:10,padding:3,marginBottom:18,gap:2}}>
            {[['tiers','By Tier'],hasSeatMap&&['seats','Pick Seats'],['resale',`Resale (${listings.length})`]].filter(Boolean).map(([t,l])=>(
              <button key={t} onClick={()=>setMode(t)}
                style={{flex:1,padding:'8px 0',borderRadius:8,border:'none',background:mode===t?'#6c47ff':'transparent',color:mode===t?'#fff':'var(--muted)',fontWeight:600,fontSize:12,cursor:'pointer',fontFamily:'var(--font-body)',transition:'all .18s'}}>
                {l}
              </button>
            ))}
          </div>

          {/* TIER MODE */}
          {mode==='tiers'&&(
            <>
              <p style={{fontSize:10,fontWeight:700,color:'var(--muted)',marginBottom:9,letterSpacing:1}}>SELECT TIER</p>
              <div style={{display:'flex',gap:9,flexWrap:'wrap',marginBottom:18}}>
                {event.tiers?.map(t=>{
                  const rem=t.remainingQuantity??t.totalQuantity;
                  const sold=rem===0;
                  return(
                    <div key={t.name} onClick={()=>!sold&&setSelTier(t)}
                      style={{padding:'10px 16px',borderRadius:11,border:'1.5px solid',borderColor:sold?'var(--border)':selTier?.name===t.name?'#6c47ff':'var(--border)',background:sold?'rgba(0,0,0,.2)':selTier?.name===t.name?'rgba(108,71,255,.15)':'transparent',cursor:sold?'not-allowed':'pointer',opacity:sold?.6:1,transition:'all .18s'}}>
                      <p style={{fontWeight:700,fontSize:13,color:selTier?.name===t.name?'#9d7fff':'var(--text)'}}>{t.name}</p>
                      <p style={{fontSize:12,color:'#f0a500',fontWeight:600}}>₹{t.price.toLocaleString()}</p>
                      <p style={{fontSize:10,color:sold?'#ff4d6d':rem<10?'#f0a500':'var(--muted)',marginTop:3}}>{sold?'Sold out':`${rem} left`}</p>
                    </div>
                  );
                })}
              </div>
              <p style={{fontSize:10,fontWeight:700,color:'var(--muted)',marginBottom:9,letterSpacing:1}}>QUANTITY</p>
              <div style={{display:'flex',gap:8,marginBottom:18}}>
                {[1,2,3,4,5,6].map(n=>{
                  const rem=selTier?.remainingQuantity??99;
                  return(
                    <button key={n} onClick={()=>n<=rem&&setQty(n)} disabled={n>rem}
                      style={{width:36,height:36,borderRadius:8,border:'1.5px solid',borderColor:qty===n?'#6c47ff':'var(--border)',background:qty===n?'rgba(108,71,255,.15)':'transparent',color:n>rem?'var(--border)':qty===n?'#9d7fff':'var(--text)',fontWeight:700,cursor:n>rem?'not-allowed':'pointer',fontFamily:'var(--font-body)'}}>
                      {n}
                    </button>
                  );
                })}
              </div>
              <div style={{background:'var(--bg)',borderRadius:12,padding:'13px 16px',marginBottom:13}}>
                {[
                  [`${qty} × ${tier?.name}`,`₹${(tier?.price||0).toLocaleString()} each`],
                  ['Convenience fee','₹0'],
                ].map(([l,v])=>(
                  <div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:8,color:'var(--muted)'}}><span>{l}</span><span>{v}</span></div>
                ))}
                <div style={{borderTop:'1px solid var(--border)',paddingTop:10,marginTop:4,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontWeight:700}}>Total</span>
                  <span style={{fontWeight:900,color:'#f0a500',fontSize:22,fontFamily:'var(--font-head)'}}>₹{tierTotal.toLocaleString()}</span>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:13,color:'var(--muted)',fontSize:11}}>
                <span>🔒 Secured by</span><span style={{fontWeight:700,color:'#528FF0'}}>Razorpay</span>
              </div>
              <Btn onClick={handleTierBook} variant="gold" full size="lg" disabled={loading||isSoldOut||payStep==='paying'}>
                {payStep==='paying'?'⏳ Processing…':isSoldOut?'Sold Out':`Pay ₹${tierTotal.toLocaleString()} →`}
              </Btn>
              {isDummy&&<p style={{textAlign:'center',color:'var(--muted)',fontSize:11,marginTop:9}}>Demo event — payments unavailable</p>}
            </>
          )}

          {/* SEAT MODE */}
          {mode==='seats'&&(
            <>
              <SeatPicker
                event={event} user={user}
                onSeatsSelected={seats=>{setSelSeats(seats);}}
                onTotalChange={(total,seats)=>{setSeatTotal(total);setSelSeats(seats);}}
              />
              {selSeats.length>0&&(
                <Btn onClick={handleSeatBook} variant="gold" full size="lg" disabled={loading||payStep==='paying'} style={{marginTop:14}}>
                  {payStep==='paying'?'⏳ Processing…':`Pay ₹${seatTotal.toLocaleString()} for ${selSeats.length} seat(s) →`}
                </Btn>
              )}
            </>
          )}

          {/* RESALE MODE */}
          {mode==='resale'&&(
            <div>
              {listings.length===0?(
                <div style={{textAlign:'center',padding:'30px 0',color:'var(--muted)'}}>
                  <p style={{fontSize:15}}>No resale listings yet</p>
                  <p style={{fontSize:12,marginTop:6}}>Check back later</p>
                </div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {listings.map(l=>(
                    <div key={l._id} style={{background:'var(--bg)',borderRadius:12,padding:14,display:'flex',alignItems:'center',justifyContent:'space-between',border:'1px solid var(--border)'}}>
                      <div>
                        <p style={{fontWeight:600,fontSize:13}}>{l.tierName} · {l.quantity} ticket(s)</p>
                        <p style={{color:'var(--muted)',fontSize:11,marginTop:3}}>Seller: {l.sellerId?.displayName||'Anonymous'}</p>
                        <p style={{color:'var(--muted)',fontSize:11}}>Face value: ₹{l.originalPrice?.toLocaleString()}</p>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <p style={{fontWeight:800,fontSize:17,color:'#f0a500'}}>₹{l.resalePrice?.toLocaleString()}</p>
                        <p style={{fontSize:10,color:'var(--muted)',marginBottom:8}}>per ticket</p>
                        <Btn onClick={()=>buyResale(l)} size="sm" variant="gold" disabled={buyingId===l._id}>{buyingId===l._id?'Buying…':'Buy'}</Btn>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}