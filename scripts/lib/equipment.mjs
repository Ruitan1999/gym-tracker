/**
 * Which kit an exercise is done with, as the picker's filter knows it.
 *
 * The upstream dataset has twenty-odd equipment values; a filter row can't, so
 * they are folded onto a short fixed set. The library's own hand-written
 * entries (the ones with no dataset row) are named outright below.
 */

export const EQUIPMENT = [
  'machine', 'cable', 'dumbbell', 'barbell', 'bodyweight', 'smith', 'band', 'kettlebell', 'other',
];

const FROM_DATASET = {
  'body weight': 'bodyweight',
  // Bodyweight with a plate or belt added is still a bodyweight movement.
  weighted: 'bodyweight',
  'leverage machine': 'machine',
  'sled machine': 'machine',
  'skierg machine': 'machine',
  'elliptical machine': 'machine',
  'stepmill machine': 'machine',
  'stationary bike': 'machine',
  'upper body ergometer': 'machine',
  cable: 'cable',
  dumbbell: 'dumbbell',
  barbell: 'barbell',
  'olympic barbell': 'barbell',
  'ez barbell': 'barbell',
  'trap bar': 'barbell',
  'smith machine': 'smith',
  band: 'band',
  'resistance band': 'band',
  kettlebell: 'kettlebell',
  // Partner-assisted stretches, balls, rollers and the like.
  assisted: 'other',
  'medicine ball': 'other',
  'stability ball': 'other',
  'bosu ball': 'other',
  rope: 'other',
  roller: 'other',
  'wheel roller': 'other',
  hammer: 'other',
  tire: 'other',
};

export function equipmentFromDataset(value) {
  const mapped = FROM_DATASET[String(value).toLowerCase()];
  if (!mapped) throw new Error(`Unmapped dataset equipment: "${value}"`);
  return mapped;
}

