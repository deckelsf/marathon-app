# 🏃 Marathon Planner

An AI-powered marathon training plan builder with calendar export, progress tracking, and an AI running coach.

## Features

- **Personalized plan generation** — AI builds a periodized training plan based on your experience, goals, schedule, injuries, and cross-training
- **Any timeline** — 8 to 24+ weeks; input a specific race date and the plan reverse-engineers to peak on race day
- **Calendar export** — download a `.ics` file to add your entire training plan to Google Calendar, Apple Calendar, or Outlook, with full workout details in every event
- **Progress tracking** — log every run with distance, time, pace, and perceived effort; visualize weekly mileage
- **AI coach chat** — ask your AI coach anything: race strategy, nutrition, injury advice, missed runs, pacing
- **Pace calculator** — training paces calculated from your recent race times using Jack Daniels' VDOT method
- **Injury & cross-training aware** — flags concerns and adjusts plan intensity accordingly

## Getting Started

### Prerequisites

- Node.js 18+
- An Anthropic API key ([get one here](https://console.anthropic.com))

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/marathon-planner.git
cd marathon-planner

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add `ANTHROPIC_API_KEY` as an Environment Variable
4. Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + custom CSS variables |
| AI | Claude API (claude-sonnet-4) |
| Storage | localStorage (no database needed) |
| Calendar | Custom ICS generator |
| Fonts | DM Serif Display + Instrument Sans |
| Deployment | Vercel |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── generate-plan/route.ts   # AI plan generation endpoint
│   │   └── coach/route.ts           # AI coach chat endpoint
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── App.tsx                      # Main app shell + routing
│   ├── Landing.tsx                  # Landing page
│   ├── Onboarding.tsx               # Multi-step intake form
│   ├── PlanView.tsx                 # Weekly training plan view
│   ├── Progress.tsx                 # Run logging + progress charts
│   └── Coach.tsx                    # AI coach chat
├── lib/
│   ├── types.ts                     # All TypeScript types
│   ├── paces.ts                     # VDOT pace calculations
│   ├── calendar.ts                  # ICS calendar export
│   └── storage.ts                   # localStorage persistence
└── styles/
    └── globals.css                  # Design system + global styles
```

## How It Works

### Plan Generation
The app sends your runner profile to Claude via the `/api/generate-plan` endpoint. Claude uses Jack Daniels' training principles to build a periodized plan with proper base-building, speed work, long runs, and taper. Training paces are calculated using the VDOT method from your recent race times.

### Calendar Export
The entire training plan is converted to [iCalendar format](https://icalendar.org/) (`.ics`). Each workout becomes a calendar event with:
- Workout title and type
- Distance and duration
- Target pace
- Detailed description
- Coach tip (if applicable)

### AI Coach
The coach endpoint sends your question along with your full training context (current week, paces, goal, injuries) to Claude, which provides personalized advice.

## Roadmap

- [ ] Strava / Garmin auto-sync
- [ ] Shoe mileage tracker
- [ ] Plan adaptation (reschedule missed runs)
- [ ] PWA push notifications
- [ ] Race predictor
- [ ] Training groups / social features

## Contributing

PRs welcome! Please open an issue first for major changes.

## License

MIT
