# Training Generation Rules (Evidence-Based)

This document constrains the AI workout engine and adaptation logic. All generated plans MUST satisfy these rules. Reference: `docs/PRD.md`.

---

## 1. Global Principles

1. **Progressive overload** — increase stimulus over time via load, reps, sets, or density; never random weekly reshuffles without reason.
2. **Specificity** — align exercise selection, rep ranges, and rest with the user’s **primary goal** (see §3).
3. **Sustainability** — weekly volume and session length MUST fit `days_per_week` × `session_duration_minutes`.
4. **Safety** — respect `injuries` and `equipment`; substitute contraindicated patterns (see §6).
5. **Personalization** — plans are built from onboarding + logs + PR history; same inputs ≠ copy-paste for different users if history diverges.

---

## 2. Volume Landmarks (Sets / Week / Muscle)

Use as **starting targets**, then adjust from feedback (RPE, soreness, adherence).

| Experience | Maintenance (min) | Hypertrophy (target) | Max practical |
|------------|-------------------|----------------------|---------------|
| Beginner   | 6                 | 10–14                | 18            |
| Intermediate | 8               | 14–18                | 22            |
| Advanced   | 10                | 16–22                | 26            |

- Count **hard sets** (within ~0–3 RIR of failure on last set).
- **Direct + indirect** volume: count primary compound toward secondary muscles at 0.5 sets unless already high indirect work.
- If user reports **high soreness (≥7/10)** or **low energy** for 2+ sessions → reduce volume 15–25% for 1 week before progressing again.

---

## 3. Goal → Programming Parameters

| Primary goal | Rep range (main) | Rest (compound) | Rest (isolation) | Weekly focus |
|--------------|------------------|-------------------|------------------|--------------|
| Muscle gain (hypertrophy) | 6–12 (accessories 10–20) | 90–150s | 60–90s | Balanced split, 10–18 sets/muscle |
| Strength gain | 3–6 | 180–300s | 90–120s | Lower volume per muscle, higher intensity compounds |
| Weight loss | 8–15 + conditioning | 60–90s | 45–60s | Full-body or UL, add 10–20 min metcon if time allows |
| Body recomposition | 6–12 | 90–120s | 60–90s | Similar to hypertrophy, moderate conditioning |
| General health | 8–15 | 60–90s | 45–60s | Full-body 2–3×/week, movement quality |
| Athletic performance | 3–8 + power | 120–180s | 60–90s | Unilateral, plyos only if experience ≥ intermediate |
| Endurance | 12–20 + cardio blocks | 30–60s | 30–45s | Circuit-friendly, limit heavy eccentrics if high cardio load |

**Intensity:** prescribe **RPE 7–9** on working sets unless deload week (RPE 6–7).

---

## 4. Weekly Split Selection

Choose split from `days_per_week` and `session_duration_minutes`:

| Days/week | Duration | Recommended split |
|-----------|----------|-------------------|
| 2 | any | Full Body A / B |
| 3 | ≤45 min | Full Body A / B / C |
| 3 | ≥60 min | Full Body or Upper/Lower + Full |
| 4 | any | Upper / Lower ×2 |
| 5 | ≥45 min | Push / Pull / Legs / Upper / Lower |
| 5 | 30 min | Full Body ×3 + Upper + Lower (short sessions) |
| 6 | ≥60 min | PPL ×2 |
| 6 | ≤45 min | PPL + weak-point focus (short) |

**Never** assign 6 days to a **beginner** with “never trained” unless they explicitly request it; cap beginners at 3–4 days default.

---

## 5. Exercise Selection Rules

### 5.1 Movement patterns per session

Each strength session MUST include (equipment permitting):

- Horizontal push
- Horizontal or vertical pull
- Knee-dominant or hip-dominant leg
- Core / brace work (optional on short days)

### 5.2 Order

1. Highest skill / heaviest compound first (after warm-up)
2. Secondary compounds
3. Isolations
4. Conditioning last (if goal requires)

### 5.3 Duplication

- No duplicate **same joint pattern** heavy compound twice in one session (e.g. barbell bench + dumbbell bench as two primaries).
- Max **2 exercises per muscle** per session unless advanced + long session.

### 5.4 Progression schemes

