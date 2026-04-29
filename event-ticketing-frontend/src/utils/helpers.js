export const uname  = u => u?.displayName || u?.name || 'User';
export const fmt    = d => new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
export const fmtT   = d => new Date(d).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
export const minP   = t => t?.length ? Math.min(...t.map(x=>x.price)) : 0;
export const GRADS  = [
  'linear-gradient(135deg,#6c47ff,#db2777)',
  'linear-gradient(135deg,#f0a500,#ef4444)',
  'linear-gradient(135deg,#00d68f,#3b82f6)',
  'linear-gradient(135deg,#ec4899,#8b5cf6)',
  'linear-gradient(135deg,#06b6d4,#6366f1)',
  'linear-gradient(135deg,#84cc16,#f0a500)',
];
export const grad   = id => GRADS[(id?.charCodeAt?.(0)||0)%GRADS.length];