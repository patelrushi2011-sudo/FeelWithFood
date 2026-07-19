// FIT FOOD — Exercises Database (Static)
// Used by exercise controller for search and category filtering

module.exports = [
  // === CARDIO ===
  { name: "Running (Outdoor)", category: "Cardio", met: 9.8, icon: "🏃" },
  { name: "Running (Treadmill)", category: "Cardio", met: 9.0, icon: "🏃" },
  { name: "Jogging", category: "Cardio", met: 7.0, icon: "🏃" },
  { name: "Walking (Brisk)", category: "Cardio", met: 4.3, icon: "🚶" },
  { name: "Walking (Moderate)", category: "Cardio", met: 3.5, icon: "🚶" },
  { name: "Cycling (Outdoor)", category: "Cardio", met: 8.0, icon: "🚴" },
  { name: "Cycling (Stationary)", category: "Cardio", met: 7.0, icon: "🚴" },
  { name: "Swimming (Laps)", category: "Cardio", met: 8.0, icon: "🏊" },
  { name: "Swimming (Recreational)", category: "Cardio", met: 6.0, icon: "🏊" },
  { name: "Jump Rope / Skipping", category: "Cardio", met: 11.0, icon: "🪢" },
  { name: "Rowing Machine", category: "Cardio", met: 7.0, icon: "🚣" },
  { name: "Elliptical Trainer", category: "Cardio", met: 6.0, icon: "⚙️" },
  { name: "Stair Climbing", category: "Cardio", met: 9.0, icon: "🪜" },
  { name: "High Knees", category: "Cardio", met: 8.0, icon: "🦵" },
  { name: "Jumping Jacks", category: "Cardio", met: 8.0, icon: "⭐" },

  // === HIIT & CIRCUIT ===
  { name: "HIIT (High Intensity)", category: "HIIT", met: 12.0, icon: "🔥" },
  { name: "Tabata Training", category: "HIIT", met: 12.0, icon: "⚡" },
  { name: "Circuit Training", category: "HIIT", met: 8.0, icon: "🔄" },
  { name: "Burpees", category: "HIIT", met: 10.0, icon: "💪" },
  { name: "Mountain Climbers", category: "HIIT", met: 9.0, icon: "🏔️" },
  { name: "Box Jumps", category: "HIIT", met: 10.0, icon: "📦" },
  { name: "Sprints (Interval)", category: "HIIT", met: 14.0, icon: "⚡" },

  // === STRENGTH TRAINING ===
  { name: "Weight Training (General)", category: "Strength", met: 6.0, icon: "🏋️" },
  { name: "Bench Press", category: "Strength", met: 5.0, icon: "🏋️" },
  { name: "Deadlift", category: "Strength", met: 6.0, icon: "🏋️" },
  { name: "Squat", category: "Strength", met: 5.0, icon: "🦵" },
  { name: "Pull-Ups / Chin-Ups", category: "Strength", met: 8.0, icon: "⬆️" },
  { name: "Push-Ups", category: "Strength", met: 4.5, icon: "💪" },
  { name: "Barbell Rows", category: "Strength", met: 5.5, icon: "🏋️" },
  { name: "Overhead Press", category: "Strength", met: 5.0, icon: "🏋️" },
  { name: "Bicep Curls", category: "Strength", met: 3.5, icon: "💪" },
  { name: "Tricep Dips", category: "Strength", met: 4.0, icon: "💪" },
  { name: "Lunges", category: "Strength", met: 4.0, icon: "🦵" },
  { name: "Plank", category: "Strength", met: 4.0, icon: "🟫" },
  { name: "Sit-Ups / Crunches", category: "Strength", met: 5.0, icon: "💪" },
  { name: "Leg Press", category: "Strength", met: 5.0, icon: "🏋️" },
  { name: "Lat Pulldown", category: "Strength", met: 5.5, icon: "🏋️" },

  // === YOGA & FLEXIBILITY ===
  { name: "Yoga (Power)", category: "Yoga", met: 4.0, icon: "🧘" },
  { name: "Yoga (Hatha)", category: "Yoga", met: 2.5, icon: "🧘" },
  { name: "Surya Namaskar", category: "Yoga", met: 3.5, icon: "☀️" },
  { name: "Stretching", category: "Yoga", met: 2.5, icon: "🤸" },
  { name: "Pilates", category: "Yoga", met: 3.5, icon: "🤸" },
  { name: "Meditation", category: "Yoga", met: 1.0, icon: "🧘" },

  // === SPORTS ===
  { name: "Cricket (Batting / Bowling)", category: "Sports", met: 5.0, icon: "🏏" },
  { name: "Football / Soccer", category: "Sports", met: 10.0, icon: "⚽" },
  { name: "Basketball", category: "Sports", met: 8.0, icon: "🏀" },
  { name: "Badminton", category: "Sports", met: 7.0, icon: "🏸" },
  { name: "Tennis", category: "Sports", met: 8.0, icon: "🎾" },
  { name: "Table Tennis", category: "Sports", met: 4.0, icon: "🏓" },
  { name: "Volleyball", category: "Sports", met: 4.0, icon: "🏐" },
  { name: "Kabaddi", category: "Sports", met: 8.0, icon: "🤼" },
  { name: "Swimming (Water Polo)", category: "Sports", met: 10.0, icon: "🤽" },

  // === FUNCTIONAL & MARTIAL ARTS ===
  { name: "Crossfit", category: "Functional", met: 10.0, icon: "🔥" },
  { name: "Kettlebell Training", category: "Functional", met: 9.0, icon: "⚖️" },
  { name: "TRX / Suspension Training", category: "Functional", met: 7.0, icon: "🪢" },
  { name: "Boxing", category: "Martial Arts", met: 9.0, icon: "🥊" },
  { name: "Kickboxing", category: "Martial Arts", met: 9.5, icon: "🥊" },
  { name: "Karate", category: "Martial Arts", met: 6.0, icon: "🥋" },
  { name: "Wrestling / Kushti", category: "Martial Arts", met: 8.0, icon: "🤼" },

  // === DAILY ACTIVITIES ===
  { name: "Gardening", category: "Daily Activity", met: 3.5, icon: "🌱" },
  { name: "Cleaning (House)", category: "Daily Activity", met: 3.0, icon: "🧹" },
  { name: "Dancing (Bollywood)", category: "Daily Activity", met: 5.5, icon: "💃" },
  { name: "Dancing (Zumba)", category: "Daily Activity", met: 6.5, icon: "💃" },
  { name: "Hiking", category: "Daily Activity", met: 6.0, icon: "🥾" },
  { name: "Carrying Groceries", category: "Daily Activity", met: 3.5, icon: "🛍️" },
];
