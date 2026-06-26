// Curated YouTube video IDs for common exercises (verified via search).
// For anything not in this map, we fall back to a creator-scoped channel search
// URL — opens YouTube directly to a trusted creator's videos for that exercise,
// where the first result is almost always the canonical form video.

const VIDEO_IDS: Record<string, string> = {
  // Compound lifts
  'Barbell Bench Press':        'vcBig73ojpE', // Jeff Nippard
  'Incline Dumbbell Press':     'vcBig73ojpE', // Bench technique applies
  'Dumbbell Bench Press':       'vcBig73ojpE',
  'Back Squat':                 'bEv6CCg2BC8', // Jeff Nippard
  'Front Squat':                'bEv6CCg2BC8',
  'Deadlift':                   'WP0IFHkkRZ0', // Squat University + Martins Licis
  'Sumo Deadlift':              'WP0IFHkkRZ0',
  'Standing Overhead Press':    '_RlRDWO2jfg', // Jeff Nippard
  'Dumbbell Shoulder Press':    '_RlRDWO2jfg',
  'Barbell Row':                'axoeDmW0oAY', // Jeff Nippard Pendlay/Helms
  'Chest-Supported Row':        'axoeDmW0oAY',
  'Pull-ups':                   'sIvJTfGxdFo', // Athlean-X
  'Pull-ups (or Lat Pulldown)': 'sIvJTfGxdFo',
  'Weighted Pull-ups (or Lat Pulldown)': 'sIvJTfGxdFo',
  'Romanian Deadlift':          'Q5vwsJFwhyg', // Jeff Nippard
  'Stiff-Leg Deadlift':         'Q5vwsJFwhyg',
  'Dumbbell Romanian Deadlift': 'Q5vwsJFwhyg',
};

// Default creator to search per movement type — used when no curated video exists.
function creatorFor(exerciseName: string): string {
  const n = exerciseName.toLowerCase();
  if (n.includes('glute') || n.includes('hip thrust') || n.includes('kickback') || n.includes('curtsy')) {
    return '@BretContreras1';        // glute-guy
  }
  if (n.includes('squat') || n.includes('deadlift') || n.includes('hinge') || n.includes('good morning')) {
    return '@SquatUniversityOfficial';
  }
  if (n.includes('plank') || n.includes('core') || n.includes('crunch') || n.includes('ab ')) {
    return '@athleanx';              // Athlean-X for core
  }
  return '@JeffNippard';             // Default — science-based hypertrophy
}

/**
 * Returns a YouTube URL that opens directly into a useful place:
 * - if we have a curated video ID for this exercise, opens the actual video
 * - otherwise opens a creator's channel search filtered to this exercise
 */
export function youtubeUrlFor(exerciseName: string): string {
  // Strip parenthetical alternatives — e.g. "Pull-ups (or Lat Pulldown)" → "Pull-ups"
  const cleanedName = exerciseName.replace(/\s*\(.*?\)\s*/g, '').trim();

  const curatedId = VIDEO_IDS[exerciseName] || VIDEO_IDS[cleanedName];
  if (curatedId) {
    return `https://www.youtube.com/watch?v=${curatedId}`;
  }

  // Fallback: creator-scoped channel search
  const creator = creatorFor(cleanedName);
  const query = encodeURIComponent(`${cleanedName} form`);
  return `https://www.youtube.com/${creator}/search?query=${query}`;
}

export function hasCuratedVideo(exerciseName: string): boolean {
  const cleanedName = exerciseName.replace(/\s*\(.*?\)\s*/g, '').trim();
  return Boolean(VIDEO_IDS[exerciseName] || VIDEO_IDS[cleanedName]);
}
