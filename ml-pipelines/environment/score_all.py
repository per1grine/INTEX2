"""
score_all.py — fast scoring refresh.

Runs each prediction notebook with SCORE_ONLY=1 so it:
  1. Loads data + builds feature matrix (fast — no model training)
  2. Loads model1.sav
  3. Scores all records and writes decision_rules.json
  4. Exits immediately via sys.exit(0)

Usage (from repo root or any cwd):
  python ml-pipelines/environment/score_all.py                    # score all 6 prediction pipelines
  python ml-pipelines/environment/score_all.py donor-acquisition  # score one pipeline by key

The DATABASE_URL env var must be set before running.
"""
import os
import sys
import subprocess
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent
PIPELINE_DIR = _ROOT / "pipeline"
OUTPUT_DIR = _ROOT / "output"

NOTEBOOKS = {
    "donor-acquisition": "DonorAcquisitionPrediction.ipynb",
    "donor-churn":       "DonorChurnPrediction.ipynb",
    "incident":          "IncidentPrediction.ipynb",
    "reintegration":     "ReintegrationPrediction.ipynb",
    "social-media":      "SocialMediaPrediction.ipynb",
    "volunteer":         "VolunteerPrediction.ipynb",
}

PYTHON_EXE = os.environ.get("PYTHON_EXECUTABLE", sys.executable)


def score_notebook(key: str, nb_file: str) -> bool:
    nb_path = PIPELINE_DIR / nb_file
    if not nb_path.exists():
        print(f"[{key}] SKIP — notebook not found: {nb_path}")
        return False

    # Verify model1.sav exists
    out_dir = OUTPUT_DIR / f"{key}-prediction"
    model_path = out_dir / "model1.sav"
    if not model_path.exists():
        # Try alternate naming (volunteer, incident, etc.)
        alt_dirs = list(OUTPUT_DIR.glob(f"*{key.replace('-', '')}*prediction"))
        if alt_dirs:
            model_path = alt_dirs[0] / "model1.sav"
    if not model_path.exists():
        print(f"[{key}] SKIP — model1.sav not found (run full notebook first)")
        return False

    print(f"[{key}] Scoring with model: {model_path}")

    env = os.environ.copy()
    env["SCORE_ONLY"] = "1"
    # Ensure DATABASE_URL is set
    if "DATABASE_URL" not in env:
        env["DATABASE_URL"] = "postgresql://postgres:admin@localhost:5432/intex"

    cmd = [
        PYTHON_EXE, "-m",
        "jupyter", "nbconvert",
        "--to", "notebook",
        "--execute",
        "--inplace",
        str(nb_path),
        "--ExecutePreprocessor.timeout=300",
    ]

    result = subprocess.run(cmd, env=env, capture_output=True, text=True, cwd=str(PIPELINE_DIR))
    if result.returncode not in (0, 1):  # exit code 1 is ok — sys.exit(0) in kernel causes this
        # nbconvert may report non-zero when the kernel exits via sys.exit(0)
        # Check if decision_rules.json was actually written
        dr_path = out_dir / "decision_rules.json"
        if dr_path.exists():
            print(f"[{key}] OK — decision_rules.json updated")
            return True
        print(f"[{key}] ERROR (exit {result.returncode})")
        if result.stderr:
            print(result.stderr[-500:])
        return False

    dr_path = out_dir / "decision_rules.json"
    if dr_path.exists():
        print(f"[{key}] OK — decision_rules.json updated")
        return True
    print(f"[{key}] WARNING — completed but no decision_rules.json found")
    return False


def main():
    keys = sys.argv[1:] if len(sys.argv) > 1 else list(NOTEBOOKS.keys())

    # Convert "donor-acquisition-prediction" → "donor-acquisition"
    clean_keys = []
    for k in keys:
        k = k.replace("-prediction", "")
        if k not in NOTEBOOKS:
            print(f"Unknown pipeline: {k}. Valid options: {list(NOTEBOOKS.keys())}")
            sys.exit(1)
        clean_keys.append(k)

    print(f"Scoring {len(clean_keys)} pipeline(s): {clean_keys}")
    results = {}
    for key in clean_keys:
        results[key] = score_notebook(key, NOTEBOOKS[key])

    print("\n── Summary ──")
    for key, ok in results.items():
        print(f"  {'OK' if ok else 'FAIL':4s}  {key}")

    if not all(results.values()):
        sys.exit(1)


if __name__ == "__main__":
    main()
