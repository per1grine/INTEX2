# ML Pipelines

Notebooks live in `ml-pipelines/pipeline/`. This `environment/` folder holds setup docs, Python dependencies, optional `.env`, and helper scripts (`score_all.py`, `inject_score_only.py`). Each notebook connects directly to the PostgreSQL database, runs its analysis, and writes scored predictions to `ml-pipelines/output/`.

---

## How It Works

```
Admin clicks "Refresh" in the browser
        |
POST /api/ml/refresh  (backend)
        |
NotebookRunnerService queues all 6 prediction notebooks (score-only)
        |
Each notebook runs via: python -m jupyter nbconvert --execute
        |
Outputs saved to: ml-pipelines/output/{notebook-key}/
        |
Backend ingests decision_rules.json -> writes to ml_predictions table
Backend ingests domain_summary.json -> writes to ml_domain_summaries table
        |
Frontend polls GET /api/ml/status every 4 seconds
        |
Each dropdown updates as its notebook completes
```

A **full retrain** (nightly cron or manual "Retrain" button) runs all 12 notebooks (explanatory + prediction) from scratch.

A **fast refresh** runs only the 6 prediction notebooks with `SCORE_ONLY=1`, re-scoring using existing `model1.sav` files.

---

## Notebooks

| Notebook | Key | Type | Key Outputs |
|----------|-----|------|-------------|
| DonorAcquisitionExplanatory | `donor-acquisition-explanatory` | Explanatory | `model1.sav`, `model1.meta.json`, `domain_summary.json`, `logit_model.pickle`, `ols_model.pickle` |
| DonorAcquisitionPrediction | `donor-acquisition-prediction` | Prediction | `model1.sav`, `model1.meta.json`, `best_model_pipeline.joblib`, `decision_rules.json`, `model_summary.json` |
| DonorChurnExplanatory | `donor-churn-explanatory` | Explanatory | `model1.sav`, `model1.meta.json`, `domain_summary.json`, `logit_is_churned.pickle`, `warning_signs.json` |
| DonorChurnPrediction | `donor-churn-prediction` | Prediction | `model1.sav`, `model1.meta.json`, `churn_pipeline.joblib`, `decision_rules.json`, `risk_tiers.json` |
| IncidentExplanatory | `incident-explanatory` | Explanatory | `model1.sav`, `model1.meta.json`, `domain_summary.json`, `action_guide.json`, `logit_is_high_severity.pickle` |
| IncidentPrediction | `incident-prediction` | Prediction | `model1.sav`, `model1.meta.json`, `decision_rules.json`, `model_summary.json` |
| ReintegrationExplanatory | `reintegration-explanatory` | Explanatory | `model1.sav`, `model1.meta.json`, `domain_summary.json` |
| ReintegrationPrediction | `reintegration-prediction` | Prediction | `model1.sav`, `model1.meta.json`, `decision_rules.json`, `model_summary.json` |
| SocialMediaExplanatory | `social-media-explanatory` | Explanatory | `model1.sav`, `model1.meta.json`, `domain_summary.json`, `logistic_model.pkl`, `ols_model.pkl` |
| SocialMediaPrediction | `social-media-prediction` | Prediction | `model1.sav`, `model1.meta.json`, `decision_rules.json`, `model_summary.json` |
| VolunteerExplanatory | `volunteer-explanatory` | Explanatory | `model1.sav`, `model1.meta.json`, `domain_summary.json`, `ols_model.pkl` |
| VolunteerPrediction | `volunteer-prediction` | Prediction | `model1.sav`, `model1.meta.json`, `decision_rules.json`, `growth_model.joblib`, `dropout_model.joblib` |

---

## Output Structure

All notebooks write to `ml-pipelines/output/{notebook-key}/`. Most notebooks write artifacts **flat** (directly in the folder). Some prediction notebooks (e.g. `social-media-prediction`) use `models/` and `figures/` subfolders.

