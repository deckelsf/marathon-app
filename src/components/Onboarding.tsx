'use client';
import { useState } from 'react';
import { RunnerProfile, RunnerLevel, GoalType, RaceDistance } from '@/lib/types';

interface OnboardingProps {
  onComplete: (profile: RunnerProfile) => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const INJURY_OPTIONS = [
  'IT band', 'Shin splints', 'Plantar fasciitis', 'Knee pain',
  'Achilles tendon', 'Hip flexor', 'Lower back', 'Stress fracture',
];

const CROSS_TRAINING_OPTIONS = [
  'Cycling', 'Swimming', 'Strength training', 'Yoga/Pilates',
  'Rowing', 'Elliptical', 'HIIT', 'Hiking',
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Partial<RunnerProfile>>({
    name: '',
    level: 'intermediate',
    weeklyMileage: 25,
    daysPerWeek: 4,
    preferredLongRunDay: 'Saturday',
    injuries: [],
    crossTraining: [],
    goalType: 'finish',
    raceDistance: 'marathon',
  });

  const update = (fields: Partial<RunnerProfile>) => setProfile(p => ({ ...p, ...fields }));

  const toggleArray = (key: 'injuries' | 'crossTraining', val: string) => {
    const arr = (profile[key] || []) as string[];
    update({ [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] });
  };

  const steps = [
    { title: "Let's get to know you", subtitle: "A few basics to get started" },
    { title: 'Your running background', subtitle: 'Help us understand where you are now' },
    { title: 'Your goal', subtitle: 'What are you training for?' },
    { title: 'Your schedule', subtitle: 'When can you run?' },
    { title: 'Body & cross-training', subtitle: 'So we can build the right plan' },
  ];

  const canAdvance = () => {
    if (step === 0) return profile.name && profile.name.length > 0;
    if (step === 2) {
      if (profile.goalType === 'time' && !profile.goalTime) return false;
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
    else handleSubmit();
  };

  const handleSubmit = () => {
    onComplete(profile as RunnerProfile);
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-md)',
    borderRadius: 8,
    padding: '10px 14px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    width: '100%',
    outline: 'none',
  };

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '7px 14px',
    borderRadius: 99,
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border-md)'}`,
    background: active ? 'var(--accent-dim)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'var(--font-body)',
  });

  const levelCards: { value: RunnerLevel; label: string; desc: string }[] = [
    { value: 'beginner', label: 'Beginner', desc: 'Running < 1 year or < 15 mi/week' },
    { value: 'intermediate', label: 'Intermediate', desc: '1–3 years, 15–35 mi/week' },
    { value: 'advanced', label: 'Advanced', desc: '3+ years, 35+ mi/week' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Progress */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Step {step + 1} of {steps.length}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{Math.round(((step + 1) / steps.length) * 100)}%</span>
          </div>
          <div style={{ height: 3, background: 'var(--border)', borderRadius: 99 }}>
            <div style={{
              height: '100%', borderRadius: 99, background: 'var(--accent)',
              width: `${((step + 1) / steps.length) * 100}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }} key={step}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: 6 }}>{steps[step].title}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{steps[step].subtitle}</p>
        </div>

        {/* Step content */}
        <div key={`content-${step}`} style={{ animation: 'fadeIn 0.3s ease' }}>

          {/* Step 0: Name */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="label">Your name</label>
                <input
                  className="input"
                  placeholder="e.g. Alex"
                  value={profile.name || ''}
                  onChange={e => update({ name: e.target.value })}
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Experience level</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {levelCards.map(l => (
                    <div
                      key={l.value}
                      className="card card-hover"
                      onClick={() => update({ level: l.value })}
                      style={{
                        padding: '12px 16px', cursor: 'pointer',
                        borderColor: profile.level === l.value ? 'var(--accent)' : undefined,
                        background: profile.level === l.value ? 'var(--accent-dim)' : undefined,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: profile.level === l.value ? 'var(--accent)' : 'var(--text-primary)' }}>{l.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{l.desc}</div>
                      </div>
                      {profile.level === l.value && <span style={{ color: 'var(--accent)', fontSize: 18 }}>✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Running background */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="label">Current weekly mileage</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    type="range" min={0} max={80} step={5}
                    value={profile.weeklyMileage}
                    onChange={e => update({ weeklyMileage: Number(e.target.value) })}
                    style={{ flex: 1, accentColor: 'var(--accent)' }}
                  />
                  <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--accent)', minWidth: 60, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {profile.weeklyMileage} mi
                  </span>
                </div>
              </div>
              <div>
                <label className="label">Most recent race (optional)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    className="input"
                    value={profile.recentRaceDistance || ''}
                    onChange={e => update({ recentRaceDistance: e.target.value as RaceDistance })}
                    style={{ flex: 1 }}
                  >
                    <option value="">Distance</option>
                    <option value="marathon">Marathon</option>
                    <option value="half">Half marathon</option>
                    <option value="ultra">Ultra</option>
                    <option value="custom">Other</option>
                  </select>
                  <input
                    className="input"
                    placeholder="Time (h:mm:ss)"
                    value={profile.recentRaceTime || ''}
                    onChange={e => update({ recentRaceTime: e.target.value })}
                    style={{ flex: 1 }}
                  />
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  Used to calculate your training paces accurately
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Goal */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="label">Race distance</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(['marathon', 'half', 'ultra'] as RaceDistance[]).map(d => (
                    <button key={d} style={chipStyle(profile.raceDistance === d)} onClick={() => update({ raceDistance: d })}>
                      {d === 'marathon' ? 'Marathon' : d === 'half' ? 'Half marathon' : 'Ultra'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Your goal</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { value: 'finish' as GoalType, label: 'Just finish', desc: 'Cross that finish line feeling strong' },
                    { value: 'time' as GoalType, label: 'Hit a target time', desc: 'Train specifically to reach a time goal' },
                    { value: 'pr' as GoalType, label: 'Set a new PR', desc: 'Beat your personal record' },
                  ].map(g => (
                    <div
                      key={g.value}
                      className="card card-hover"
                      onClick={() => update({ goalType: g.value })}
                      style={{
                        padding: '12px 16px', cursor: 'pointer',
                        borderColor: profile.goalType === g.value ? 'var(--accent)' : undefined,
                        background: profile.goalType === g.value ? 'var(--accent-dim)' : undefined,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: profile.goalType === g.value ? 'var(--accent)' : 'var(--text-primary)' }}>{g.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{g.desc}</div>
                      </div>
                      {profile.goalType === g.value && <span style={{ color: 'var(--accent)' }}>✓</span>}
                    </div>
                  ))}
                </div>
              </div>
              {profile.goalType === 'time' && (
                <div>
                  <label className="label">Target finish time</label>
                  <input
                    className="input"
                    placeholder="e.g. 3:30:00"
                    value={profile.goalTime || ''}
                    onChange={e => update({ goalTime: e.target.value })}
                  />
                </div>
              )}
              <div>
                <label className="label">Do you have a specific race? (optional)</label>
                <input className="input" placeholder="Race name, e.g. Chicago Marathon" value={profile.raceName || ''} onChange={e => update({ raceName: e.target.value })} style={{ marginBottom: 8 }} />
                <input className="input" type="date" value={profile.raceDate || ''} onChange={e => update({ raceDate: e.target.value })} />
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  If set, your plan will be reverse-engineered to peak on race day
                </p>
              </div>
              {!profile.raceDate && (
                <div>
                  <label className="label">Plan length (weeks)</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[8, 12, 16, 18, 20, 24].map(w => (
                      <button key={w} style={chipStyle(profile.planWeeks === w)} onClick={() => update({ planWeeks: w })}>
                        {w} weeks
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Schedule */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="label">Days available to run per week</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[3, 4, 5, 6].map(d => (
                    <button
                      key={d}
                      style={{ ...chipStyle(profile.daysPerWeek === d), flex: 1 }}
                      onClick={() => update({ daysPerWeek: d })}
                    >
                      {d} days
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Preferred long run day</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {DAYS.map(day => (
                    <button key={day} style={chipStyle(profile.preferredLongRunDay === day)} onClick={() => update({ preferredLongRunDay: day })}>
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Additional notes about your schedule (optional)</label>
                <textarea
                  className="input"
                  placeholder="e.g. travel weeks, busy seasons, back-to-back race days..."
                  value={profile.notes || ''}
                  onChange={e => update({ notes: e.target.value })}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          )}

          {/* Step 4: Body & cross training */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="label">Current injuries or problem areas (select all that apply)</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {INJURY_OPTIONS.map(inj => (
                    <button
                      key={inj}
                      style={chipStyle((profile.injuries || []).includes(inj))}
                      onClick={() => toggleArray('injuries', inj)}
                    >
                      {inj}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 10 }}>
                  <input
                    className="input"
                    placeholder="Other injury or concern..."
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                        toggleArray('injuries', (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="label">Other training you do regularly</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {CROSS_TRAINING_OPTIONS.map(ct => (
                    <button
                      key={ct}
                      style={chipStyle((profile.crossTraining || []).includes(ct))}
                      onClick={() => toggleArray('crossTraining', ct)}
                    >
                      {ct}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem', alignItems: 'center' }}>
          <button
            className="btn btn-ghost"
            onClick={() => setStep(s => Math.max(0, s - 1))}
            style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
          >
            ← Back
          </button>
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={!canAdvance()}
            style={{ opacity: canAdvance() ? 1 : 0.5 }}
          >
            {step === steps.length - 1 ? '✨ Generate my plan' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}
