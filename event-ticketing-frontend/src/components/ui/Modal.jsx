import Icon from './Icon';
import {ic} from '../../constants/data';
export default function Modal({open,onClose,children,title,width=480}){
  if(!open)return null;
  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.8)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16,overflowY:'auto',backdropFilter:'blur(4px)'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:18,width:'100%',maxWidth:width,maxHeight:'92vh',overflowY:'auto',margin:'auto',boxShadow:'0 24px 80px rgba(0,0,0,.6)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px 0'}}>
          <h3 style={{fontSize:17,fontWeight:700,fontFamily:'var(--font-head)'}}>{title}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',padding:4,display:'flex'}}><Icon d={ic.close}/></button>
        </div>
        <div style={{padding:24}}>{children}</div>
      </div>
    </div>
  );
}