import { AppState, LoggedRun, TrainingPlan, RunnerProfile, Shoe } from './types';

const KEY = 'marathon-planner-v1';

function load(): AppState {
  if (typeof window === 'undefined') return defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    return JSON.parse(raw);
  } catch {
    return defaultState();
  }
}

function save(state: AppState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    console.warn('Could not save to localStorage');
  }
}

function defaultState(): AppState {
  return {
    profile: null,
    plan: null,
    logs: [],
    shoes: [],
    currentStep: 'landing',
  };
}

export const storage = {
  load,
  save,

  getState(): AppState {
    return load();
  },

  setState(update: Partial<AppState>) {
    const current = load();
    const next = { ...current, ...update };
    save(next);
    return next;
  },

  saveProfile(profile: RunnerProfile) {
    return storage.setState({ profile });
  },

  savePlan(plan: TrainingPlan) {
    return storage.setState({ plan, currentStep: 'dashboard' });
  },

  addLog(log: LoggedRun) {
    const state = load();
    const logs = [log, ...state.logs];
    return storage.setState({ logs });
  },

  updateLog(id: string, updates: Partial<LoggedRun>) {
    const state = load();
    const logs = state.logs.map(l => l.id === id ? { ...l, ...updates } : l);
    return storage.setState({ logs });
  },

  deleteLog(id: string) {
    const state = load();
    const logs = state.logs.filter(l => l.id !== id);
    return storage.setState({ logs });
  },

  markWorkoutComplete(date: string, completed: boolean) {
    const state = load();
    if (!state.plan) return state;
    const weeks = state.plan.weeks.map(week => ({
      ...week,
      days: week.days.map(day =>
        day.date === date ? { ...day, completed } : day
      ),
    }));
    const plan = { ...state.plan, weeks };
    return storage.setState({ plan });
  },

  addShoe(shoe: Shoe) {
    const state = load();
    return storage.setState({ shoes: [...state.shoes, shoe] });
  },

  updateShoe(id: string, miles: number) {
    const state = load();
    const shoes = state.shoes.map(s => s.id === id ? { ...s, miles } : s);
    return storage.setState({ shoes });
  },

  setStep(step: AppState['currentStep']) {
    return storage.setState({ currentStep: step });
  },

  clear() {
    if (typeof window !== 'undefined') localStorage.removeItem(KEY);
    return defaultState();
  },
};
