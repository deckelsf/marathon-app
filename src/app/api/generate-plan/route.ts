import { NextRequest, NextResponse } from 'next/server';
import { RunnerProfile, TrainingPlan, TrainingWeek, Workout, WorkoutType } from '@/lib/types';
import { calculatePaces } from '@/lib/paces';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
  }

  const profile: RunnerProfile = await req.json();

  // Calculate weeks
  let totalWeeks = profile.planWeeks || 16;
  if (profile.raceDate) {
    const raceDate = new Date(profile.raceDate);
    const today = new Date();
    const diffWeeks = Math.round((raceDate.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000));
    totalWeeks = Math.max(8, Math.min(diffWeeks, 30));
  }

  const racePaces = calculatePaces(profile);

  const prompt = buildPrompt(profile, totalWeeks, racePaces);

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
        system: `You are a certified running coach with expertise in marathon training periodization. 
You create scientifically-sound training plans using Jack Daniels' principles.
ALWAYS respond with ONLY valid JSON. No markdown, no explanation, just the JSON object.`,
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

 let planData;
    try {
      // Strip markdown fences, leading/trailing whitespace, and any text before the first {
      let clean = text.replace(/```json\n?|\n?```/g, '').trim();
      const jsonStart = clean.indexOf('{');
      const jsonEnd = clean.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        clean = clean.slice(jsonStart, jsonEnd + 1);
      }
      planData = JSON.parse(clean);
    } catch {
      return NextResponse.json({ error: 'Failed to parse plan from AI', raw: text }, { status: 500 });
    }

    // Build the full plan object
    const plan = assemblePlan(profile, planData, totalWeeks, racePaces);
    return NextResponse.json(plan);

  } catch (error) {
    console.error('Plan generation error:', error);
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
  }
}

function buildPrompt(profile: RunnerProfile, weeks: number, paces: typeof calculatePaces extends (...args: any) => infer R ? R : never): string {
  const raceInfo = profile.raceDate
    ? `Race: ${profile.raceName || 'Target Race'} on ${profile.raceDate}`
    : `No specific race — ${weeks}-week training block`;

  const injuryNote = profile.injuries.length
    ? `Current injuries/concerns: ${profile.injuries.join(', ')}. Reduce load accordingly and add relevant notes.`
    : 'No current injuries.';

  const crossNote = profile.crossTraining.length
    ? `Also does: ${profile.crossTraining.join(', ')}. Integrate cross-training days and account for fatigue.`
    : '';

  const goalNote = profile.goalType === 'time'
    ? `Goal: Finish in ${profile.goalTime}`
    : profile.goalType === 'pr'
    ? `Goal: New personal record (current best: ${profile.recentRaceTime})`
    : 'Goal: Finish the race comfortably';

  return `Create a ${weeks}-week marathon training plan for this runner:

Runner profile:
- Level: ${profile.level}
- Current weekly mileage: ${profile.weeklyMileage} miles/week
- Available days/week: ${profile.daysPerWeek}
- Preferred long run day: ${profile.preferredLongRunDay}
- ${raceInfo}
- ${goalNote}
- ${injuryNote}
${crossNote ? `- ${crossNote}` : ''}

Training paces:
- Easy: ${paces.easy}
- Long run: ${paces.long}
- Marathon pace: ${paces.marathon}
- Tempo: ${paces.tempo}
- Intervals: ${paces.interval}

Return ONLY a JSON object with this exact structure:
{
  "peakWeekMiles": <number>,
  "weeks": [
    {
      "weekNumber": 1,
      "focus": "Base building",
      "totalMiles": <number>,
      "days": [
        {
          "dayOfWeek": 0,
          "type": "rest" | "easy" | "tempo" | "long" | "interval" | "cross" | "strength",
          "title": "Rest day",
          "description": "Full rest or gentle walking",
          "distance": null,
          "duration": null,
          "paceTarget": null,
          "notes": null
        }
      ]
    }
  ]
}

Rules:
- dayOfWeek: 0=Sunday, 1=Monday, ... 6=Saturday
- Include exactly 7 days per week
- Place the long run on ${profile.preferredLongRunDay}
- Build mileage by ~10% per week, with cutback weeks every 4 weeks
- Include taper in the final 2 weeks
- Keep ALL descriptions under 80 characters
- Keep ALL notes under 60 characters or set to null
- Distance in miles (numbers only)
- Duration in minutes (numbers only)`;
}

function assemblePlan(
  profile: RunnerProfile,
  planData: { peakWeekMiles: number; weeks: any[] },
  totalWeeks: number,
  racePaces: ReturnType<typeof calculatePaces>
): TrainingPlan {
  const planId = Date.now().toString(36);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + (1 - startDate.getDay())); // next Monday

  const weeks: TrainingWeek[] = planData.weeks.map((w: any, wi: number) => {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + wi * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const days = (w.days || []).map((d: any) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + d.dayOfWeek);

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
        dayOfWeek: d.dayOfWeek,
        weekNumber: w.weekNumber,
        workout,
        completed: false,
      };
    });

    return {
      weekNumber: w.weekNumber,
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
