"""
inject_score_only.py — adds a SCORE_ONLY fast-path cell to each prediction notebook.

Run once to patch notebooks in-place.  Re-running is idempotent: it checks for
the marker comment before inserting.
"""
import json
from pathlib import Path

BASE = Path(__file__).parent
MARKER = "# <<SCORE_ONLY_FAST_PATH>>"


def _new_cell(source: str) -> dict:
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": source,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Per-notebook configs:
#   insert_after  – cell index (in current notebook) to insert AFTER
#   fast_path_src – Python source for the SCORE_ONLY cell
# ─────────────────────────────────────────────────────────────────────────────

DONOR_ACQ_FAST_PATH = """\
# <<SCORE_ONLY_FAST_PATH>>
# When SCORE_ONLY=1 env var is set: load model1.sav, score, write decision_rules.json, exit.
import os, json, sys
import joblib
import pandas as pd
import numpy as np
from pathlib import Path

if os.environ.get("SCORE_ONLY") == "1":
    _models_dir = Path(CONFIG["models_dir"])
    _model_path = _models_dir / "model1.sav"
    if not _model_path.exists():
        print(f"SCORE_ONLY: model not found at {_model_path}, skipping fast path")
    else:
        best_model = joblib.load(_model_path)
        print(f"SCORE_ONLY: loaded {_model_path}")

        _sid_col = CONFIG["supporter_id"]
        _X_all = pd.concat([X_train_final, X_test_final], axis=0)
        _ids   = df_raw_master.loc[_X_all.index, _sid_col].astype(str).values if _sid_col in df_raw_master.columns else _X_all.index.astype(str)
        _names = (
            df_raw_master.loc[_X_all.index, "display_name"].values
            if "display_name" in df_raw_master.columns
            else df_raw_master.loc[_X_all.index, "organization_name"].fillna(
                df_raw_master.loc[_X_all.index, "first_name"].fillna("").str.cat(
                    df_raw_master.loc[_X_all.index, "last_name"].fillna(""), sep=" "
                ).str.strip()
            ).values
            if "organization_name" in df_raw_master.columns
            else _ids
        )
        _probs = best_model.predict_proba(_X_all)[:, 1]

        _TIERS_RAW = CONFIG.get("probability_tiers", {"High": {"min": 0.66, "max": 1.0}, "Medium": {"min": 0.33, "max": 0.66}, "Low": {"min": 0.0, "max": 0.33}})
        if _TIERS_RAW and isinstance(next(iter(_TIERS_RAW.values())), (int, float)):
            _TIER_THRESHOLDS = sorted(_TIERS_RAW.items(), key=lambda x: x[1], reverse=True)
            def _tier(p):
                for name, threshold in _TIER_THRESHOLDS:
                    if p >= threshold: return name
                return list(_TIERS_RAW.keys())[-1]
        else:
            def _tier(p):
                for t, b in _TIERS_RAW.items():
                    if b["min"] <= p <= b["max"]: return t
                return "Low"

        _records = [{"supporter_id": sid, "display_name": str(nm) if nm else sid, "probability": round(float(p), 4), "tier": _tier(float(p))} for sid, nm, p in zip(_ids, _names, _probs)]
        _records.sort(key=lambda r: r["probability"], reverse=True)
        _out_path = _models_dir / "decision_rules.json"
        _out_path.write_text(json.dumps(_records, indent=2, default=str), encoding="utf-8")
        print(f"SCORE_ONLY done: {len(_records)} records -> {_out_path}")
        sys.exit(0)
"""

