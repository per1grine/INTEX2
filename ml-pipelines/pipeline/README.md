# ML Pipelines

This folder contains 12 Jupyter notebooks that power the Admin Dashboard's ML Insights section. Each notebook connects directly to the PostgreSQL database, runs its analysis, and writes scored predictions to standardized output folders.

---

## How It Works

```
Admin clicks "Refresh" in the browser
        ↓
POST /api/ml/refresh  (backend)
        ↓
NotebookRunnerService queues all 12 notebooks
        ↓
Each notebook runs via: python -m jupyter nbconvert --execute
        ↓
Outputs saved to: ml-pipelines/output/{notebook-name}/models/
        ↓
Backend ingests decision_rules.json → writes to ml_predictions table
        ↓
Frontend polls GET /api/ml/status every 4 seconds
        ↓
Each dropdown updates as its notebook completes
```

---

## Notebooks

| Notebook | Purpose | Key Output |
|----------|---------|------------|
| DonorAcquisitionPrediction | Predicts which donors will become recurring givers | `best_model_pipeline.joblib`, `decision_rules.json` |
| DonorAcquisitionExplanatory | Explains what drives donor acquisition | `logit_feature_list.json`, model summary |
| DonorChurnPrediction | Identifies donors at risk of lapsing | `churn_pipeline.joblib`, `risk_tiers.json` |
| DonorChurnExplanatory | Explains churn warning signs | `ols_days_to_lapse.pickle`, `warning_signs.json` |
| IncidentPrediction | Flags residents likely to experience high-severity incidents | `incident_rf_pipeline.joblib`, `decision_rules.json` |
| IncidentExplanatory | Explains incident risk factors | `logit_is_high_severity.pickle`, `modifiable_actions.json` |
| ReintegrationPrediction | Scores reintegration readiness and recommends pathway | `readiness_model.joblib`, `pathway_model.joblib` |
| ReintegrationExplanatory | Explains reintegration readiness factors | `logistic_reintegration_readiness.pickle` |
| SocialMediaPrediction | Predicts which posts will convert to donations | `stage1_classifier.joblib`, `feature_importances.json` |
| SocialMediaExplanatory | Explains post characteristics that drive donations | `logistic_model.pkl`, `ols_model.pkl` |
| VolunteerPrediction | Identifies at-risk volunteers and growth candidates | `growth_model.joblib`, `dropout_model.joblib` |
| VolunteerExplanatory | Explains volunteer engagement drivers | `logit_model_conversion.pkl`, `ols_model.pkl` |

---

## Output Structure

All notebooks write to a standardized output directory:

```
ml-pipelines/
  output/
    donor-acquisition-prediction/
      models/    ← .joblib / .pickle model files + JSON summaries
      figures/   ← PNG charts
      json/      ← feature lists, dummy columns, decision rules
    donor-acquisition-explanatory/
      ...
    (one folder per notebook)
```

The backend reads `models/decision_rules.json` (or `models/model_summary.json` as fallback) after each notebook runs and stores the scored records in the `ml_predictions` database table.

---

## Running Locally

### Prerequisites

Make sure these are installed:

```bash
# Python packages
pip install jupyter nbconvert pandas scikit-learn sqlalchemy psycopg2-binary joblib numpy statsmodels matplotlib seaborn python-dotenv bcryptjs

# Verify nbconvert
python -m jupyter nbconvert --version
```

### Environment variable

The notebooks read `DATABASE_URL` from the environment. Set it before running:

```bash
# Windows (PowerShell)
$env:DATABASE_URL = "postgresql://postgres:admin@localhost:5432/intex"

# Mac/Linux
export DATABASE_URL="postgresql://postgres:admin@localhost:5432/intex"
```

Or use the `.env` file in the `frontend/` folder — the backend passes `DATABASE_URL` automatically when it executes notebooks via the API.

### Running a single notebook manually

```bash
cd ml-pipelines
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
ML__DatabaseUrl    = postgresql://user:pass@host:5432/intex
ML__NotebooksDir   = /path/to/ml-pipelines   (absolute path)
ML__PythonExecutable = python3
```

These map to the `ML` section in `appsettings.json`.

### Notes

- The `output/` directory must be writable by the process running the backend
- Notebook execution can take 5–15 minutes for all 12 — this is expected
- The daily 6am cron (ImpactCacheService) refreshes the public impact stats independently of the notebook runner
- The notebook runner queue is in-memory: if the backend restarts mid-run, re-click Refresh to restart

---

## Adding a New Notebook

1. Place the `.ipynb` file in this folder
2. Set its output paths to `output/{your-notebook-name}/` in its CONFIG cell
3. Add an entry to `NotebookFileNames` in `backend/IntexApi/Services/NotebookRunnerService.cs`
4. Add an entry to `AllNotebooks` in the same file
5. Seed the new notebook into `ml_notebook_status` (runs automatically on next `npm run db:setup`)
6. Add a domain entry to `DOMAINS` in `frontend/src/pages/AdminDashboard.tsx`