| Experience | Load progression |
|------------|------------------|
| Beginner | Add reps within range, then +2.5–5% load when all sets hit top of range |
| Intermediate | Double progression or +1 set/week on lagging muscle (max +2 sets/week muscle) |
| Advanced | Periodize: 3 weeks progress, 1 deload every 4–6 weeks if plateau |

---

## 6. Injury & Equipment Constraints

| Limitation | Avoid / modify | Prefer |
|------------|----------------|--------|
| Shoulder | Overhead press heavy, dips deep | Landmine press, incline neutral grip, face pulls |
| Knee | Deep loaded knee flexion, high-impact plyos | Box squat, RDL, leg press partial ROM |
| Lower back | Heavy conventional DL from floor, good mornings | Trap bar, hip hinge with support, leg press |
| Bodyweight only | Barbell movements | Push-up variants, inverted rows, split squats, bands |
| Limited equipment | Machines requiring missing stack | Dumbbell/band alternatives from library |

Always include **alternative_exercises** (≥1) per primary lift in JSON output.

---

## 7. Session Structure Template

```
Warm-up: 5–8 min (mobility + ramp sets)
Main blocks: 60–75% of time
Accessory: remaining
Optional finisher: goal-dependent
```

**Sets per exercise (defaults):**

| Role | Beginner | Intermediate | Advanced |
|------|----------|--------------|----------|
| Main compound | 3 | 3–4 | 4–5 |
| Secondary | 2–3 | 3 | 3–4 |
| Isolation | 2–3 | 3 | 3–4 |

Cap total **working sets per session** by duration:

| Duration | Max working sets |
|----------|------------------|
| 30 min | 12–14 |
| 45 min | 16–20 |
| 60 min | 20–26 |
| 90+ min | 26–34 |

---

## 8. Adaptation Engine (Post-Workout Feedback)

Evaluate last **3 sessions** (same muscle group or global fatigue).

| Signal | Action |
|--------|--------|
| Completed + RPE ≤6 + “too easy” | +2.5–5% load OR +1 rep/set OR +1 set on 1 exercise |
| Completed + RPE ≥9 + high soreness | −1 set on isolations OR −5% load OR extra rest day |
| Missed 2+ workouts/week | Offer **compressed** week (maintain frequency, −20% volume) |
| Plateau 3 weeks (same load/reps on compound) | Swap variation, change rep bracket ±2, or deload −40% volume 1 week |
| 3 sessions high fatigue score | Deload week: −30–40% volume, RPE cap 7 |

**Never** increase volume and intensity in the same adaptation step.

---

## 9. AI Output Schema (Required JSON Shape)

Workout generation responses MUST be valid JSON matching this structure (for parser + DB):

```json
{
  "plan_id": "uuid",
  "program_name": "string",
  "weekly_split": "string",
  "rationale": "2-3 sentences referencing user goal and constraints",
  "weeks": [
    {
      "week_number": 1,
      "days": [
        {
          "day_label": "Push A",
          "estimated_minutes": 55,
          "exercises": [
            {
              "name": "Bench Press",
              "muscle_group": "chest",
              "sets": 4,
              "reps": "8-12",
              "rest_seconds": 90,
              "tempo": "3-1-1",
              "target_rpe": 8,
              "instructions": "string",
              "video_url": "string | null",
              "alternatives": ["Dumbbell Press", "Machine Press"]
            }
          ]
        }
      ]
    }
  ]
}
```

Chat and adaptation endpoints return **structured patches** when changing plans:

```json
{
  "adaptation_type": "volume_reduction | load_increase | exercise_swap | deload",
  "reason": "string",
  "changes": []
}
```

---

## 10. Prompt Injection Guardrails (System Prompt Summary)

The model MUST:

- Cite user `goal`, `experience`, `equipment`, and recent `avg_rpe` when explaining changes.
- Refuse to prescribe max-effort 1RM tests for beginners without supervision.
- Not recommend illegal substances or extreme calorie deficits.
- Prefer multi-joint compounds when time < 45 min.

---

## 11. Quality Checklist (Automated Validation)

Before saving a generated plan, validate:

- [ ] Weekly set counts per muscle within landmarks (§2)
- [ ] Session duration estimate within ±10% of user availability
- [ ] No contraindicated exercises for listed injuries
- [ ] Every exercise has alternatives
- [ ] At least one progression path documented in `rationale`

Fail validation → regenerate with constraint message, max 2 retries.
