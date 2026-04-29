export default function Btn({children,onClick,variant='primary',size='md',disabled,full,style}){
  const b={borderRadius:10,fontWeight:600,transition:'all .18s',display:'inline-flex',alignItems:'center',gap:7,justifyContent:'center',width:full?'100%':'auto',opacity:disabled?.5:1,cursor:disabled?'not-allowed':'pointer',border:'none',fontFamily:'var(--font-body)',...style};
  const v={
    primary:{background:'linear-gradient(135deg,#6c47ff,#9d7fff)',color:'#fff',padding:size==='sm'?'6px 14px':size==='lg'?'13px 32px':'9px 20px',fontSize:size==='sm'?12:size==='lg'?15:13},
    outline:{background:'transparent',border:'1.5px solid #6c47ff',color:'#9d7fff',padding:size==='sm'?'5px 12px':'8px 18px',fontSize:13},
    ghost:  {background:'transparent',color:'var(--muted)',padding:'7px 11px',fontSize:13},
    danger: {background:'#ff4d6d',color:'#fff',padding:'8px 18px',fontSize:13},
    gold:   {background:'linear-gradient(135deg,#f0a500,#ef4444)',color:'#fff',padding:size==='lg'?'13px 32px':'8px 18px',fontSize:size==='lg'?15:13},
    success:{background:'#00d68f',color:'#07070e',padding:'8px 18px',fontSize:13,fontWeight:700},
    dark:   {background:'var(--card)',border:'1.5px solid var(--border)',color:'var(--text)',padding:'8px 18px',fontSize:13},
  };
  return <button onClick={disabled?undefined:onClick} style={{...b,...v[variant]}}>{children}</button>;
}