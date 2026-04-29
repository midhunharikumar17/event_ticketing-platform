import Icon from './ui/Icon';
import Btn from './ui/Btn';
import {ic} from '../constants/data';
import {uname} from '../utils/helpers';

export default function Navbar({user,onLogin,onLogout,onNav,page}){
  return(
    <nav style={{position:'sticky',top:0,zIndex:100,background:'rgba(7,7,14,.92)',backdropFilter:'blur(16px)',borderBottom:'1px solid var(--border)',padding:'0 28px',display:'flex',alignItems:'center',height:62,gap:6}}>
      <div onClick={()=>onNav('home')} style={{cursor:'pointer',display:'flex',alignItems:'center',gap:9,marginRight:20}}>
        <div style={{width:32,height:32,borderRadius:9,background:'linear-gradient(135deg,#6c47ff,#9d7fff)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 20px #6c47ff66'}}>
          <Icon d={ic.ticket} size={15} color="#fff"/>
        </div>
        <span style={{fontSize:18,fontWeight:800,fontFamily:'var(--font-head)',background:'linear-gradient(135deg,#9d7fff,#f0a500)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>TicketVerse</span>
      </div>
      <div style={{display:'flex',gap:2,flex:1}}>
        {[['home','Home'],['events','Events'],['categories','Categories'],['venues','Venues']].map(([p,l])=>(
          <button key={p} onClick={()=>onNav(p)}
            style={{background:page===p?'rgba(108,71,255,.15)':'none',border:'none',color:page===p?'#9d7fff':'var(--muted)',padding:'7px 14px',borderRadius:8,fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'var(--font-body)',transition:'all .18s'}}>
            {l}
          </button>
        ))}
        {user?.role==='admin'&&(
          <button onClick={()=>onNav('admin')}
            style={{background:page==='admin'?'rgba(255,77,109,.12)':'none',border:'none',color:page==='admin'?'#ff4d6d':'var(--muted)',padding:'7px 14px',borderRadius:8,fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'var(--font-body)',display:'flex',alignItems:'center',gap:5}}>
            <Icon d={ic.shield} size={13}/>Admin
          </button>
        )}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:7}}>
        {user?(
          <>
            <button onClick={()=>onNav('profile')}
              style={{display:'flex',alignItems:'center',gap:7,background:'none',border:'none',color:'var(--text)',cursor:'pointer',padding:'5px 10px',borderRadius:8,fontFamily:'var(--font-body)'}}>
              <div style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,#6c47ff,#9d7fff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#fff',boxShadow:'0 0 12px #6c47ff44'}}>
                {uname(user)[0]?.toUpperCase()}
              </div>
              <span style={{fontSize:13,fontWeight:600}}>{uname(user).split(' ')[0]}</span>
              {user.role!=='attendee'&&<span style={{fontSize:10,background:user.role==='admin'?'#ff4d6d22':user.role==='organizer'?'#f0a50022':'#6c47ff22',color:user.role==='admin'?'#ff4d6d':user.role==='organizer'?'#f0a500':'#9d7fff',padding:'1px 8px',borderRadius:10,fontWeight:700}}>{user.role}</span>}
            </button>
            <Btn onClick={onLogout} variant="ghost" size="sm"><Icon d={ic.logout} size={15}/></Btn>
          </>
        ):(
          <Btn onClick={onLogin} size="sm">Sign In</Btn>
        )}
      </div>
    </nav>
    
  );
}