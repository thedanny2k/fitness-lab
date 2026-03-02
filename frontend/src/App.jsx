import { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const RANKS = [
  { name: "Rookie",   min: 0,    max: 500,      color: "#8B5CF6", icon: "🥉", glow: "#8B5CF640" },
  { name: "Athlete",  min: 500,  max: 1500,     color: "#3B82F6", icon: "🥈", glow: "#3B82F640" },
  { name: "Champion", min: 1500, max: 3000,     color: "#10B981", icon: "🥇", glow: "#10B98140" },
  { name: "Elite",    min: 3000, max: 6000,     color: "#F59E0B", icon: "💎", glow: "#F59E0B40" },
  { name: "Legend",   min: 6000, max: Infinity, color: "#EF4444", icon: "👑", glow: "#EF444440" },
];

const WORKOUT_TYPES = [
  { id: "strength", label: "Strength", icon: "🏋️", pts: 80,  color: "#EF4444" },
  { id: "cardio",   label: "Cardio",   icon: "🏃", pts: 60,  color: "#3B82F6" },
  { id: "hiit",     label: "HIIT",     icon: "⚡", pts: 100, color: "#F59E0B" },
  { id: "yoga",     label: "Yoga",     icon: "🧘", pts: 40,  color: "#8B5CF6" },
  { id: "sports",   label: "Sports",   icon: "⚽", pts: 70,  color: "#10B981" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getLast7Days() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return {
      date: DAYS[d.getDay()],
      fullDate: d.toDateString(),
      calories: 0, protein: 0, carbs: 0, fat: 0, pts: 0,
    };
  });
}

const getRank = (xp) => RANKS.find((r) => xp >= r.min && xp < r.max) || RANKS[RANKS.length - 1];

