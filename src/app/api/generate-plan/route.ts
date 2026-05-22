import { NextRequest, NextResponse } from 'next/server';
import { RunnerProfile, TrainingPlan, TrainingWeek, Workout, WorkoutType } from '@/lib/types';
import { calculatePaces } from '@/lib/paces';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
  }

  const profile: RunnerProfile = await req.json();
  const racePaces = calculatePaces(profile);

  // Hard cap at 10 weeks to guarantee JSON fits within token limit
  // Longer plans = same structure, extended by repeating peak weeks
  let totalWeeks = Math.min(profile.planWeeks || 10, 10);
  if (profile.raceDate) {
    const raceDate = new Date(profile.raceDate);
    const today = new Date();
    const diffWeeks = Math.round((raceDate.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000));
    totalWeeks = Math.max(4, Math.min(diffWeeks, 10));
  }

  const longRunDay = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].indexOf(profile.preferredLongRunDay);

  const prompt = `Create a ${totalWeeks}-week marathon training plan as JSON only.

Runner: ${profile.level}, ${profile.weeklyMileage}mi/week, ${profile.daysPerWeek} days/week, long run day: ${profile.preferredLongRunDay} (dayOfWeek ${longRunDay}).
Goal: ${profile.goalType === 'time' ? profile.goalTime : profile.goalType}.
Easy pace: ${racePaces.easy}. Tempo: ${racePaces.tempo}. Long: ${racePaces.long}. Interval: ${racePaces.interval}.
${profile.injuries.length ? `Injuries: ${profile.injuries.join(', ')}.` : ''}
${profile.crossTraining.length ? `Also does: ${profile.crossTraining.join(', ')}.` : ''}

Return ONLY this JSON structure, no other text:
{"peakWeekMiles":NUMBER,"weeks":[{"weekNumber":1,"focus":"Base","totalMiles":NUMBER,"days":[{"dayOfWeek":0,"type":"rest","title":"Rest","description":"Rest day","distance":null,"duration":null,"paceTarget":null},{"dayOfWeek":1,"type":"easy","title":"Easy 4mi","description":"Easy pace","distance":4,"duration":44,"paceTarget":"${racePaces.easy}"},{"dayOfWeek":2,"type":"rest","title":"Rest","description":"Rest","distance":null,"duration":null,"paceTarget":null},{"dayOfWeek":3,"type":"tempo","title":"Tempo 5mi","description":"Comfortably hard","distance":5,"duration":45,"paceTarget":"${racePaces.tempo}"},{"dayOfWeek":4,"type":"easy","title":"Easy 3mi","description":"Recovery","distance":3,"duration":33,"paceTarget":"${racePaces.easy}"},{"dayOfWeek":5,"type":"rest","title":"Rest","description":"Rest","distance":null,"duration":null,"paceTarget":null},{"dayOfWeek":${longRunDay},"type":"long","title":"Long 10mi","description":"Easy long run","distance":10,"duration":110,"paceTarget":"${racePaces.long}"}]}]}

Rules:
- Exactly ${totalWeeks} weeks, exactly 7 days each
- Long run always on dayOfWeek ${longRunDay}
- Progress mileage ~10%/week, cutback every 4th week
- Last 2 weeks: taper
- Keep ALL string values under 50 chars
- No extra fields`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
        system: 'Return ONLY valid compact JSON. No markdown. No explanation. No whitespace between tokens. Just the JSON object starting with {',
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('Claude API error:', data.error);
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const text = data.content?.[0]?.text || '';
    console.log('Response length:', text.length);
    console.log('Response start:', text.slice(0, 150));

    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1) {
      console.error('No JSON found:', text.slice(0, 300));
      return NextResponse.json({ error: 'No JSON in response' }, { status: 500 });
    }

    const jsonStr = text.slice(jsonStart, jsonEnd + 1);

    let planData;
    try {
      planData = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Parse error. JSON start:', jsonStr.slice(0, 200));
      console.error('JSON end:', jsonStr.slice(-200));
      return NextResponse.json({ error: 'JSON parse failed' }, { status: 500 });
    }

    const plan = assemblePlan(profile, planData, totalWeeks, racePaces);
    return NextResponse.json(plan);

  } catch (error) {
    console.error('Plan generation error:', error);
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
  }
}

function assemblePlan(
  profile: RunnerProfile,
  planData: { peakWeekMiles: number; weeks: any[] },
  totalWeeks: number,
  racePaces: ReturnType<typeof calculatePaces>
): TrainingPlan {
  const planId = Date.now().toString(36);
  const startDate = new Date();
  const daysUntilMonday = (8 - startDate.getDay()) % 7 || 7;
  startDate.setDate(startDate.getDate() + daysUntilMonday);

  const weeks: TrainingWeek[] = (planData.weeks || []).map((w: any, wi: number) => {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + wi * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const days = (w.days || []).map((d: any) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + (d.dayOfWeek || 0));

      const workout: Workout = {
        id: `${planId}-w${w.weekNumber}-d${d.dayOfWeek}`,
        type: (d.type || 'rest') as WorkoutType,
        title: d.title || 'Workout',
        description: d.description || '',
        distance: d.distance || undefined,
        duration: d.duration || undefined,
        paceTarget: d.paceTarget || undefined,
        notes: d.notes || undefined,
      };

      return {
        id: `${planId}-w${w.weekNumber}-d${d.dayOfWeek}`,
        date: dayDate.toISOString().split('T')[0],
        dayOfWeek: d.dayOfWeek || 0,
        weekNumber: w.weekNumber || wi + 1,
        workout,
        completed: false,
      };
    });

    return {
      weekNumber: w.weekNumber || wi + 1,
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0],
      totalMiles: w.totalMiles || 0,
      focus: w.focus || 'Training',
      days,
    };
  });

  return {
    id: planId,
    createdAt: new Date().toISOString(),
    profile,
    weeks,
    totalWeeks,
    peakWeekMiles: planData.peakWeekMiles || 0,
    racePaces,
  };
}