DONOR_CHURN_FAST_PATH = """\
# <<SCORE_ONLY_FAST_PATH>>
import os, json, sys
import joblib
import pandas as pd
import numpy as np
from pathlib import Path

if os.environ.get("SCORE_ONLY") == "1":
    _models_dir = Path(CONFIG["models_dir"])
    _model_path = _models_dir / "model1.sav"
    if not _model_path.exists():
        print(f"SCORE_ONLY: model not found at {_model_path}, skipping fast path")
    else:
        best_model = joblib.load(_model_path)
        print(f"SCORE_ONLY: loaded {_model_path}")

        _sid_col = CONFIG["supporter_id"]
        _feat_list = FINAL_FEATURE_LIST if ("FINAL_FEATURE_LIST" in dir() and USE_REDUCED) else None
        _X_eval_all = pd.concat([
            X_train[_feat_list] if _feat_list else X_train,
            X_test[_feat_list]  if _feat_list else X_test,
        ], axis=0)

        _probs = best_model.predict_proba(_X_eval_all)[:, 1]
        _ids   = df_raw_master.loc[_X_eval_all.index, _sid_col].astype(str).values if _sid_col in df_raw_master.columns else _X_eval_all.index.astype(str)
        _names = df_raw_master.loc[_X_eval_all.index, "display_name"].values if "display_name" in df_raw_master.columns else _ids

        _TIERS_RAW = CONFIG.get("probability_tiers", {"High Risk": 0.70, "Medium Risk": 0.40, "Low Risk": 0.0})
        if _TIERS_RAW and isinstance(next(iter(_TIERS_RAW.values())), (int, float)):
            _TIER_THRESHOLDS = sorted(_TIERS_RAW.items(), key=lambda x: x[1], reverse=True)
            def _tier(p):
                for name, threshold in _TIER_THRESHOLDS:
                    if p >= threshold: return name
                return list(_TIERS_RAW.keys())[-1]
        else:
            def _tier(p):
                for t, b in _TIERS_RAW.items():
                    if b["min"] <= p <= b["max"]: return t
                return "Low"

        _records = [{"supporter_id": sid, "display_name": str(nm) if nm else sid, "probability": round(float(p), 4), "tier": _tier(float(p))} for sid, nm, p in zip(_ids, _names, _probs)]
        _records.sort(key=lambda r: r["probability"], reverse=True)
        _out_path = _models_dir / "decision_rules.json"
        _out_path.write_text(json.dumps(_records, indent=2, default=str), encoding="utf-8")
        print(f"SCORE_ONLY done: {len(_records)} records -> {_out_path}")
        sys.exit(0)
"""

INCIDENT_FAST_PATH = """\
# <<SCORE_ONLY_FAST_PATH>>
import os, json, sys
import joblib
import pandas as pd
import numpy as np
from pathlib import Path

if os.environ.get("SCORE_ONLY") == "1":
    _models_dir = Path(CONFIG["models_dir"])
    _model_path = _models_dir / "model1.sav"
    if not _model_path.exists():
        print(f"SCORE_ONLY: model not found at {_model_path}, skipping fast path")
    else:
        best_model = joblib.load(_model_path)
        print(f"SCORE_ONLY: loaded {_model_path}")

        _iid_col = CONFIG.get("incident_id", "incident_id")
        _rid_col = CONFIG.get("resident_id", "resident_id")
        _X_all = pd.concat([X_train, X_test], axis=0)
        _probs = best_model.predict_proba(_X_all)[:, 1]
        _ids   = df_raw_master.loc[_X_all.index, _iid_col].astype(str).values if _iid_col in df_raw_master.columns else _X_all.index.astype(str)
        _res_ids = df_raw_master.loc[_X_all.index, _rid_col].astype(str).values if _rid_col in df_raw_master.columns else _ids

        _TIERS = {"High": {"min": 0.67, "max": 1.0}, "Medium": {"min": 0.33, "max": 0.67}, "Low": {"min": 0.0, "max": 0.33}}
        def _tier(p):
            for t, b in _TIERS.items():
                if b["min"] <= p <= b["max"]: return t
            return "Low"

        _records = [{"incident_id": iid, "resident_id": rid, "display_name": f"Resident {rid} Incident {iid}", "probability": round(float(p), 4), "tier": _tier(float(p))} for iid, rid, p in zip(_ids, _res_ids, _probs)]
        _records.sort(key=lambda r: r["probability"], reverse=True)
        _models_dir.mkdir(parents=True, exist_ok=True)
        _out_path = _models_dir / "decision_rules.json"
        _out_path.write_text(json.dumps(_records, indent=2, default=str), encoding="utf-8")
        print(f"SCORE_ONLY done: {len(_records)} records -> {_out_path}")
        sys.exit(0)
"""

