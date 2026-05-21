'use client';
import { useState, useEffect } from 'react';
import { AppState, RunnerProfile, TrainingPlan, LoggedRun } from '@/lib/types';
import { storage } from '@/lib/storage';
import Landing from './Landing';
import Onboarding from './Onboarding';
import PlanView from './PlanView';
import Progress from './Progress';
import Coach from './Coach';

type Tab = 'plan' | 'progress' | 'coach';

export default function App() {
  const [appState, setAppState] = useState<AppState | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('plan');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  useEffect(() => {
    setAppState(storage.load());
  }, []);

  if (!appState) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: 24, height: 24, border: '2px solid var(--border-md)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  const handleStart = () => {
    const next = storage.setStep('onboarding');
    setAppState(next);
  };

  const handleOnboardingComplete = async (profile: RunnerProfile) => {
    setGenerating(true);
    setGenError('');
    storage.saveProfile(profile);

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate plan');
      }

      const plan: TrainingPlan = await res.json();
      const next = storage.savePlan(plan);
      setAppState(next);
    } catch (e: any) {
      setGenError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePlanUpdate = (plan: TrainingPlan) => {
    setAppState(s => s ? { ...s, plan } : s);
  };

  const handleLogsUpdate = (logs: LoggedRun[]) => {
    setAppState(s => s ? { ...s, logs } : s);
  };

  const handleReset = () => {
    if (confirm('Start over? This will clear your plan and logs.')) {
      const next = storage.clear();
      setAppState(next);
      setActiveTab('plan');
    }
  };

  // Generating screen
  if (generating) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1.5rem', textAlign: 'center', padding: '2rem' }}>
        <div style={{ position: 'relative', width: 64, height: 64 }}>
          <div style={{
            width: '100%', height: '100%', border: '2px solid var(--border)',
            borderTopColor: 'var(--accent)', borderRadius: '50%',
            animation: 'spin 0.9s linear infinite',
          }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏃</div>
        </div>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Building your plan...</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 340, lineHeight: 1.7 }}>
            Our AI coach is designing your personalized training schedule. This takes about 15–30 seconds.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Analyzing your profile', 'Calculating paces', 'Scheduling workouts', 'Finalizing plan'].map((step, i) => (
            <span key={step} className="badge badge-muted" style={{ animationDelay: `${i * 0.5}s` }}>{step}</span>
          ))}
        </div>
      </div>
    );
  }

  // Error screen
  if (genError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem', textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <h2 style={{ fontSize: '1.4rem' }}>Plan generation failed</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>{genError}</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 400 }}>
          Make sure ANTHROPIC_API_KEY is set in your .env.local file.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: '0.5rem' }}>
          <button className="btn btn-ghost" onClick={() => setGenError('')}>← Back</button>
          <button className="btn btn-primary" onClick={() => appState.profile && handleOnboardingComplete(appState.profile)}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Landing
  if (appState.currentStep === 'landing') {
    return <Landing onStart={handleStart} />;
  }

  // Onboarding
  if (appState.currentStep === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Dashboard
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top nav */}
      <nav style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0 1rem',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', height: 52 }}>
          <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🏃</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              {appState.plan?.profile.raceName || 'Marathon Planner'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {([
              { key: 'plan', label: 'Plan', icon: '📋' },
              { key: 'progress', label: 'Progress', icon: '📈' },
              { key: 'coach', label: 'Coach', icon: '🤖' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '6px 14px', borderRadius: 8,
                  background: activeTab === tab.key ? 'var(--accent-dim)' : 'transparent',
                  color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
                  border: `1px solid ${activeTab === tab.key ? 'var(--accent-border)' : 'transparent'}`,
                  fontSize: 13, cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  transition: 'all 0.15s',
                  gap: 5, display: 'flex', alignItems: 'center',
                }}
              >
                <span>{tab.icon}</span>
                <span style={{ display: 'none' }}>{tab.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={handleReset}
            style={{ marginLeft: 12, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
          >
            ↺ Reset
          </button>
        </div>
      </nav>

      {/* Tab nav labels (visible below main nav on mobile) */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '0 1rem', background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex' }}>
          {([
            { key: 'plan', label: 'Training Plan' },
            { key: 'progress', label: 'Progress' },
            { key: 'coach', label: 'AI Coach' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 16px',
                color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
                background: 'transparent', border: 'none',
                borderBottom: `2px solid ${activeTab === tab.key ? 'var(--accent)' : 'transparent'}`,
                fontSize: 14, cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                transition: 'all 0.15s',
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        {activeTab === 'plan' && appState.plan && (
          <PlanView plan={appState.plan} onPlanUpdate={handlePlanUpdate} />
        )}
        {activeTab === 'progress' && (
          <Progress logs={appState.logs} plan={appState.plan} onLogsUpdate={handleLogsUpdate} />
        )}
        {activeTab === 'coach' && (
          <Coach plan={appState.plan} />
        )}
      </div>
    </div>
  );
}
