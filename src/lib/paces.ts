import { RacePaces, RunnerProfile } from './types';

// Parse time string "h:mm:ss" or "mm:ss" to seconds
export function parseTimeToSeconds(time: string): number {
  const parts = time.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

// Format seconds to "h:mm:ss"
export function formatSecondsToTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Format pace in sec/mile to "m:ss/mi"
export function formatPace(secsPerMile: number): string {
  const m = Math.floor(secsPerMile / 60);
  const s = Math.round(secsPerMile % 60);
  return `${m}:${String(s).padStart(2, '0')}/mi`;
}

// Jack Daniels VDOT approximation
// Returns VDOT from a race result
function calcVDOT(distanceMiles: number, timeSeconds: number): number {
  const v = distanceMiles * 1609.34 / (timeSeconds / 60); // m/min
  const vO2 = -4.6 + 0.182258 * v + 0.000104 * v * v;
  const pct = 0.8 + 0.1894393 * Math.exp(-0.012778 * timeSeconds / 60) + 0.2989558 * Math.exp(-0.1932605 * timeSeconds / 60);
  return vO2 / pct;
}

// Returns training paces from VDOT
function vdotToPaces(vdot: number): {
  easy: number; marathon: number; tempo: number; interval: number;
} {
  // These multipliers approximate Jack Daniels' training zones (sec/mile)
  // Marathon pace from VDOT: approximate via VO2max formula
  const marathonVelocity = (vdot * 0.93 + 4.6) / 0.000104; // rough solve of quadratic
  const mV = (-0.182258 + Math.sqrt(0.182258 ** 2 + 4 * 0.000104 * (vdot * 0.93 + 4.6))) / (2 * 0.000104);
  const marathonSecPerMile = 1609.34 / (mV / 60);

  return {
    easy: marathonSecPerMile * 1.18,
    marathon: marathonSecPerMile,
    tempo: marathonSecPerMile * 0.92,
    interval: marathonSecPerMile * 0.84,
  };
}

// Estimate VDOT from profile (if no race time, estimate from level+mileage)
function estimateVDOT(profile: RunnerProfile): number {
  if (profile.recentRaceTime) {
    const distanceMap: Record<string, number> = {
      marathon: 26.2, half: 13.1, ultra: 31, custom: 26.2
    };
    const dist = distanceMap[profile.recentRaceDistance || 'marathon'];
    const secs = parseTimeToSeconds(profile.recentRaceTime);
    if (secs > 0) return calcVDOT(dist, secs);
  }

  // Estimate from level and mileage
  const levelBase: Record<string, number> = {
    beginner: 35,
    intermediate: 45,
    advanced: 55,
  };
  const base = levelBase[profile.level];
  const mileageBonus = Math.min((profile.weeklyMileage - 20) * 0.15, 8);
  return base + mileageBonus;
}

export function calculatePaces(profile: RunnerProfile): RacePaces {
  const vdot = estimateVDOT(profile);
  const paces = vdotToPaces(vdot);

  // Easy pace range (+/- 15 sec)
  const easyLow = Math.round(paces.easy - 15);
  const easyHigh = Math.round(paces.easy + 15);

  return {
    easy: `${formatPace(easyLow)}–${formatPace(easyHigh)}`,
    marathon: formatPace(Math.round(paces.marathon)),
    tempo: formatPace(Math.round(paces.tempo)),
    interval: formatPace(Math.round(paces.interval)),
    long: `${formatPace(Math.round(paces.easy))}–${formatPace(Math.round(paces.easy + 20))}`,
  };
}

// Calculate finish time estimate from pace
export function estimateFinishTime(paceSecPerMile: number, distanceMiles: number): string {
  return formatSecondsToTime(Math.round(paceSecPerMile * distanceMiles));
}

// Add minutes to a pace string like "8:30/mi"
export function addMinutesToPace(paceStr: string, minutes: number): string {
  const clean = paceStr.replace('/mi', '').replace('/km', '');
  const secs = parseTimeToSeconds(clean) + minutes * 60;
  return formatPace(secs);
}
