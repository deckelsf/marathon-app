import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Marathon Planner — AI-powered training plans',
  description: 'Build a personalized marathon training plan powered by AI. Export to Google Calendar or Apple Calendar. Track your progress. Chat with your AI coach.',
  keywords: 'marathon training, running plan, training plan, AI coach, race training',
  openGraph: {
    title: 'Marathon Planner',
    description: 'AI-powered marathon training plans, calendar export, and progress tracking.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
