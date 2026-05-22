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

  // Calculate weeks
  let totalWeeks = profile.planWeeks || 16;
  if (profile.raceDate) {
    const raceDate = new Date(profile.raceDate);
    const today = new Date();
    const diffWeeks = Math.round((raceDate.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000));
    totalWeeks = Math.max(8, Math.min(diffWeeks, 24));
  }

  const racePaces = calculatePaces(profile);

  // Build a simpler, faster prompt
  const prompt = `Create a ${totalWeeks}-week marathon training plan as JSON.

Runner: ${profile.level} level, ${profile.weeklyMileage} mi/week currently, ${profile.daysPerWeek} days/week available, long run on ${profile.preferredLongRunDay}.
Goal: ${profile.goalType === 'time' ? `finish in ${profile.goalTime}` : profile.goalType === 'pr' ? 'new PR' : 'finish'}.
Paces: easy ${racePaces.easy}, tempo ${racePaces.tempo}, long ${racePaces.long}, interval ${racePaces.interval}.
${profile.injuries.length ? `Injuries: ${profile.injuries.join(', ')}.` : ''}
${profile.crossTraining.length ? `Cross-training: ${profile.crossTraining.join(', ')}.` : ''}

Return ONLY valid JSON, no other text:
{
  "peakWeekMiles": 45,
  "weeks": [
    {
      "weekNumber": 1,
      "focus": "Base building",
      "totalMiles": 30,
      "days": [
        {"dayOfWeek": 0, "type": "rest", "title": "Rest", "description": "Rest day", "distance": null, "duration": null, "paceTarget": null},
        {"dayOfWeek": 1, "type": "easy", "title": "Easy run", "description": "Easy conversational pace", "distance": 5, "duration": 55, "paceTarget": "${racePaces.easy}"},
        {"dayOfWeek": 2, "type": "rest", "title": "Rest", "description": "Rest or cross-train", "distance": null, "duration": null, "paceTarget": null},
        {"dayOfWeek": 3, "type": "tempo", "title": "Tempo run", "description": "Comfortably hard effort", "distance": 6, "duration": 54, "paceTarget": "${racePaces.tempo}"},
        {"dayOfWeek": 4, "type": "easy", "title": "Easy run", "description": "Recovery pace", "distance": 4, "duration": 44, "paceTarget": "${racePaces.easy}"},
        {"dayOfWeek": 5, "type": "rest", "title": "Rest", "description": "Rest day", "distance": null, "duration": null, "paceTarget": null},
        {"dayOfWeek": 6, "type": "long", "title": "Long run", "description": "Easy long run", "distance": 12, "duration": 132, "paceTarget": "${racePaces.long}"}
      ]
    }
  ]
}

Rules:
- Return exactly ${totalWeeks} weeks
- Every week has exactly 7 days (dayOfWeek 0-6)
- Long run always on dayOfWeek ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].indexOf(profile.preferredLongRunDay)}
- Increase mileage ~10% per week, cutback week every 4th week (reduce 20%)
- Final 2 weeks: taper (reduce volume)
- Keep descriptions SHORT (under 60 chars)
- No notes field needed`;

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
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
        system: 'You are a marathon coach. Return ONLY valid JSON with no markdown, no explanation, no extra text. Just the raw JSON object.',
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Claude API error:', data.error);
      return NextResponse.json({ error: data.error.message || 'Claude API error' }, { status: 500 });
    }

    const text = data.content?.[0]?.text || '';
    console.log('Response length:', text.length);
    console.log('Response start:', text.slice(0, 100));

    // Extract JSON - find first { and last }
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      console.error('No JSON found in response:', text.slice(0, 300));
      return NextResponse.json({ error: 'No JSON in response', raw: text.slice(0, 300) }, { status: 500 });
    }

    const jsonStr = text.slice(jsonStart, jsonEnd + 1);
    
    let planData;
    try {
      planData = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr);
      console.error('JSON string start:', jsonStr.slice(0, 300));
      return NextResponse.json({ error: 'Failed to parse JSON', raw: jsonStr.slice(0, 300) }, { status: 500 });
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
  // Start next Monday
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
