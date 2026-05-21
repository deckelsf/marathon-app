import { TrainingPlan, TrainingDay } from './types';

function pad(n: number) { return String(n).padStart(2, '0'); }

function formatICSDate(isoDate: string, time?: string): string {
  const d = new Date(isoDate);
  const y = d.getFullYear();
  const mo = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  if (time) {
    const [h, m] = time.split(':');
    return `${y}${mo}${day}T${pad(Number(h))}${pad(Number(m))}00`;
  }
  return `${y}${mo}${day}`;
}

function escapeICS(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
}

function workoutToICS(day: TrainingDay, uid: string): string {
  const { workout, date } = day;
  const dateFormatted = formatICSDate(date);

  const typeEmoji: Record<string, string> = {
    easy: '🏃',
    tempo: '⚡',
    long: '🏔️',
    interval: '🔥',
    race: '🏁',
    rest: '💤',
    cross: '🚴',
    strength: '💪',
  };

  const emoji = typeEmoji[workout.type] || '🏃';
  const summary = `${emoji} ${workout.title}`;

  let description = workout.description;
  if (workout.paceTarget) description += `\n\nTarget pace: ${workout.paceTarget}`;
  if (workout.distance) description += `\nDistance: ${workout.distance} miles`;
  if (workout.duration) description += `\nDuration: ~${workout.duration} min`;
  if (workout.notes) description += `\n\nNotes: ${workout.notes}`;
  description += `\n\nWeek ${day.weekNumber} · ${workout.type.charAt(0).toUpperCase() + workout.type.slice(1)} run`;

  return [
    'BEGIN:VEVENT',
    `UID:${uid}@marathon-planner`,
    `DTSTAMP:${formatICSDate(new Date().toISOString().split('T')[0])}T000000Z`,
    `DTSTART;VALUE=DATE:${dateFormatted}`,
    `DTEND;VALUE=DATE:${dateFormatted}`,
    `SUMMARY:${escapeICS(summary)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    `CATEGORIES:${workout.type.toUpperCase()},RUNNING`,
    'END:VEVENT',
  ].join('\r\n');
}

export function generateICS(plan: TrainingPlan): string {
  const events: string[] = [];

  for (const week of plan.weeks) {
    for (const day of week.days) {
      if (day.workout.type === 'rest') continue; // skip rest days unless user wants them
      const uid = `${plan.id}-w${day.weekNumber}-d${day.dayOfWeek}`;
      events.push(workoutToICS(day, uid));
    }
  }

  const cal = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Marathon Planner//EN',
    `X-WR-CALNAME:${escapeICS(plan.profile.raceName || 'Marathon Training')}`,
    'X-WR-TIMEZONE:America/New_York',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  return cal;
}

export function downloadICS(plan: TrainingPlan) {
  const content = generateICS(plan);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(plan.profile.raceName || 'marathon-training').toLowerCase().replace(/\s+/g, '-')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
