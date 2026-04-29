import { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Btn from './ui/Btn';
import Field from './ui/Field';
import Icon from './ui/Icon';
import { toast } from './ui/Toast';
import API from '../api/axios';
import { ic, CATS } from '../constants/data';
import { fmt, fmtT } from '../utils/helpers';

export default function CreateEventModal({ open, onClose, onCreated, venues = [] }) {
  const blank = { title: '', description: '', category: 'Music', venueName: '', venueAddress: '', startTime: '', endTime: '', maxCapacity: 100, tiers: [{ name: 'General', price: 500, totalQuantity: 100 }], posterUrl: '', venueId: '', layoutId: '' };
  const [form, setForm] = useState(blank);
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [err, setErr] = useState('');
  const [selectedVenue, setSelectedVenue] = useState(null);

  useEffect(() => { if (open) { setForm(blank); setStep(1); setErr(''); setImgFile(null); setImgPreview(''); setSelectedVenue(null); } }, [open]);

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const addTier = () => setForm(p => ({ ...p, tiers: [...p.tiers, { name: '', price: 0, totalQuantity: 50 }] }));
  const updTier = (i, k, v) => setForm(p => { const t = [...p.tiers]; t[i] = { ...t[i], [k]: ['price', 'totalQuantity'].includes(k) ? Number(v) : v }; return { ...p, tiers: t }; });
  const rmTier = i => setForm(p => ({ ...p, tiers: p.tiers.filter((_, j) => j !== i) }));

  const handleImage = e => {
    const f = e.target.files?.[0]; if (!f) return;
    setImgFile(f); setImgPreview(URL.createObjectURL(f));
  };

  const handleVenueSelect = v => {
    setSelectedVenue(v);
    upd('venueId', v._id);
    upd('venueName', v.name);
    upd('venueAddress', `${v.address}, ${v.city}`);
    upd('maxCapacity', v.capacity);
  };

  const submit = async () => {
    setErr(''); setLoading(true);
    try {
      let posterUrl = form.posterUrl;
      if (imgFile) {
        const fd = new FormData(); fd.append('image', imgFile);
        const up = await API.post('/uploads/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        posterUrl = up.data.url;
      }
      const res = await API.post('/events', {
        title: form.title, description: form.description || form.title, category: form.category,
        venueName: form.venueName, venueAddress: form.venueAddress,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        location: { type: 'Point', coordinates: [76.2711, 9.9312] },
        maxCapacity: Number(form.maxCapacity), posterUrl,
        venueId: form.venueId || undefined,
        tiers: form.tiers.map(t => ({ name: t.name, price: Number(t.price), totalQuantity: Number(t.totalQuantity), remainingQuantity: Number(t.totalQuantity), description: '' })),
        sections: [],
      });
      const ev = res.data.event;
      const sections = form.tiers.map((t, i) => ({ name: t.name + ' Section', tierId: ev.tiers[i]?._id || ev.tiers[0]._id, rowCount: Math.max(1, Math.ceil(Number(t.totalQuantity) / 10)), seatsPerRow: 10 }));
      await API.patch(`/events/${ev._id}`, { sections });
      await API.post(`/events/${ev._id}/publish`);
      toast('Event created & published! 🚀');
      onCreated?.(); onClose();
    } catch (e) {
      setErr(e.response?.data?.message || e.response?.data?.error?.message || 'Failed to create event');
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Host an Event" width={600}>
      {/* Steps */}
      <div style={{ display: 'flex', marginBottom: 22 }}>
        {['Details', 'Tiers', 'Review'].map((s, i) => (
          <div key={s} onClick={() => step > i + 1 && setStep(i + 1)}
            style={{ flex: 1, textAlign: 'center', padding: '8px 0', borderBottom: '2px solid', borderColor: step === i + 1 ? '#6c47ff' : 'var(--border)', color: step === i + 1 ? '#9d7fff' : 'var(--muted)', fontSize: 12, fontWeight: 600, cursor: step > i + 1 ? 'pointer' : 'default', transition: 'all .2s' }}>
            {i + 1}. {s}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Venue selector */}
          {venues.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: .5, marginBottom: 8 }}>LINK TO YOUR VENUE (OPTIONAL)</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                {venues.map(v => (
                  <div key={v._id} onClick={() => handleVenueSelect(v)}
                    style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid', borderColor: selectedVenue?._id === v._id ? '#6c47ff' : 'var(--border)', background: selectedVenue?._id === v._id ? 'rgba(108,71,255,.12)' : 'transparent', cursor: 'pointer', transition: 'all .18s' }}>
                    <p style={{ fontWeight: 600, fontSize: 12, color: selectedVenue?._id === v._id ? '#9d7fff' : 'var(--text)' }}>{v.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--muted)' }}>{v.city} · {v.capacity.toLocaleString()} cap</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Field label="Event Banner">
            <div style={{ border: '2px dashed var(--border)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }} onClick={() => document.getElementById('ev-img').click()}>
              {imgPreview ? <img src={imgPreview} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} /> : (
                <div style={{ height: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', gap: 7 }}>
                  <Icon d={ic.image} size={28} color="var(--border)" />
                  <p style={{ fontSize: 12 }}>Click to upload (max 5MB)</p>
                </div>
              )}
              <input id="ev-img" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
            </div>
          </Field>
          <Field label="Event Title *"><input value={form.title} onChange={e => upd('title', e.target.value)} placeholder="Event title" /></Field>
          <Field label="Description">
            <textarea value={form.description} onChange={e => upd('description', e.target.value)} rows={3}
              placeholder="Describe your event… (optional)" style={{ resize: 'vertical' }} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
            <Field label="Category"><select value={form.category} onChange={e => upd('category', e.target.value)}>{CATS.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}</select></Field>
            <Field label="Max Capacity"><input type="number" value={form.maxCapacity} onChange={e => upd('maxCapacity', e.target.value)} /></Field>
          </div>
          {!selectedVenue && <Field label="Venue Name *"><input value={form.venueName} onChange={e => upd('venueName', e.target.value)} placeholder="Venue name" /></Field>}
          {!selectedVenue && <Field label="Venue Address *"><input value={form.venueAddress} onChange={e => upd('venueAddress', e.target.value)} placeholder="City, State" /></Field>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
            <Field label="Start *"><input type="datetime-local" value={form.startTime} onChange={e => upd('startTime', e.target.value)} /></Field>
            <Field label="End *"><input type="datetime-local" value={form.endTime} onChange={e => upd('endTime', e.target.value)} /></Field>
          </div>
          <Btn onClick={() => setStep(2)} full size="lg">Next: Tiers →</Btn>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontWeight: 700, fontFamily: 'var(--font-head)' }}>Ticket Tiers</p>
            <Btn onClick={addTier} variant="outline" size="sm"><Icon d={ic.plus} size={13} />Add Tier</Btn>
          </div>
          {form.tiers.map((t, i) => (
            <div key={i} style={{ background: 'var(--bg)', borderRadius: 12, padding: 14, border: '1px solid var(--border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: form.tiers.length > 1 ? 10 : 0 }}>
                <Field label="Name"><input value={t.name} onChange={e => updTier(i, 'name', e.target.value)} placeholder="General / VIP" /></Field>
                <Field label="Price ₹"><input type="number" value={t.price} onChange={e => updTier(i, 'price', e.target.value)} /></Field>
                <Field label="Qty"><input type="number" value={t.totalQuantity} onChange={e => updTier(i, 'totalQuantity', e.target.value)} /></Field>
              </div>
              {form.tiers.length > 1 && <Btn onClick={() => rmTier(i)} variant="danger" size="sm">Remove</Btn>}
            </div>
          ))}
          {err && <div style={{ background: 'rgba(255,77,109,.1)', border: '1px solid rgba(255,77,109,.3)', borderRadius: 8, padding: '9px 13px', color: '#ff4d6d', fontSize: 12 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn onClick={() => setStep(1)} variant="outline" full>← Back</Btn>
            <Btn onClick={() => setStep(3)} full>Review →</Btn>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 16 }}>
            {imgPreview && <img src={imgPreview} alt="" style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 8, marginBottom: 11 }} />}
            <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 3, fontFamily: 'var(--font-head)' }}>{form.title}</p>
            <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>{form.category} · {form.venueName} · {form.venueAddress}</p>
            {form.startTime && <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 10 }}>{fmt(form.startTime)} {fmtT(form.startTime)}</p>}
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {form.tiers.map(t => (
                <span key={t.name} style={{ background: 'rgba(108,71,255,.15)', color: '#9d7fff', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                  {t.name} · ₹{t.price} · {t.totalQuantity} seats
                </span>
              ))}
            </div>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 12 }}>This event will be <b style={{ color: '#00d68f' }}>published immediately</b>.</p>
          {err && <div style={{ background: 'rgba(255,77,109,.1)', border: '1px solid rgba(255,77,109,.3)', borderRadius: 8, padding: '9px 13px', color: '#ff4d6d', fontSize: 12 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn onClick={() => setStep(2)} variant="outline" full>← Back</Btn>
            <Btn onClick={submit} variant="gold" full disabled={loading}>{loading ? 'Publishing…' : 'Publish Event 🚀'}</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}