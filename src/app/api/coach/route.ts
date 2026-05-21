import { NextRequest, NextResponse } from 'next/server';
import { TrainingPlan } from '@/lib/types';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
  }

  const { message, plan, history } = await req.json();

  const planContext = plan ? `
Runner: ${plan.profile.name}, ${plan.profile.level} level
Current plan: ${plan.totalWeeks}-week marathon training
Peak week: ${plan.peakWeekMiles} miles
Goal: ${plan.profile.goalType === 'time' ? `Finish in ${plan.profile.goalTime}` : plan.profile.goalType === 'pr' ? 'New PR' : 'Finish'}
Race: ${plan.profile.raceName || 'Target marathon'}${plan.profile.raceDate ? ` on ${plan.profile.raceDate}` : ''}
Training paces — Easy: ${plan.racePaces.easy}, Tempo: ${plan.racePaces.tempo}, Marathon: ${plan.racePaces.marathon}
Injuries: ${plan.profile.injuries.join(', ') || 'none'}
Cross-training: ${plan.profile.crossTraining.join(', ') || 'none'}
` : 'No training plan loaded yet.';

  const system = `You are an expert marathon running coach. You are friendly, encouraging, and science-based.
You give concise, practical advice — never more than 3 short paragraphs unless specifically asked for more detail.
You know Jack Daniels' training principles, proper periodization, injury prevention, and race nutrition.

Current runner context:
${planContext}

Guidelines:
- Be specific and actionable
- Reference their actual paces and plan when relevant
- If they describe a pain/injury, always recommend seeing a professional but also give interim guidance
- For race strategy questions, use their goal time and training paces
- Encourage but be honest about realistic expectations
- End with a brief motivational note or practical next step`;

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
        max_tokens: 600,
        system,
        messages: [
          ...(history || []),
          { role: 'user', content: message },
        ],
      }),
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Sorry, I had trouble responding. Please try again.';
    return NextResponse.json({ reply });

  } catch (error) {
    return NextResponse.json({ error: 'Coach unavailable' }, { status: 500 });
  }
}
