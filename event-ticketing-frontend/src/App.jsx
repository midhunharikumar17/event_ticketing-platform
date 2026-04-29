import {useState,useEffect,useCallback} from 'react';
import API from './api/axios';
import {DUMMY} from './constants/data';
import Toast,{toast} from './components/ui/Toast';
import Btn from './components/ui/Btn';
import Icon from './components/ui/Icon';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import EventDetailModal from './components/EventDetailModal';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import CategoriesPage from './pages/CategoriesPage';
import ProfilePage from './pages/ProfilePage';
import AdminPanel from './pages/AdminPanel';
import VenuesPage from './pages/VenuesPage';
import {ic} from './constants/data';

export default function App(){
  const[page,setPage]=useState('home');
  const[catFilter,setCatFilter]=useState('');
  const[events,setEvents]=useState(DUMMY);
  const[user,setUser]=useState(null);
  const[authOpen,setAuthOpen]=useState(false);
  const[selEvent,setSelEvent]=useState(null);
  const[detailOpen,setDetailOpen]=useState(false);

  useEffect(()=>{
    const t=localStorage.getItem('token');
    if(t){API.get('/users/me').then(r=>setUser(r.data.data||r.data.user||r.data)).catch(()=>localStorage.removeItem('token'));}
  },[]);

  useEffect(()=>{
    API.get('/events?limit=50')
      .then(r=>{const d=r.data.events||r.data.data||[];if(d.length)setEvents(d);})
      .catch(()=>{});
  },[]);

  const logout=()=>{
    API.post('/auth/logout').catch(()=>{});
    localStorage.removeItem('token');
    setUser(null);setPage('home');
    toast('Logged out','info');
  };

  const nav=useCallback((p,cat='')=>{setPage(p);setCatFilter(cat);},[]);
  const openEvent=e=>{setSelEvent(e);setDetailOpen(true);};

  if(page==='admin'&&user?.role!=='admin'){nav('home');}

  return(
    <>
      <Toast/>
      <Navbar user={user} onLogin={()=>setAuthOpen(true)} onLogout={logout} onNav={nav} page={page}/>
      <AuthModal open={authOpen} onClose={()=>setAuthOpen(false)} onAuth={setUser}/>
      <EventDetailModal event={selEvent} open={detailOpen} onClose={()=>setDetailOpen(false)} user={user} onLoginNeeded={()=>{setDetailOpen(false);setAuthOpen(true);}} onBooked={()=>{}}/>

      {page==='home'       &&<HomePage       events={events} onEventClick={openEvent} onNav={nav}/>}
      {page==='events'     &&<EventsPage     events={events} onEventClick={openEvent} initCategory={catFilter}/>}
      {page==='categories' &&<CategoriesPage events={events} onEventClick={openEvent} onNav={nav}/>}
      {page==='venues'     &&<VenuesPage     user={user} onNav={nav}/>}
      {page==='admin'      &&user?.role==='admin'&&<AdminPanel/>}
      {page==='profile'    &&user&&<ProfilePage user={user} onUpdate={setUser} onLogout={logout} onNav={nav}/>}
      {page==='profile'    &&!user&&(
        <div style={{textAlign:'center',padding:'80px 24px',color:'var(--muted)'}}>
          <Icon d={ic.user} size={44} color="var(--border)"/>
          <p style={{marginTop:14,fontSize:17}}>Please sign in to view your profile</p>
          <Btn onClick={()=>setAuthOpen(true)} style={{marginTop:18}}>Sign In</Btn>
        </div>
      )}

      <footer style={{borderTop:'1px solid var(--border)',padding:'26px 24px',textAlign:'center',color:'var(--muted)',fontSize:12,marginTop:40}}>
        <p style={{fontWeight:700,color:'var(--text)',marginBottom:4,fontFamily:'var(--font-head)'}}>TicketVerse</p>
        <p>© 2025 TicketVerse. Your universe of experiences.</p>
      </footer>
    </>
  );
}