REINTEGRATION_FAST_PATH = """\
# <<SCORE_ONLY_FAST_PATH>>
import os, json, sys
import joblib
import pandas as pd
import numpy as np
from pathlib import Path

if os.environ.get("SCORE_ONLY") == "1":
    _models_dir = Path(CONFIG["models_dir"])
    _model_path = _models_dir / "model1.sav"
    if not _model_path.exists():
        print(f"SCORE_ONLY: model not found at {_model_path}, skipping fast path")
    else:
        readiness_best_model = joblib.load(_model_path)
        print(f"SCORE_ONLY: loaded {_model_path}")

        _rid_col = CONFIG["resident_id"]
        _X_all_r = pd.concat([X_train_r, X_test_r], axis=0)
        _X_all_r_arr = _X_all_r.values if hasattr(_X_all_r, "values") else np.array(_X_all_r)
        _smote_arr = X_train_r_smote.values if hasattr(X_train_r_smote, "values") else np.array(X_train_r_smote)

        readiness_best_model.fit(_smote_arr, np.array(y_train_r_smote))
        _proba_r = readiness_best_model.predict_proba(_X_all_r_arr)
        _probs_r = _proba_r[:, 1] if _proba_r.shape[1] > 1 else _proba_r[:, 0] * 0

        if _rid_col in readiness_safehouse.columns:
            try:
                _resident_ids = readiness_safehouse.loc[_X_all_r.index, _rid_col].astype(str).values
            except KeyError:
                _resident_ids = _X_all_r.index.astype(str).values
        else:
            _resident_ids = _X_all_r.index.astype(str).values

        _meta = readiness_safehouse.loc[_X_all_r.index] if hasattr(readiness_safehouse, "loc") else pd.DataFrame(index=_X_all_r.index)
        _READINESS_TIERS = {"Approaching Readiness": 0.7, "Building Readiness": 0.45, "Early Signals": 0.25, "Not Yet Indicated": 0.0}
        _RT = sorted(_READINESS_TIERS.items(), key=lambda x: x[1], reverse=True)
        def _rtier(p):
            for name, threshold in _RT:
                if p >= threshold: return name
            return "Not Yet Indicated"

        _records = []
        for _rid, _prob in zip(_resident_ids, _probs_r):
            _records.append({"resident_id": _rid, "display_name": f"Resident {_rid}", "probability": round(float(_prob), 4), "tier": _rtier(float(_prob))})
        _records.sort(key=lambda r: r["probability"], reverse=True)
        _models_dir.mkdir(parents=True, exist_ok=True)
        _out_path = _models_dir / "decision_rules.json"
        _out_path.write_text(json.dumps(_records, indent=2, default=str), encoding="utf-8")
        print(f"SCORE_ONLY done: {len(_records)} records -> {_out_path}")
        sys.exit(0)
"""

SOCIAL_MEDIA_FAST_PATH = """\
# <<SCORE_ONLY_FAST_PATH>>
import os, json, sys
import joblib
import pandas as pd
import numpy as np
from pathlib import Path

if os.environ.get("SCORE_ONLY") == "1":
    _models_dir = Path(CONFIG["models_dir"])
    _model_path = _models_dir / "model1.sav"
    if not _model_path.exists():
        print(f"SCORE_ONLY: model not found at {_model_path}, skipping fast path")
    else:
        s1_best_model = joblib.load(_model_path)
        print(f"SCORE_ONLY: loaded {_model_path}")

        _post_id_col = CONFIG["post_id"]
        _ohe_cols = [c for c in ["platform", "post_type", "media_type", "sentiment_tone", "content_topic", "call_to_action_type", "campaign_name"] if c in df_raw.columns]
        _df_score = df_raw.copy()
        _df_score = pd.get_dummies(_df_score, columns=_ohe_cols, drop_first=True, dtype=int)
        _feat_cols = TRAINED_FEATURE_COLUMNS
        for col in _feat_cols:
            if col not in _df_score.columns:
                _df_score[col] = 0
        _X_all = _df_score[_feat_cols].values
        _probs = s1_best_model.predict_proba(_X_all)[:, 1]
        _post_ids = df_raw[_post_id_col].astype(str).values
        _platform = df_raw["platform"].astype(str).values if "platform" in df_raw.columns else [""] * len(_post_ids)

        _TIERS = {"High ROI": {"min": 0.6, "max": 1.0}, "Medium ROI": {"min": 0.3, "max": 0.6}, "Low ROI": {"min": 0.0, "max": 0.3}}
        def _tier(p):
            for t, b in _TIERS.items():
                if b["min"] <= p <= b["max"]: return t
            return "Low ROI"

        _records = [{"post_id": pid, "display_name": f"{plat} post {pid}", "probability": round(float(p), 4), "tier": _tier(float(p))} for pid, plat, p in zip(_post_ids, _platform, _probs)]
        _records.sort(key=lambda r: r["probability"], reverse=True)
        _models_dir.mkdir(parents=True, exist_ok=True)
        _out_path = _models_dir / "decision_rules.json"
        _out_path.write_text(json.dumps(_records, indent=2, default=str), encoding="utf-8")
        print(f"SCORE_ONLY done: {len(_records)} records -> {_out_path}")
        sys.exit(0)
"""

