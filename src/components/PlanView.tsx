'use client';
import { useState } from 'react';
import { TrainingPlan, TrainingDay, WorkoutType } from '@/lib/types';
import { downloadICS } from '@/lib/calendar';
import { storage } from '@/lib/storage';

interface PlanViewProps {
  plan: TrainingPlan;
  onPlanUpdate: (plan: TrainingPlan) => void;
}

const TYPE_COLORS: Record<WorkoutType, string> = {
  easy: 'var(--blue)',
  tempo: 'var(--amber)',
  long: 'var(--accent)',
  interval: 'var(--red)',
  race: '#e0a0ff',
  rest: 'var(--text-muted)',
  cross: 'var(--text-secondary)',
  strength: 'var(--text-secondary)',
};

const TYPE_BG: Record<WorkoutType, string> = {
  easy: 'var(--blue-dim)',
  tempo: 'var(--amber-dim)',
  long: 'var(--accent-dim)',
  interval: 'var(--red-dim)',
  race: 'rgba(224,160,255,0.12)',
  rest: 'transparent',
  cross: 'rgba(255,255,255,0.04)',
  strength: 'rgba(255,255,255,0.04)',
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PlanView({ plan, onPlanUpdate }: PlanViewProps) {
  const [activeWeek, setActiveWeek] = useState(0);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [downloadMsg, setDownloadMsg] = useState('');

  const currentWeek = plan.weeks[activeWeek];

  const handleToggleComplete = (date: string, current: boolean) => {
    const newState = storage.markWorkoutComplete(date, !current);
    if (newState.plan) onPlanUpdate(newState.plan);
  };

  const handleDownload = () => {
    downloadICS(plan);
    setDownloadMsg('Downloaded!');
    setTimeout(() => setDownloadMsg(''), 2500);
  };

  // Find current week based on today
  const today = new Date().toISOString().split('T')[0];
  const currentWeekIdx = plan.weeks.findIndex(w =>
    w.days.some(d => d.date === today)
  );

  const totalCompleted = plan.weeks.flatMap(w => w.days).filter(d => d.completed).length;
  const totalWorkouts = plan.weeks.flatMap(w => w.days).filter(d => d.workout.type !== 'rest').length;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '1.5rem 1rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 4 }}>
            {plan.profile.raceName || 'Marathon Training Plan'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {plan.totalWeeks} weeks · Peak {plan.peakWeekMiles} mi/week
            {plan.profile.raceDate && ` · Race ${new Date(plan.profile.raceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
          </p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={handleDownload}
          style={{ gap: 8 }}
        >
          📅 {downloadMsg || 'Export to calendar'}
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: '1.5rem' }}>
        {[
          { label: 'Weeks', value: plan.totalWeeks },
          { label: 'Peak week', value: `${plan.peakWeekMiles} mi` },
          { label: 'Marathon pace', value: plan.racePaces.marathon },
          { label: 'Completed', value: `${totalCompleted}/${totalWorkouts}` },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 500, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Pace reference */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Training paces</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Easy', value: plan.racePaces.easy, color: 'var(--blue)' },
            { label: 'Long', value: plan.racePaces.long, color: 'var(--accent)' },
            { label: 'Tempo', value: plan.racePaces.tempo, color: 'var(--amber)' },
            { label: 'Interval', value: plan.racePaces.interval, color: 'var(--red)' },
            { label: 'Marathon', value: plan.racePaces.marathon, color: '#e0a0ff' },
          ].map(p => (
            <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.label}:</span>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{p.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Week selector */}
      <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: 6, paddingBottom: 8, minWidth: 'max-content' }}>
          {plan.weeks.map((week, idx) => {
            const isCurrentWeek = idx === currentWeekIdx;
            const weekCompleted = week.days.filter(d => d.completed).length;
            const weekTotal = week.days.filter(d => d.workout.type !== 'rest').length;
            const pct = weekTotal > 0 ? weekCompleted / weekTotal : 0;

            return (
              <button
                key={week.weekNumber}
                onClick={() => setActiveWeek(idx)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: `1px solid ${activeWeek === idx ? 'var(--accent)' : isCurrentWeek ? 'var(--border-md)' : 'var(--border)'}`,
                  background: activeWeek === idx ? 'var(--accent-dim)' : 'transparent',
                  color: activeWeek === idx ? 'var(--accent)' : isCurrentWeek ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  minWidth: 72,
                  textAlign: 'center',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                <div style={{ fontWeight: 500 }}>Wk {week.weekNumber}</div>
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{week.totalMiles}mi</div>
                {pct > 0 && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 2, right: 2, height: 2,
                    background: 'var(--accent)', borderRadius: 99,
                    opacity: pct, width: `calc(100% * ${pct} - 4px)`,
                  }} />
                )}
                {isCurrentWeek && activeWeek !== idx && (
                  <div style={{
                    position: 'absolute', top: -4, right: -4,
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--accent)',
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Week header */}
      {currentWeek && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                Week {currentWeek.weekNumber}: {currentWeek.focus}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {new Date(currentWeek.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                {new Date(currentWeek.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' · '}{currentWeek.totalMiles} miles
              </p>
            </div>
          </div>

          {/* Days grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {currentWeek.days.map(day => {
              const isToday = day.date === today;
              const isExpanded = expandedDay === day.date;
              const typeColor = TYPE_COLORS[day.workout.type];
              const typeBg = TYPE_BG[day.workout.type];
              const isRest = day.workout.type === 'rest';

              return (
                <div
                  key={day.date}
                  className="card"
                  style={{
                    border: isToday ? '1px solid var(--accent)' : undefined,
                    opacity: isRest ? 0.6 : 1,
                  }}
                >
                  <div
                    style={{ padding: '12px 16px', cursor: isRest ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                    onClick={() => !isRest && setExpandedDay(isExpanded ? null : day.date)}
                  >
                    {/* Day label */}
                    <div style={{ width: 40, flexShrink: 0, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {DAY_LABELS[day.dayOfWeek]}
                      </div>
                      <div style={{ fontSize: 13, color: isToday ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: isToday ? 500 : 400 }}>
                        {new Date(day.date + 'T12:00:00').getDate()}
                      </div>
                    </div>

                    {/* Type badge */}
                    <div style={{
                      padding: '3px 8px', borderRadius: 99,
                      background: typeBg, color: typeColor,
                      fontSize: 11, fontWeight: 500, textTransform: 'uppercase',
                      letterSpacing: '0.05em', flexShrink: 0,
                      minWidth: 60, textAlign: 'center',
                    }}>
                      {day.workout.type}
                    </div>

                    {/* Title & meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
                        {day.workout.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 10 }}>
                        {day.workout.distance && <span>{day.workout.distance} mi</span>}
                        {day.workout.duration && <span>~{day.workout.duration} min</span>}
                        {day.workout.paceTarget && <span style={{ fontFamily: 'var(--font-mono)' }}>{day.workout.paceTarget}</span>}
                      </div>
                    </div>

                    {/* Complete checkbox */}
                    {!isRest && (
                      <div
                        onClick={e => { e.stopPropagation(); handleToggleComplete(day.date, !!day.completed); }}
                        style={{
                          width: 22, height: 22, borderRadius: 6,
                          border: `1.5px solid ${day.completed ? 'var(--accent)' : 'var(--border-md)'}`,
                          background: day.completed ? 'var(--accent)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', flexShrink: 0,
                          color: 'var(--accent-text)', fontSize: 12,
                          transition: 'all 0.15s',
                        }}
                      >
                        {day.completed && '✓'}
                      </div>
                    )}

                    {/* Expand arrow */}
                    {!isRest && (
                      <span style={{ color: 'var(--text-muted)', fontSize: 12, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                    )}
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)', paddingTop: 12, animation: 'fadeIn 0.2s ease' }}>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: day.workout.notes ? 10 : 0 }}>
                        {day.workout.description}
                      </p>
                      {day.workout.notes && (
                        <div style={{
                          background: 'var(--amber-dim)', border: '1px solid rgba(240,168,84,0.2)',
                          borderRadius: 8, padding: '8px 12px', marginTop: 10,
                        }}>
                          <span style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 500 }}>COACH TIP</span>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.6 }}>{day.workout.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
