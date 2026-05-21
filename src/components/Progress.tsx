'use client';
import { useState } from 'react';
import { LoggedRun, TrainingPlan } from '@/lib/types';
import { storage } from '@/lib/storage';

interface ProgressProps {
  logs: LoggedRun[];
  plan: TrainingPlan | null;
  onLogsUpdate: (logs: LoggedRun[]) => void;
}

export default function Progress({ logs, plan, onLogsUpdate }: ProgressProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    distance: '',
    hours: '0',
    minutes: '00',
    seconds: '00',
    perceivedEffort: 5,
    notes: '',
  });

  const handleLog = () => {
    const totalSeconds = Number(form.hours) * 3600 + Number(form.minutes) * 60 + Number(form.seconds);
    const dist = parseFloat(form.distance);
    if (!dist || totalSeconds === 0) return;

    const secsPerMile = totalSeconds / dist;
    const paceMin = Math.floor(secsPerMile / 60);
    const paceSec = Math.round(secsPerMile % 60);

    const run: LoggedRun = {
      id: Date.now().toString(36),
      date: form.date,
      distance: dist,
      duration: Math.round(totalSeconds / 60),
      pace: `${paceMin}:${String(paceSec).padStart(2, '0')}/mi`,
      perceivedEffort: form.perceivedEffort,
      notes: form.notes || undefined,
    };

    const newState = storage.addLog(run);
    onLogsUpdate(newState.logs);
    setShowForm(false);
    setForm({ date: new Date().toISOString().split('T')[0], distance: '', hours: '0', minutes: '00', seconds: '00', perceivedEffort: 5, notes: '' });
  };

  // Stats
  const totalMiles = logs.reduce((s, l) => s + l.distance, 0);
  const avgPaceSeconds = logs.length > 0
    ? logs.reduce((s, l) => {
        const [m, sec] = l.pace.replace('/mi', '').split(':').map(Number);
        return s + m * 60 + sec;
      }, 0) / logs.length
    : 0;
  const avgPaceMin = Math.floor(avgPaceSeconds / 60);
  const avgPaceSec = Math.round(avgPaceSeconds % 60);

  // Weekly mileage for chart (last 8 weeks)
  const weeklyMiles: { week: string; miles: number }[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const miles = logs
      .filter(l => {
        const d = new Date(l.date);
        return d >= weekStart && d <= weekEnd;
      })
      .reduce((s, l) => s + l.distance, 0);
    weeklyMiles.push({ week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), miles });
  }

  const maxMiles = Math.max(...weeklyMiles.map(w => w.miles), 1);

  const effortLabel = (e: number) => ['', 'Very easy', 'Easy', 'Moderate', 'Somewhat hard', 'Hard', 'Hard', 'Very hard', 'Very hard', 'Max', 'Max'][Math.min(e, 10)];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>Progress</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{logs.length} runs logged</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? '✕ Cancel' : '+ Log a run'}
        </button>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', animation: 'fadeIn 0.25s ease' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Log a run</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Distance (miles)</label>
              <input type="number" className="input" placeholder="6.2" step="0.1" value={form.distance} onChange={e => setForm(f => ({ ...f, distance: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Time (h : mm : ss)</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="number" className="input" min={0} max={9} value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} style={{ width: 60 }} />
                <span style={{ color: 'var(--text-muted)' }}>:</span>
                <input type="number" className="input" min={0} max={59} value={form.minutes} onChange={e => setForm(f => ({ ...f, minutes: e.target.value.padStart(2, '0') }))} style={{ width: 70 }} />
                <span style={{ color: 'var(--text-muted)' }}>:</span>
                <input type="number" className="input" min={0} max={59} value={form.seconds} onChange={e => setForm(f => ({ ...f, seconds: e.target.value.padStart(2, '0') }))} style={{ width: 70 }} />
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Perceived effort: {form.perceivedEffort}/10 — {effortLabel(form.perceivedEffort)}</label>
              <input type="range" min={1} max={10} step={1} value={form.perceivedEffort} onChange={e => setForm(f => ({ ...f, perceivedEffort: Number(e.target.value) }))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Notes (optional)</label>
              <textarea className="input" placeholder="How did it go? Weather, how you felt, anything notable..." rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: '1rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleLog} disabled={!form.distance}>Save run</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: '1.5rem' }}>
        {[
          { label: 'Total miles', value: Math.round(totalMiles) },
          { label: 'Total runs', value: logs.length },
          { label: 'Avg pace', value: logs.length ? `${avgPaceMin}:${String(avgPaceSec).padStart(2, '0')}/mi` : '—' },
          { label: 'This week', value: `${weeklyMiles[weeklyMiles.length - 1]?.miles.toFixed(1) || 0} mi` },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 500, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Weekly mileage chart */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Weekly mileage</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
          {weeklyMiles.map((w, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {w.miles > 0 ? w.miles.toFixed(0) : ''}
              </span>
              <div style={{
                width: '100%', borderRadius: '4px 4px 0 0',
                height: `${(w.miles / maxMiles) * 80}px`,
                minHeight: w.miles > 0 ? 4 : 0,
                background: i === weeklyMiles.length - 1 ? 'var(--accent)' : 'var(--border-md)',
                transition: 'height 0.5s ease',
              }} />
              <span style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2 }}>
                {w.week.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Run log */}
      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏃</div>
          <p>No runs logged yet. Hit that + button to record your first workout.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {logs.map(log => {
            const effortColor = log.perceivedEffort <= 4 ? 'var(--blue)' : log.perceivedEffort <= 6 ? 'var(--accent)' : log.perceivedEffort <= 8 ? 'var(--amber)' : 'var(--red)';
            return (
              <div key={log.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, flexShrink: 0, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {new Date(log.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {new Date(log.date + 'T12:00:00').getDate()}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 500, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                      {log.distance} mi
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{log.pace}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {Math.floor(log.duration / 60)}h {log.duration % 60}m
                    </span>
                    <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, background: `${effortColor}1a`, color: effortColor }}>
                      RPE {log.perceivedEffort}
                    </span>
                  </div>
                  {log.notes && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>{log.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    const newState = storage.deleteLog(log.id);
                    onLogsUpdate(newState.logs);
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 4 }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