// ─── localStorage helpers ─────────────────────────────────────────────────────
function load(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : fallback;
  } catch { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function initNutrition() {
  const saved = load("danny2k_nutrition", null);
  const fresh = getLast7Days();
  if (!saved) return fresh;
  return fresh.map((day) => {
    const match = saved.find((s) => s.fullDate === day.fullDate);
    return match || day;
  });
}

export default function FitnessTracker() {
  const [tab, setTab] = useState("dashboard");
  const [xp, setXp] = useState(() => load("danny2k_xp", 0));
  const [workouts, setWorkouts] = useState(() => load("danny2k_workouts", []));
  const [nutritionLog, setNutritionLog] = useState(initNutrition);
  const [showModal, setShowModal] = useState(false);
  const [newWorkout, setNewWorkout] = useState({ type: "strength", name: "", duration: 30 });
  const [newNutrition, setNewNutrition] = useState({ calories: "", protein: "", carbs: "", fat: "" });
  const [animateXP, setAnimateXP] = useState(false);
  const [streak, setStreak] = useState(() => load("danny2k_streak", 0));
  const [selectedDayIdx, setSelectedDayIdx] = useState(6);

  useEffect(() => { save("danny2k_xp", xp); }, [xp]);
  useEffect(() => { save("danny2k_workouts", workouts); }, [workouts]);
  useEffect(() => { save("danny2k_nutrition", nutritionLog); }, [nutritionLog]);
  useEffect(() => { save("danny2k_streak", streak); }, [streak]);

  const rank = getRank(xp);
  const nextRank = RANKS[RANKS.indexOf(rank) + 1];
  const rankProgress = nextRank ? ((xp - rank.min) / (nextRank.min - rank.min)) * 100 : 100;

  const selectedDay = nutritionLog[selectedDayIdx];
  const isToday = selectedDayIdx === 6;

  const workoutsForDay = workouts.filter((w) => w.dayLabel === selectedDay.fullDate);
  const totalWorkoutPts = workouts.reduce((a, w) => a + w.pts, 0);

  const logWorkout = () => {
    if (!newWorkout.name) return;
    const wtype = WORKOUT_TYPES.find((w) => w.id === newWorkout.type);
    const pts = Math.round((wtype.pts * newWorkout.duration) / 30);
    const entry = {
      ...newWorkout,
      dayLabel: selectedDay.fullDate,
      displayDate: isToday ? "Today" : selectedDay.date,
      pts,
      id: Date.now(),
    };
    setWorkouts([entry, ...workouts]);
    setXp((prev) => prev + pts);
    setAnimateXP(true);
    setTimeout(() => setAnimateXP(false), 1000);
    setNutritionLog((prev) =>
      prev.map((d, i) => i === selectedDayIdx ? { ...d, pts: d.pts + pts } : d)
    );
    setShowModal(false);
    setNewWorkout({ type: "strength", name: "", duration: 30 });
  };

  const deleteWorkout = (id) => {
    const w = workouts.find((w) => w.id === id);
    if (!w) return;
    setWorkouts((prev) => prev.filter((x) => x.id !== id));
    setXp((prev) => Math.max(0, prev - w.pts));
    setNutritionLog((prev) =>
      prev.map((d) => d.fullDate === w.dayLabel ? { ...d, pts: Math.max(0, d.pts - w.pts) } : d)
    );
  };

  const logNutrition = () => {
    const { calories, protein, carbs, fat } = newNutrition;
    if (!calories) return;
    setNutritionLog((prev) =>
      prev.map((d, i) =>
        i === selectedDayIdx
          ? { ...d, calories: +calories, protein: +protein, carbs: +carbs, fat: +fat }
          : d
      )
    );
    setNewNutrition({ calories: "", protein: "", carbs: "", fat: "" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0F", color: "#E8E8F0", fontFamily: "'DM Sans', system-ui, sans-serif", padding: "0 0 80px 0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .tab-btn { background: none; border: none; color: #666; cursor: pointer; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-family: inherit; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 3px; }
        .tab-btn.active { color: #fff; background: #1a1a2e; }
        .tab-btn span { font-size: 18px; }
        .card { background: #111118; border: 1px solid #1e1e2e; border-radius: 16px; padding: 20px; }
        .btn { border: none; border-radius: 10px; padding: 12px 20px; font-family: inherit; font-weight: 500; cursor: pointer; transition: all 0.2s; font-size: 14px; }
        .btn-primary { background: linear-gradient(135deg, #7C3AED, #4F46E5); color: white; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 20px #7C3AED44; }
        .btn-danger { background: #EF444422; color: #EF4444; border: 1px solid #EF444433; padding: 6px 10px; border-radius: 8px; font-size: 13px; cursor: pointer; font-family: inherit; transition: all 0.2s; }
        .btn-danger:hover { background: #EF444433; }
        .input { background: #1a1a28; border: 1px solid #2a2a3e; border-radius: 10px; padding: 10px 14px; color: #E8E8F0; font-family: inherit; font-size: 14px; width: 100%; outline: none; transition: border 0.2s; }
        .input:focus { border-color: #7C3AED; }
        .input::placeholder { color: #444; }
        .workout-card { background: #111118; border: 1px solid #1e1e2e; border-radius: 12px; padding: 14px 16px; display: flex; align-items: center; gap: 12px; transition: all 0.2s; margin-bottom: 8px; }
        .workout-card:hover { border-color: #2e2e4e; }
        .xp-pulse { animation: xpPulse 0.6s ease-out; }
        @keyframes xpPulse { 0% { transform: scale(1); } 50% { transform: scale(1.15); color: #F59E0B; } 100% { transform: scale(1); } }
        .rank-glow { animation: glowPulse 3s ease-in-out infinite; }
        @keyframes glowPulse { 0%,100% { box-shadow: 0 0 20px var(--glow); } 50% { box-shadow: 0 0 40px var(--glow), 0 0 60px var(--glow); } }
        .progress-bar { height: 8px; background: #1e1e2e; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 4px; transition: width 1s ease; }
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); z-index: 100; display: flex; align-items: flex-end; justify-content: center; }
        .modal { background: #0f0f1a; border: 1px solid #2a2a3e; border-radius: 24px 24px 0 0; padding: 28px; width: 100%; max-width: 480px; }
        .badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
        .day-btn { background: #111118; border: 1px solid #1e1e2e; border-radius: 10px; padding: 8px 0; color: #666; cursor: pointer; font-family: inherit; font-size: 12px; transition: all 0.2s; text-align: center; flex: 1; }
        .day-btn.active { background: #1a1a2e; border-color: #7C3AED66; color: #A78BFA; font-weight: 700; }
        .day-btn:hover:not(.active) { border-color: #2e2e4e; color: #aaa; }
        .empty-state { text-align: center; padding: 32px 20px; color: #444; }
        .empty-state .empty-icon { font-size: 36px; margin-bottom: 8px; }
        select.input { appearance: none; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "24px 20px 16px", background: "linear-gradient(180deg, #0d0d1a 0%, transparent 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "#555", letterSpacing: 3, textTransform: "uppercase" }}>Welcome back</div>
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.5 }}>Danny 2k's Fitness Lab 🧪</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ background: "#1a1a28", border: "1px solid #2a2a3e", borderRadius: 10, padding: "6px 12px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              🔥 <span style={{ color: "#F59E0B", fontWeight: 700 }}>{streak}</span>
            </div>
            <div className={`badge ${animateXP ? "xp-pulse" : ""}`} style={{ background: "#1a1a28", border: "1px solid #7C3AED44", fontSize: 13 }}>
              ⚡ <span style={{ color: "#A78BFA", fontWeight: 700 }}>{xp.toLocaleString()} XP</span>
            </div>
          </div>
        </div>

        {/* Rank Card */}
        <div className="rank-glow" style={{ "--glow": rank.glow, background: "linear-gradient(135deg, #111118, #1a1a2e)", border: `1px solid ${rank.color}44`, borderRadius: 16, padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: 2 }}>Current Rank</div>
              <div style={{ fontSize: 28, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2, color: rank.color }}>{rank.icon} {rank.name}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#666" }}>Next: {nextRank ? nextRank.name : "MAX"}</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{nextRank ? `${(nextRank.min - xp).toLocaleString()} XP` : "MAXED"}</div>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${rankProgress}%`, background: `linear-gradient(90deg, ${rank.color}, ${rank.color}cc)` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#555" }}>
            <span>{rank.min.toLocaleString()}</span>
            <span style={{ color: "#777" }}>{Math.round(rankProgress)}%</span>
            <span>{nextRank ? nextRank.min.toLocaleString() : "∞"}</span>
          </div>
        </div>

        {/* Day Selector */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Select Day</div>
          <div style={{ display: "flex", gap: 6 }}>
            {nutritionLog.map((d, i) => (
              <button key={i} className={`day-btn ${selectedDayIdx === i ? "active" : ""}`} onClick={() => setSelectedDayIdx(i)}>
                <div>{d.date}</div>
                <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>{i === 6 ? "Today" : i === 5 ? "Yday" : ""}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ padding: "0 20px" }}>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 12, color: "#555", textAlign: "center", paddingTop: 4 }}>
              {isToday ? "📅 Today — " : `📅 `}{selectedDay.fullDate}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "Workouts", value: workoutsForDay.length || "—",            icon: "🏋️", color: "#EF4444" },
                { label: "Day XP",   value: workoutsForDay.reduce((a,w)=>a+w.pts,0) || "—", icon: "📈", color: "#3B82F6" },
                { label: "Calories", value: selectedDay.calories || "—",             icon: "🍎", color: "#10B981" },
              ].map((s) => (
                <div key={s.label} className="card" style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22 }}>{s.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: "#888" }}>WEEKLY XP</div>
              {nutritionLog.every(d => d.pts === 0)
                ? <div className="empty-state"><div className="empty-icon">📊</div><div>Log your first workout to see XP here!</div></div>
                : <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={nutritionLog}>
                      <Bar dataKey="pts" fill="#7C3AED" radius={[4,4,0,0]} />
                      <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: 8, color: "#fff", fontSize: 12 }} cursor={{ fill: "#ffffff08" }} />
                    </BarChart>
                  </ResponsiveContainer>
              }
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                {isToday ? "Today's Activity" : `${selectedDay.date}'s Activity`}
              </div>
              {workoutsForDay.length === 0
                ? <div className="empty-state"><div className="empty-icon">🏃</div><div>No workouts logged {isToday ? "today" : "this day"}</div></div>
                : workoutsForDay.map((w) => {
                    const wt = WORKOUT_TYPES.find((t) => t.id === w.type);
                    return (
                      <div key={w.id} className="workout-card">
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: `${wt.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{wt.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{w.name}</div>
                          <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{w.duration} min</div>
                        </div>
                        <div style={{ color: "#A78BFA", fontWeight: 700, fontSize: 14, marginRight: 8 }}>+{w.pts}</div>
                        <button className="btn-danger" onClick={() => deleteWorkout(w.id)}>🗑️</button>
                      </div>
                    );
                  })
              }
            </div>
          </div>
        )}

        {/* WORKOUTS */}
        {tab === "workouts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>Workouts</div>
                <div style={{ fontSize: 12, color: "#555" }}>{isToday ? "Today" : selectedDay.fullDate}</div>
              </div>
              <button className="btn btn-primary" onClick={() => setShowModal("workout")}>+ Log</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {WORKOUT_TYPES.map((wt) => {
                const count = workoutsForDay.filter((w) => w.type === wt.id).length;
                return (
                  <div key={wt.id} className="card" style={{ borderColor: count > 0 ? `${wt.color}44` : "#1e1e2e", cursor: "pointer" }}
                    onClick={() => { setNewWorkout({ type: wt.id, name: wt.label + " Session", duration: 30 }); setShowModal("workout"); }}>
                    <div style={{ fontSize: 28 }}>{wt.icon}</div>
                    <div style={{ fontWeight: 600, marginTop: 6 }}>{wt.label}</div>
                    <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{count} today · {wt.pts} pts/30min</div>
                    <div style={{ height: 3, borderRadius: 2, background: wt.color, width: count > 0 ? "100%" : "20%", marginTop: 10, transition: "width 0.5s" }} />
                  </div>
                );
              })}
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                {isToday ? "Today's Log" : `${selectedDay.date}'s Log`}
              </div>
              {workoutsForDay.length === 0
                ? <div className="empty-state"><div className="empty-icon">💪</div><div>Nothing logged yet — hit + Log!</div></div>
                : workoutsForDay.map((w) => {
                    const wt = WORKOUT_TYPES.find((t) => t.id === w.type);
                    return (
                      <div key={w.id} className="workout-card">
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: `${wt.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{wt.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{w.name}</div>
                          <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{w.duration} min</div>
                        </div>
                        <div style={{ textAlign: "right", marginRight: 8 }}>
                          <div style={{ color: "#A78BFA", fontWeight: 700, fontSize: 14 }}>+{w.pts} XP</div>
                          <div className="badge" style={{ background: `${wt.color}22`, color: wt.color, marginTop: 4, fontSize: 11 }}>{wt.label}</div>
                        </div>
                        <button className="btn-danger" onClick={() => deleteWorkout(w.id)}>🗑️</button>
                      </div>
                    );
                  })
              }
            </div>
          </div>
        )}

        {/* NUTRITION */}
        {tab === "nutrition" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>Nutrition</div>
              <div style={{ fontSize: 12, color: "#555" }}>{isToday ? "Today" : selectedDay.fullDate}</div>
            </div>

            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 14 }}>
                {isToday ? "TODAY'S MACROS" : `${selectedDay.date.toUpperCase()}'S MACROS`}
              </div>
              {selectedDay.calories === 0
                ? <div className="empty-state"><div className="empty-icon">🥗</div><div>No nutrition logged {isToday ? "today" : "this day"}</div></div>
                : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, textAlign: "center" }}>
                    {[
                      { label: "Calories", value: selectedDay.calories, color: "#EF4444", max: 2500 },
                      { label: "Protein",  value: selectedDay.protein,  unit: "g", color: "#3B82F6", max: 180 },
                      { label: "Carbs",    value: selectedDay.carbs,    unit: "g", color: "#F59E0B", max: 280 },
                      { label: "Fat",      value: selectedDay.fat,      unit: "g", color: "#8B5CF6", max: 80 },
                    ].map((m) => (
                      <div key={m.label}>
                        <div style={{ position: "relative", width: 60, height: 60, margin: "0 auto" }}>
                          <svg width="60" height="60" viewBox="0 0 60 60">
                            <circle cx="30" cy="30" r="24" fill="none" stroke="#1e1e2e" strokeWidth="6" />
                            <circle cx="30" cy="30" r="24" fill="none" stroke={m.color} strokeWidth="6"
                              strokeDasharray={`${(Math.min((m.value||0)/m.max,1)*150).toFixed(0)} 150`}
                              strokeLinecap="round" transform="rotate(-90 30 30)" />
                          </svg>
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: m.color }}>
                            {Math.round(((m.value||0)/m.max)*100)}%
                          </div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6 }}>{m.value||0}{m.unit||""}</div>
                        <div style={{ fontSize: 11, color: "#555" }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
              }
            </div>

            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 14 }}>
                LOG {isToday ? "TODAY" : selectedDay.date.toUpperCase()}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                {["calories", "protein", "carbs", "fat"].map((field) => (
                  <div key={field}>
                    <div style={{ fontSize: 11, color: "#666", marginBottom: 6, textTransform: "capitalize" }}>
                      {field} {field !== "calories" ? "(g)" : "(kcal)"}
                    </div>
                    <input className="input" type="number" placeholder="0" value={newNutrition[field]}
                      onChange={(e) => setNewNutrition({ ...newNutrition, [field]: e.target.value })} />
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={logNutrition}>Save Nutrition</button>
            </div>

            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 14 }}>WEEKLY CALORIES</div>
              {nutritionLog.every(d => d.calories === 0)
                ? <div className="empty-state"><div className="empty-icon">📉</div><div>Log nutrition to see your chart</div></div>
                : <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={nutritionLog}>
                      <Line type="monotone" dataKey="calories" stroke="#EF4444" strokeWidth={2} dot={{ fill: "#EF4444", r: 3 }} />
                      <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a3e", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                    </LineChart>
                  </ResponsiveContainer>
              }
            </div>
          </div>
        )}

        {/* RANKS */}
        {tab === "ranks" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Rank System</div>
            {RANKS.map((r) => {
              const isCurrentRank = r.name === rank.name;
              const isUnlocked = xp >= r.min;
              return (
                <div key={r.name} className="card" style={{ border: isCurrentRank ? `1px solid ${r.color}` : "1px solid #1e1e2e", opacity: isUnlocked ? 1 : 0.5, position: "relative", overflow: "hidden" }}>
                  {isCurrentRank && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${r.color}, transparent)` }} />}
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ fontSize: 36 }}>{r.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: r.color }}>{r.name}</div>
                        {isCurrentRank && <div className="badge" style={{ background: `${r.color}22`, color: r.color, fontSize: 10 }}>CURRENT</div>}
                        {!isUnlocked && <div className="badge" style={{ background: "#1e1e2e", color: "#555", fontSize: 10 }}>🔒 LOCKED</div>}
                      </div>
                      <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
                        {r.min.toLocaleString()} — {r.max === Infinity ? "∞" : r.max.toLocaleString()} XP
                      </div>
                      {isCurrentRank && (
                        <div className="progress-bar" style={{ marginTop: 8 }}>
                          <div className="progress-fill" style={{ width: `${rankProgress}%`, background: r.color }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 8 }}>Achievements</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "First Blood",  desc: "Log first workout",     icon: "🩸", done: workouts.length > 0 },
                { label: "Week Warrior", desc: "7-day streak",          icon: "🔥", done: streak >= 7 },
                { label: "Protein King", desc: "150g protein/day",      icon: "💪", done: nutritionLog.some(d => d.protein >= 150) },
                { label: "Champion",     desc: "Reach Champion rank",   icon: "🥇", done: xp >= 1500 },
                { label: "Century",      desc: "Log 100 workouts",      icon: "💯", done: workouts.length >= 100 },
                { label: "Elite Club",   desc: "Reach Elite rank",      icon: "💎", done: xp >= 3000 },
              ].map((a) => (
                <div key={a.label} className="card" style={{ opacity: a.done ? 1 : 0.4, borderColor: a.done ? "#7C3AED44" : "#1e1e2e" }}>
                  <div style={{ fontSize: 28 }}>{a.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginTop: 6 }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{a.desc}</div>
                  {a.done && <div style={{ fontSize: 11, color: "#10B981", marginTop: 6 }}>✓ Unlocked</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Log Workout Modal */}
      {showModal === "workout" && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
              Log Workout — {isToday ? "Today" : selectedDay.date}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Workout Type</div>
                <select className="input" value={newWorkout.type} onChange={(e) => setNewWorkout({ ...newWorkout, type: e.target.value })}>
                  {WORKOUT_TYPES.map((wt) => <option key={wt.id} value={wt.id}>{wt.icon} {wt.label}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Workout Name</div>
                <input className="input" placeholder="e.g. Push Day, Morning Run..." value={newWorkout.name}
                  onChange={(e) => setNewWorkout({ ...newWorkout, name: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Duration: {newWorkout.duration} min</div>
                <input type="range" min={5} max={120} step={5} value={newWorkout.duration}
                  onChange={(e) => setNewWorkout({ ...newWorkout, duration: +e.target.value })}
                  style={{ width: "100%", accentColor: "#7C3AED" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#555", marginTop: 4 }}>
                  <span>5 min</span><span>120 min</span>
                </div>
              </div>
              <div className="card" style={{ background: "#0a0a12", textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#666" }}>You'll earn</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#A78BFA" }}>
                  +{Math.round((WORKOUT_TYPES.find((w) => w.id === newWorkout.type)?.pts || 80) * newWorkout.duration / 30)} XP
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn" style={{ flex: 1, background: "#1a1a28", color: "#888" }} onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={logWorkout}>Log Workout 🚀</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0A0A0F", borderTop: "1px solid #1e1e2e", display: "flex", justifyContent: "space-around", padding: "10px 0 20px" }}>
        {[
          { id: "dashboard", icon: "📊", label: "Home" },
          { id: "workouts",  icon: "🏋️", label: "Workouts" },
          { id: "nutrition", icon: "🍎", label: "Nutrition" },
          { id: "ranks",     icon: "🏆", label: "Ranks" },
        ].map((t) => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
