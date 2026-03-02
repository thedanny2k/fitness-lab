from flask import Flask, request, jsonify
from flask_cors import CORS
from firebase_admin import auth, firestore
from functools import wraps
import firebase_config  # initializes Firebase Admin SDK

app = Flask(__name__)
CORS(app)

db = firestore.client()

# ─── Auth Middleware ────────────────────────────────────────────────────────

def require_auth(f):
    """Decorator: verifies Firebase ID token on every protected route."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            return jsonify({"error": "Missing token"}), 401
        try:
            decoded = auth.verify_id_token(token)
            request.uid = decoded["uid"]
        except Exception as e:
            return jsonify({"error": "Invalid token", "details": str(e)}), 401
        return f(*args, **kwargs)
    return decorated


# ─── Workouts ───────────────────────────────────────────────────────────────

@app.route("/api/workouts", methods=["GET"])
@require_auth
def get_workouts():
    """Return all workouts for the authenticated user."""
    docs = (
        db.collection("users")
        .document(request.uid)
        .collection("workouts")
        .order_by("timestamp", direction=firestore.Query.DESCENDING)
        .stream()
    )
    workouts = [{"id": d.id, **d.to_dict()} for d in docs]
    return jsonify(workouts)


@app.route("/api/workouts", methods=["POST"])
@require_auth
def log_workout():
    """Log a new workout and award XP."""
    data = request.json
    required = ["type", "name", "duration"]
    if not all(k in data for k in required):
        return jsonify({"error": "Missing fields"}), 400

    XP_PER_30_MIN = {
        "strength": 80,
        "cardio":   60,
        "hiit":     100,
        "yoga":     40,
        "sports":   70,
    }

    base_pts = XP_PER_30_MIN.get(data["type"], 60)
    pts = round(base_pts * data["duration"] / 30)

    workout = {
        "type":      data["type"],
        "name":      data["name"],
        "duration":  data["duration"],
        "pts":       pts,
        "timestamp": firestore.SERVER_TIMESTAMP,
    }

    # Save workout
    ref = (
        db.collection("users")
        .document(request.uid)
        .collection("workouts")
        .add(workout)
    )

    # Increment XP on user profile
    user_ref = db.collection("users").document(request.uid)
    user_ref.set({"xp": firestore.Increment(pts)}, merge=True)

    return jsonify({"id": ref[1].id, "pts_earned": pts, **workout}), 201


@app.route("/api/workouts/<workout_id>", methods=["DELETE"])
@require_auth
def delete_workout(workout_id):
    db.collection("users").document(request.uid) \
      .collection("workouts").document(workout_id).delete()
    return jsonify({"deleted": workout_id})


# ─── Nutrition ──────────────────────────────────────────────────────────────

@app.route("/api/nutrition", methods=["GET"])
@require_auth
def get_nutrition():
    """Return nutrition logs for the past 7 days."""
    docs = (
        db.collection("users")
        .document(request.uid)
        .collection("nutrition")
        .order_by("timestamp", direction=firestore.Query.DESCENDING)
        .limit(7)
        .stream()
    )
    logs = [{"id": d.id, **d.to_dict()} for d in docs]
    return jsonify(logs)


@app.route("/api/nutrition", methods=["POST"])
@require_auth
def log_nutrition():
    """Save daily nutrition entry."""
    data = request.json
    required = ["calories", "protein", "carbs", "fat"]
    if not all(k in data for k in required):
        return jsonify({"error": "Missing fields"}), 400

    entry = {
        "calories":  int(data["calories"]),
        "protein":   int(data["protein"]),
        "carbs":     int(data["carbs"]),
        "fat":       int(data["fat"]),
        "timestamp": firestore.SERVER_TIMESTAMP,
    }

    ref = (
        db.collection("users")
        .document(request.uid)
        .collection("nutrition")
        .add(entry)
    )

    return jsonify({"id": ref[1].id, **entry}), 201


# ─── User Profile ────────────────────────────────────────────────────────────

@app.route("/api/profile", methods=["GET"])
@require_auth
def get_profile():
    doc = db.collection("users").document(request.uid).get()
    if not doc.exists:
        return jsonify({"uid": request.uid, "xp": 0, "streak": 0})
    return jsonify({"uid": request.uid, **doc.to_dict()})


@app.route("/api/profile", methods=["PUT"])
@require_auth
def update_profile():
    data = request.json
    allowed = ["displayName", "goal", "weight", "height"]
    update = {k: data[k] for k in allowed if k in data}
    db.collection("users").document(request.uid).set(update, merge=True)
    return jsonify({"updated": update})


# ─── Leaderboard ─────────────────────────────────────────────────────────────

@app.route("/api/leaderboard", methods=["GET"])
@require_auth
def leaderboard():
    docs = (
        db.collection("users")
        .order_by("xp", direction=firestore.Query.DESCENDING)
        .limit(10)
        .stream()
    )
    board = [{"uid": d.id, **{k: v for k, v in d.to_dict().items() if k in ["displayName", "xp"]}}
             for d in docs]
    return jsonify(board)


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "service": "FitnessTracker API"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
