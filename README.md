# 💪 Fitness Tracker

A full-stack fitness tracking app with a rank system, workout logging and nutrition tracking.

Python · Flask · React · Firebase (Auth + Firestore) · Git

--
```
fitness-tracker/
├── backend/               # Python Flask REST API
│   ├── app.py             # All API routes
│   ├── firebase_config.py # Firebase Admin SDK init
│   ├── requirements.txt
│   └── .env.example
├── frontend/              # React app
│   ├── src/
│   │   ├── firebase.js    # Firebase client SDK + API helper
│   │   ├── AuthContext.js # Auth state + hooks
│   │   └── App.jsx        # Main app (dashboard, workouts, nutrition, ranks)
│   └── .env.example
└── .gitignore
```

---



## API Endpoints

| Method | Endpoint           | Description                  | Auth |
|--------|--------------------|------------------------------|------|
| GET    | /api/health        | Health check                 | ❌   |
| GET    | /api/profile       | Get user profile + XP        | ✅   |
| PUT    | /api/profile       | Update profile               | ✅   |
| GET    | /api/workouts      | List workouts (newest first) | ✅   |
| POST   | /api/workouts      | Log workout, earn XP         | ✅   |
| DELETE | /api/workouts/:id  | Delete a workout             | ✅   |
| GET    | /api/nutrition     | Last 7 days of nutrition     | ✅   |
| POST   | /api/nutrition     | Log today's macros           | ✅   |
| GET    | /api/leaderboard   | Top 10 users by XP           | ✅   |

All protected endpoints require an `Authorization: Bearer <firebase_id_token>` header.

---

## Rank System

| Rank      | XP Required | Icon |
|-----------|-------------|------|
| Rookie    | 0           | 🥉   |
| Athlete   | 500         | 🥈   |
| Champion  | 1,500       | 🥇   |
| Elite     | 3,000       | 💎   |
| Legend    | 6,000       | 👑   |

XP is awarded per workout based on type and duration:
- HIIT: 100 pts / 30 min
- Strength: 80 pts / 30 min
- Sports: 70 pts / 30 min
- Cardio: 60 pts / 30 min
- Yoga: 40 pts / 30 min

---


