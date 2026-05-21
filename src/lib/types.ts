export type RunnerLevel = 'beginner' | 'intermediate' | 'advanced';
export type GoalType = 'finish' | 'time' | 'pr';
export type WorkoutType = 'easy' | 'tempo' | 'long' | 'interval' | 'race' | 'rest' | 'cross' | 'strength';
export type RaceDistance = 'marathon' | 'half' | 'ultra' | 'custom';

export interface RunnerProfile {
  name: string;
  level: RunnerLevel;
  weeklyMileage: number;          // current weekly miles
  recentRaceTime?: string;        // e.g. "3:45:00"
  recentRaceDistance?: RaceDistance;
  daysPerWeek: number;
  preferredLongRunDay: string;    // 'Saturday' | 'Sunday' etc.
  injuries: string[];
  crossTraining: string[];        // e.g. ['cycling', 'swimming', 'strength']
  goalType: GoalType;
  goalTime?: string;              // e.g. "3:30:00" for time goal
  raceDate?: string;              // ISO date string
  raceName?: string;
  raceDistance: RaceDistance;
  planWeeks?: number;             // override if no race date
  notes?: string;
}

export interface Workout {
  id: string;
  type: WorkoutType;
  title: string;
  description: string;
  distance?: number;              // miles
  duration?: number;              // minutes
  paceTarget?: string;            // e.g. "8:30-9:00/mi"
  heartRateZone?: number;
  notes?: string;
}

export interface TrainingDay {
  date: string;                   // ISO date string
  dayOfWeek: number;              // 0=Sun
  weekNumber: number;
  workout: Workout;
  completed?: boolean;
  loggedRun?: LoggedRun;
}

export interface TrainingWeek {
  weekNumber: number;
  startDate: string;
  endDate: string;
  totalMiles: number;
  focus: string;                  // e.g. "Base building", "Peak week", "Taper"
  days: TrainingDay[];
}

export interface TrainingPlan {
  id: string;
  createdAt: string;
  profile: RunnerProfile;
  weeks: TrainingWeek[];
  totalWeeks: number;
  peakWeekMiles: number;
  racePaces: RacePaces;
}

export interface RacePaces {
  easy: string;
  marathon: string;
  tempo: string;
  interval: string;
  long: string;
}

export interface LoggedRun {
  id: string;
  date: string;
  distance: number;
  duration: number;               // minutes
  pace: string;                   // "8:45/mi"
  perceivedEffort: number;        // 1-10
  notes?: string;
  workoutId?: string;             // links to planned workout
}

export interface AppState {
  profile: RunnerProfile | null;
  plan: TrainingPlan | null;
  logs: LoggedRun[];
  shoes: Shoe[];
  currentStep: 'landing' | 'onboarding' | 'plan' | 'dashboard';
}

export interface Shoe {
  id: string;
  name: string;
  miles: number;
  addedAt: string;
  retiredAt?: string;
  notes?: string;
}