/** The entries predating the import, which no dataset row describes. */
const HAND_WRITTEN = {
  'Bench Press': 'barbell', 'Overhead Press': 'barbell', 'Incline Dumbbell Press': 'dumbbell',
  Dips: 'bodyweight', 'Tricep Pushdown': 'cable', 'Incline Barbell Press': 'barbell',
  'Decline Bench Press': 'barbell', 'Dumbbell Bench Press': 'dumbbell',
  'Dumbbell Shoulder Press': 'dumbbell', 'Arnold Press': 'dumbbell', 'Lateral Raise': 'dumbbell',
  'Front Raise': 'dumbbell', 'Cable Fly': 'cable', 'Dumbbell Fly': 'dumbbell',
  'Incline Dumbbell Fly': 'dumbbell', 'Pec Deck': 'machine', 'Machine Chest Press': 'machine',
  'Machine Shoulder Press': 'machine', 'Close-Grip Bench Press': 'barbell', 'Skull Crusher': 'barbell',
  'Overhead Tricep Extension': 'dumbbell', 'Tricep Kickback': 'dumbbell',
  'Cable Lateral Raise': 'cable', 'Reverse Pec Deck': 'machine', 'Landmine Press': 'barbell',
  'Push-up': 'bodyweight', 'Diamond Push-up': 'bodyweight', 'Pike Push-up': 'bodyweight',
  'Chest Dip': 'bodyweight', 'Smith Machine Bench Press': 'smith',
  'Barbell Row': 'barbell', 'Pull-up': 'bodyweight', 'Lat Pulldown': 'cable', 'Face Pull': 'cable',
  'Barbell Curl': 'barbell', 'Dumbbell Row': 'dumbbell', 'Seated Cable Row': 'cable',
  'T-Bar Row': 'barbell', 'Chin-up': 'bodyweight', 'Pendlay Row': 'barbell',
  'Meadows Row': 'barbell', 'Chest-Supported Row': 'dumbbell', 'Cable Pullover': 'cable',
  'Straight-Arm Pulldown': 'cable', 'Machine Row': 'machine', 'Dumbbell Curl': 'dumbbell',
  'Hammer Curl': 'dumbbell', 'Preacher Curl': 'barbell', 'Incline Dumbbell Curl': 'dumbbell',
  'Cable Curl': 'cable', 'Concentration Curl': 'dumbbell', 'EZ-Bar Curl': 'barbell',
  'Reverse Curl': 'barbell', 'Spider Curl': 'dumbbell', 'Wrist Curl': 'barbell',
  'Reverse Wrist Curl': 'barbell', Shrug: 'barbell', 'Dumbbell Shrug': 'dumbbell',
  'Rack Pull': 'barbell', 'Inverted Row': 'bodyweight',
  Squat: 'barbell', Deadlift: 'barbell', 'Leg Press': 'machine', 'Romanian Deadlift': 'barbell',
  'Leg Curl': 'machine', 'Calf Raise': 'bodyweight', 'Front Squat': 'barbell',
  'Bulgarian Split Squat': 'dumbbell', 'Goblet Squat': 'dumbbell', 'Hack Squat': 'machine',
  'Leg Extension': 'machine', 'Seated Leg Curl': 'machine', 'Lying Leg Curl': 'machine',
  'Hip Thrust': 'barbell', 'Glute Bridge': 'bodyweight', 'Sumo Deadlift': 'barbell',
  'Walking Lunge': 'dumbbell', 'Reverse Lunge': 'dumbbell', 'Step-up': 'dumbbell',
  'Seated Calf Raise': 'machine', 'Standing Calf Raise': 'machine', 'Donkey Calf Raise': 'machine',
  'Hip Adductor Machine': 'machine', 'Hip Abductor Machine': 'machine',
  'Cable Pull-Through': 'cable', 'Good Morning': 'barbell', 'Belt Squat': 'machine',
  'Smith Machine Squat': 'smith', 'Sissy Squat': 'bodyweight', 'Nordic Hamstring Curl': 'bodyweight',
  'Box Squat': 'barbell', 'Pause Squat': 'barbell', 'Single-Leg Leg Press': 'machine',
  'Glute Kickback Machine': 'machine', 'Pistol Squat': 'bodyweight',
  Plank: 'bodyweight', 'Cable Crunch': 'cable', 'Hanging Leg Raise': 'bodyweight',
  'Ab Wheel Rollout': 'other', Crunch: 'bodyweight', 'Bicycle Crunch': 'bodyweight',
  'Russian Twist': 'bodyweight', 'Side Plank': 'bodyweight', 'Mountain Climber': 'bodyweight',
  'Dead Bug': 'bodyweight', 'V-up': 'bodyweight', 'Toe Touch': 'bodyweight',
  'Pallof Press': 'cable', Woodchop: 'cable', 'Decline Sit-up': 'bodyweight',
  'Dragon Flag': 'bodyweight', 'L-Sit': 'bodyweight', 'Hanging Knee Raise': 'bodyweight',
  'Leg Raise': 'bodyweight', 'Flutter Kick': 'bodyweight', 'Hollow Body Hold': 'bodyweight',
  'Back Extension': 'bodyweight', 'Reverse Hyperextension': 'machine', Superman: 'bodyweight',
  'Bird Dog': 'bodyweight',
  Treadmill: 'machine', 'Rowing Machine': 'machine', 'Stationary Bike': 'machine',
  Elliptical: 'machine', 'Stair Climber': 'machine', 'Jump Rope': 'other', 'Battle Ropes': 'other',
  'Box Jump': 'bodyweight', Burpee: 'bodyweight', 'Kettlebell Swing': 'kettlebell',
  'Assault Bike': 'machine', 'Sled Push': 'machine', 'Sled Pull': 'machine',
  "Farmer's Walk": 'dumbbell',
};

const byLowerName = new Map(Object.entries(HAND_WRITTEN).map(([n, e]) => [n.toLowerCase(), e]));

/** For an entry no dataset row describes, or undefined if it isn't one named above. */
export function equipmentForHandWritten(name) {
  return byLowerName.get(name.toLowerCase());
}
