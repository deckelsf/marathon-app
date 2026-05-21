'use client';
import { storage } from '@/lib/storage';

interface LandingProps {
  onStart: () => void;
}

export default function Landing({ onStart }: LandingProps) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>

      {/* Logo mark */}
      <div style={{ marginBottom: '2rem', animation: 'fadeIn 0.6s ease both' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '16px',
          background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
          fontSize: 28,
        }}>
          🏃
        </div>
      </div>

      {/* Hero */}
      <div style={{ animation: 'fadeIn 0.6s 0.1s ease both', opacity: 0 }}>
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Your marathon,<br />
          <span style={{ color: 'var(--accent)' }}>your plan.</span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          AI-powered training plans built around your life — your schedule, your goals, your body.
          From couch to finish line, or chasing a PR.
        </p>
      </div>

      {/* CTA */}
      <div style={{ animation: 'fadeIn 0.6s 0.2s ease both', opacity: 0, marginBottom: '3rem' }}>
        <button className="btn btn-primary" onClick={onStart} style={{ fontSize: '1rem', padding: '12px 32px' }}>
          Build my training plan
        </button>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: '0.75rem' }}>
          Free · No account required · Export to Google Calendar
        </p>
      </div>

      {/* Features */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
        maxWidth: 680,
        width: '100%',
        animation: 'fadeIn 0.6s 0.3s ease both',
        opacity: 0,
      }}>
        {[
          { icon: '🗓️', label: 'Any timeline', desc: '8–24+ week plans' },
          { icon: '📅', label: 'Calendar export', desc: 'Google & Apple' },
          { icon: '🤖', label: 'AI coach', desc: 'Ask anything' },
          { icon: '📈', label: 'Progress tracking', desc: 'Log every run' },
        ].map(f => (
          <div key={f.label} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 3 }}>{f.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
