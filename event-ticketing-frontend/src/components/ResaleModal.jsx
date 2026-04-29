import {useState,useEffect} from 'react';
import Modal from './ui/Modal';
import Btn from './ui/Btn';
import Field from './ui/Field';
import {toast} from './ui/Toast';
import API from '../api/axios';

export default function ResaleModal({open,onClose,booking,onListed}){
  const[price,setPrice]=useState('');
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState('');
  useEffect(()=>{if(open){setPrice('');setErr('');}},[open]);
  if(!booking)return null;
  const orig=booking.totalAmount/booking.quantity;
  const maxP=Math.floor(orig*1.2);
  const submit=async()=>{
    setErr('');
    const p=Number(price);
    if(!p||p<=0){setErr('Enter a valid price');return;}
    if(p>maxP){setErr(`Max ₹${maxP.toLocaleString()} (20% above face value)`);return;}
    setLoading(true);
    try{
      await API.post('/resale',{bookingId:booking._id,resalePrice:p});
      toast('Ticket listed for resale! 🎟️');
      onListed?.();onClose();
    }catch(e){setErr(e.response?.data?.message||'Failed');}
    finally{setLoading(false);}
  };
  return(
    <Modal open={open} onClose={onClose} title="List Ticket for Resale" width={420}>
      <div style={{background:'var(--bg)',borderRadius:12,padding:16,marginBottom:18}}>
        <p style={{fontWeight:700,fontSize:14,marginBottom:4}}>{booking.eventId?.title||'Event'}</p>
        <p style={{color:'var(--muted)',fontSize:12,marginBottom:10}}>{booking.tierName} · {booking.quantity} ticket(s)</p>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span style={{color:'var(--muted)'}}>Face value</span><span style={{fontWeight:600}}>₹{orig.toLocaleString()} / ticket</span></div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginTop:6}}><span style={{color:'var(--muted)'}}>Max resale</span><span style={{fontWeight:600,color:'#f0a500'}}>₹{maxP.toLocaleString()} / ticket</span></div>
      </div>
      <Field label="Your Price (₹ per ticket) *" hint={`Up to ₹${maxP.toLocaleString()}`}>
        <input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder={`Max ₹${maxP}`}/>
      </Field>
      {price&&Number(price)>0&&<p style={{color:'var(--muted)',fontSize:12,marginTop:8}}>Total listing: <b style={{color:'#f0a500'}}>₹{(Number(price)*booking.quantity).toLocaleString()}</b></p>}
      {err&&<div style={{background:'rgba(255,77,109,.1)',border:'1px solid rgba(255,77,109,.3)',borderRadius:8,padding:'9px 13px',color:'#ff4d6d',fontSize:13,marginTop:12}}>{err}</div>}
      <div style={{display:'flex',gap:10,marginTop:18}}>
        <Btn onClick={onClose} variant="outline" full>Cancel</Btn>
        <Btn onClick={submit} variant="gold" full disabled={loading}>{loading?'Listing…':'List for Resale'}</Btn>
      </div>
    </Modal>
  );
}