VOLUNTEER_FAST_PATH = """\
# <<SCORE_ONLY_FAST_PATH>>
import os, json, sys
import joblib
import pandas as pd
import numpy as np
from pathlib import Path

if os.environ.get("SCORE_ONLY") == "1":
    _models_dir = Path(CONFIG["models_dir"])
    _model_path = _models_dir / "model1.sav"
    if not _model_path.exists():
        print(f"SCORE_ONLY: model not found at {_model_path}, skipping fast path")
    else:
        growth_best_model = joblib.load(_model_path)
        print(f"SCORE_ONLY: loaded {_model_path}")

        _sid_col = CONFIG["supporter_id"]
        _X_all_g = pd.concat([X_train_g, X_test_g], axis=0)
        _X_eval_g = _X_all_g[GROWTH_FINAL_FEATURES]
        _probs_g = growth_best_model.predict_proba(_X_eval_g)[:, 1]
        _sids_g  = df_raw_growth.loc[_X_all_g.index, _sid_col].astype(str).values

        _G_TIERS = CONFIG.get("health_status_thresholds", {"green": 0.60, "amber": 0.35})
        _g_green = _G_TIERS.get("green", 0.60)
        _g_amber = _G_TIERS.get("amber", 0.35)
        def _growth_tier(p):
            if p >= _g_green: return "Green"
            if p >= _g_amber: return "Amber"
            return "Red"

        _name_map = {}
        if "supporters" in dir():
            for _, row in supporters.iterrows():
                _name_map[str(row[_sid_col])] = str(row.get("display_name", row[_sid_col]))

        _records = [{"supporter_id": sid, "display_name": _name_map.get(sid, f"Volunteer {sid}"), "probability": round(float(p), 4), "tier": _growth_tier(float(p))} for sid, p in zip(_sids_g, _probs_g)]
        _records.sort(key=lambda r: r["probability"], reverse=True)
        _models_dir.mkdir(parents=True, exist_ok=True)
        _out_path = _models_dir / "decision_rules.json"
        _out_path.write_text(json.dumps(_records, indent=2, default=str), encoding="utf-8")
        print(f"SCORE_ONLY done: {len(_records)} records -> {_out_path}")
        sys.exit(0)
"""

# ─────────────────────────────────────────────────────────────────────────────
# Notebooks: (filename, insert_after_cell_index, fast_path_source)
# insert_after_cell_index is the cell index AFTER which to insert the new cell.
# ─────────────────────────────────────────────────────────────────────────────
NOTEBOOKS = [
    # DonorAcquisition: finalize is cell 40; insert after 40 (before EDA at 42)
    ("DonorAcquisitionPrediction.ipynb", 40, DONOR_ACQ_FAST_PATH),
    # DonorChurn: finalize is cell 54; insert after 54
    ("DonorChurnPrediction.ipynb", 54, DONOR_CHURN_FAST_PATH),
    # Incident: finalize is cell 56; insert after 56
    ("IncidentPrediction.ipynb", 56, INCIDENT_FAST_PATH),
    # Reintegration: finalize is cell 58; insert after 58
    ("ReintegrationPrediction.ipynb", 58, REINTEGRATION_FAST_PATH),
    # SocialMedia: finalize is cell 56; insert after 56
    ("SocialMediaPrediction.ipynb", 56, SOCIAL_MEDIA_FAST_PATH),
    # Volunteer: finalize is cell 50; insert after 50
    ("VolunteerPrediction.ipynb", 50, VOLUNTEER_FAST_PATH),
]


def patch_notebook(nb_path: Path, insert_after: int, fast_path_src: str):
    with open(nb_path, encoding="utf-8") as f:
        data = json.load(f)

    cells = data["cells"]

    # Idempotency: check if fast-path cell already exists
    for cell in cells:
        if cell["cell_type"] == "code" and MARKER in "".join(cell["source"]):
            print(f"  Already patched: {nb_path.name}")
            return

    new = _new_cell(fast_path_src)
    cells.insert(insert_after + 1, new)
    data["cells"] = cells

    with open(nb_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    print(f"  Patched: {nb_path.name}  (inserted after cell {insert_after})")


if __name__ == "__main__":
    for nb_file, insert_after, fast_path_src in NOTEBOOKS:
        nb_path = BASE / nb_file
        if not nb_path.exists():
            print(f"  NOT FOUND: {nb_file}")
            continue
        patch_notebook(nb_path, insert_after, fast_path_src)
    print("Done.")
