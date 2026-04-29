import {useState} from 'react';
import Modal from './ui/Modal';
import Btn from './ui/Btn';
import Field from './ui/Field';
import {toast} from './ui/Toast';
import API from '../api/axios';

export default function VerificationModal({open,onClose,onSubmitted}){
  const blank={fullName:'',aadharName:'',aadharNumber:'',panNumber:'',bankName:'',accountNumber:'',ifscCode:'',address:''};
  const[form,setForm]=useState(blank);
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState('');
  const s=(k,v)=>setForm(p=>({...p,[k]:v}));
  const submit=async()=>{
    setErr('');
    const req=['fullName','aadharName','aadharNumber','bankName','accountNumber','ifscCode'];
    if(req.find(k=>!form[k].trim())){setErr('Please fill all required fields');return;}
    if(form.aadharNumber.replace(/\s/g,'').length!==12){setErr('Aadhaar must be 12 digits');return;}
    setLoading(true);
    try{
      await API.post('/users/me/verify',form);
      toast('Verification submitted! Admin will review soon.');
      onSubmitted?.();onClose();
    }catch(e){setErr(e.response?.data?.message||'Failed');}
    finally{setLoading(false);}
  };
  const Section=({label})=>(
    <div style={{background:'rgba(108,71,255,.08)',border:'1px solid rgba(108,71,255,.2)',borderRadius:8,padding:'8px 14px',marginTop:4}}>
      <p style={{fontWeight:700,fontSize:11,color:'#9d7fff',letterSpacing:.5}}>{label}</p>
    </div>
  );
  return(
    <Modal open={open} onClose={onClose} title="Apply for Organizer Verification" width={540}>
      <p style={{color:'var(--muted)',fontSize:13,marginBottom:18,lineHeight:1.6}}>Once approved by admin, your account upgrades to <b style={{color:'#9d7fff'}}>Organizer</b> and you can host events.</p>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <Section label="PERSONAL DETAILS"/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:11}}>
          <Field label="Full Legal Name *"><input value={form.fullName} onChange={e=>s('fullName',e.target.value)} placeholder="As on government ID"/></Field>
          <Field label="PAN Number"><input value={form.panNumber} onChange={e=>s('panNumber',e.target.value.toUpperCase())} placeholder="ABCDE1234F"/></Field>
        </div>
        <Field label="Address *"><textarea value={form.address} onChange={e=>s('address',e.target.value)} rows={2} style={{resize:'vertical'}}/></Field>
        <Section label="AADHAAR DETAILS"/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:11}}>
          <Field label="Name on Aadhaar *"><input value={form.aadharName} onChange={e=>s('aadharName',e.target.value)}/></Field>
          <Field label="Aadhaar Number *"><input value={form.aadharNumber} onChange={e=>s('aadharNumber',e.target.value)} placeholder="XXXX XXXX XXXX" maxLength={14}/></Field>
        </div>
        <Section label="BANK DETAILS"/>
        <Field label="Bank Name *"><input value={form.bankName} onChange={e=>s('bankName',e.target.value)}/></Field>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:11}}>
          <Field label="Account Number *"><input value={form.accountNumber} onChange={e=>s('accountNumber',e.target.value)}/></Field>
          <Field label="IFSC Code *"><input value={form.ifscCode} onChange={e=>s('ifscCode',e.target.value.toUpperCase())} placeholder="SBIN0001234"/></Field>
        </div>
        {err&&<div style={{background:'rgba(255,77,109,.1)',border:'1px solid rgba(255,77,109,.3)',borderRadius:8,padding:'9px 13px',color:'#ff4d6d',fontSize:13}}>{err}</div>}
        <div style={{display:'flex',gap:10,marginTop:4}}>
          <Btn onClick={onClose} variant="outline" full>Cancel</Btn>
          <Btn onClick={submit} full disabled={loading}>{loading?'Submitting…':'Submit for Verification'}</Btn>
        </div>
      </div>
    </Modal>
  );
}