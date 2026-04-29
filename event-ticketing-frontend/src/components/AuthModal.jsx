import {useState,useEffect} from 'react';
import Modal from './ui/Modal';
import Btn from './ui/Btn';
import Field from './ui/Field';
import {toast} from './ui/Toast';
import API from '../api/axios';
import {uname} from '../utils/helpers';

export default function AuthModal({open,onClose,onAuth}){
  const[tab,setTab]=useState('login');
  const[form,setForm]=useState({name:'',email:'',password:''});
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState('');
  useEffect(()=>{if(open){setErr('');setForm({name:'',email:'',password:''}); }},[open]);
  const s=(k,v)=>setForm(p=>({...p,[k]:v}));
  const submit=async()=>{
    setErr('');
    if(!form.email||!form.password){setErr('Email and password required');return;}
    if(tab==='register'&&form.name.trim().length<2){setErr('Name must be at least 2 characters');return;}
    if(form.password.length<6){setErr('Password must be at least 6 characters');return;}
    setLoading(true);
    try{
      const url=tab==='login'?'/auth/login':'/auth/register';
      const payload=tab==='login'?{email:form.email.trim(),password:form.password}:{name:form.name.trim(),email:form.email.trim(),password:form.password};
      const res=await API.post(url,payload);
      localStorage.setItem('token',res.data.token);
      onAuth(res.data.user);
      onClose();
      toast(`Welcome${tab==='register'?' aboard':' back'}, ${uname(res.data.user)}! 🎉`);
    }catch(e){
      setErr(e.response?.data?.message||e.response?.data?.error?.message||'Something went wrong');
    }finally{setLoading(false);}
  };
  return(
    <Modal open={open} onClose={onClose} title={tab==='login'?'Sign In':'Create Account'}>
      <div style={{display:'flex',background:'var(--bg)',borderRadius:10,padding:4,marginBottom:22}}>
        {['login','register'].map(t=>(
          <button key={t} onClick={()=>{setTab(t);setErr('');}}
            style={{flex:1,padding:'9px 0',borderRadius:8,border:'none',background:tab===t?'#6c47ff':'transparent',color:tab===t?'#fff':'var(--muted)',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'var(--font-body)',transition:'all .18s'}}>
            {t==='login'?'Login':'Register'}
          </button>
        ))}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:13}}>
        {tab==='register'&&<Field label="Full Name"><input placeholder="John Doe" value={form.name} onChange={e=>s('name',e.target.value)}/></Field>}
        <Field label="Email"><input type="email" placeholder="john@example.com" value={form.email} onChange={e=>s('email',e.target.value)}/></Field>
        <Field label="Password"><input type="password" placeholder="Min 6 characters" value={form.password} onChange={e=>s('password',e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}/></Field>
        {err&&<div style={{background:'rgba(255,77,109,.1)',border:'1px solid rgba(255,77,109,.3)',borderRadius:8,padding:'9px 13px',color:'#ff4d6d',fontSize:13}}>{err}</div>}
        <Btn onClick={submit} full disabled={loading} size="lg" style={{marginTop:4}}>{loading?'Please wait…':tab==='login'?'Login':'Create Account'}</Btn>
      </div>
    </Modal>
  );
}