```
ml-pipelines/
  environment/        <- README.md, requirements.txt, .env, .env.example, helper scripts
  pipeline/           <- 12 .ipynb notebooks
  output/
    donor-acquisition-explanatory/    <- model1.sav, domain_summary.json, figures, etc.
    donor-acquisition-prediction/     <- model1.sav, decision_rules.json, figures, etc.
    donor-churn-explanatory/
    donor-churn-prediction/
    incident-explanatory/
    incident-prediction/
    reintegration-explanatory/
    reintegration-prediction/
    social-media-explanatory/
    social-media-prediction/
    volunteer-explanatory/
    volunteer-prediction/
```

The backend resolves artifacts in this order:
- `model1.sav`: `output/{key}/model1.sav` then `output/{key}/models/model1.sav`
- `decision_rules.json`: `output/{key}/` then `output/{key}/models/` then `output/{key}/json/`
- `domain_summary.json`: `output/{key}/domain_summary.json` (flat only)

---

## Running Locally

### Prerequisites

```bash
# Install Python packages (from repo root)
pip install -r ml-pipelines/environment/requirements.txt

# Verify nbconvert
python -m jupyter nbconvert --version
```

### Environment variable

The notebooks need `DATABASE_URL` to connect to PostgreSQL. There are two ways to set it:

**Option A — `.env` file (recommended for local development):**

Copy the example and fill in your credentials:
```bash
cp ml-pipelines/environment/.env.example ml-pipelines/environment/.env
# Edit .env with your actual DATABASE_URL
```

All notebooks use `python-dotenv` to automatically load this file. The backend's `nbconvert` process also sets `DATABASE_URL` directly, so the `.env` is only needed for standalone notebook runs.

**Option B — Shell environment variable:**
```bash
# Windows (PowerShell)
$env:DATABASE_URL = "postgresql://postgres:admin@localhost:5432/intex"

# Mac/Linux
export DATABASE_URL="postgresql://postgres:admin@localhost:5432/intex"
```

### Running a single notebook manually

```bash
cd ml-pipelines/pipeline
python -m jupyter nbconvert --to notebook --execute --inplace DonorAcquisitionPrediction.ipynb --ExecutePreprocessor.timeout=600
```

### Running all notebooks via the API

Start the backend (`dotnet run` inside `backend/IntexApi/`), then hit the refresh button in the Admin Dashboard — or call the API directly:

```bash
curl -X POST http://localhost:5180/api/ml/refresh \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Deploying to a Host

### What the host needs

1. **Python 3.11+** installed and accessible as `python` (or `python3`)
2. All pip packages above installed in the host's Python environment
3. `DATABASE_URL` set as an environment variable on the host (not in a `.env` file)

### appsettings config on the host

In your hosting environment's configuration (e.g. environment variables, secrets manager), set:

```
ML__DatabaseUrl      = postgresql://user:pass@host:5432/intex
ML__NotebooksDir     = /path/to/ml-pipelines/pipeline   (absolute path to the folder containing the .ipynb files)
ML__PythonExecutable = python3
```

These map to the `ML` section in `appsettings.json`.

### Notes

- The `output/` directory must be writable by the process running the backend
- Notebook execution can take 5-15 minutes for all 12 — this is expected
- The daily cron job triggers a full retrain automatically
- The notebook runner queue is in-memory: if the backend restarts mid-run, re-click Refresh to restart
- Re-running a notebook **overwrites** its previous output files (no duplicates)

---

## Adding a New Notebook

1. Place the `.ipynb` file in `ml-pipelines/pipeline/`
2. Add the standard dotenv loading block to its CONFIG cell (see any existing notebook for the template)
3. Set all output paths to `../output/{your-notebook-key}/` in its CONFIG cell
4. Make sure it exports `model1.sav` and `model1.meta.json` to `CONFIG["models_dir"]`
5. Explanatory notebooks: export `domain_summary.json` to the same output folder
6. Prediction notebooks: export `decision_rules.json` to the same output folder
7. Add entries to `NotebookRunnerService.cs`:
   - `AllNotebooks` array
   - `NotebookFileNames` dictionary
   - `PredictionNotebooks` (if prediction) or `ExplanatoryDomainKeys` (if explanatory)
8. Add the domain to `DOMAINS` in `frontend/src/pages/ReportTemp.tsx`
