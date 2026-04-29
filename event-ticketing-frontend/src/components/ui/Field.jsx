export default function Field({label,children,hint}){
  return(
    <div>
      <label style={{fontSize:11,color:'var(--muted)',display:'block',marginBottom:5,fontWeight:600,letterSpacing:.5,textTransform:'uppercase'}}>{label}</label>
      {children}
      {hint&&<p style={{fontSize:11,color:'var(--muted)',marginTop:4}}>{hint}</p>}
    </div>
  );
}