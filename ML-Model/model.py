"""
NAMASTE → ICD-11 NLP Mapping Engine — FastAPI Service  [Phase 3 Upgraded]
==========================================================================
End-to-End improvements applied: Softmax, Normalize, Deduplication, Explainability.
Rate Limiting via slowapi.
"""

import os
import json
import logging
import time
from datetime import datetime
from typing import Optional, List, Dict
import hashlib

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks, Request, Depends, Security
from fastapi.security.api_key import APIKeyHeader
from aiocache import cached, Cache
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
import pandas as pd

from predict import NLPPredictor

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# ---------------------------------------------------------------------------
# Logging & Security
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("namaste-icd11")

# Create structured log file
os.makedirs("logs", exist_ok=True)
file_handler = logging.FileHandler("logs/prediction.log")
file_handler.setFormatter(logging.Formatter("%(message)s"))
pred_logger = logging.getLogger("prediction_tracker")
pred_logger.setLevel(logging.INFO)
pred_logger.addHandler(file_handler)

API_KEY_NAME = "X-API-KEY"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    if api_key_header == "secure-key-123":
        return api_key_header
    raise HTTPException(status_code=403, detail="Could not validate credentials")

def build_cache_key(f, *args, **kwargs):
    req = kwargs.get("pred_req")
    model = kwargs.get("model", "advanced")
    if req:
        key_str = f"{req.symptoms}_{req.disease_name}_{req.severity}_{req.duration}_{req.language}_{model}"
        return hashlib.sha256(key_str.encode()).hexdigest()
    return "default_key"

# ---------------------------------------------------------------------------
# FastAPI App setup
# ---------------------------------------------------------------------------

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="NAMASTE → ICD-11 NLP Mapping Engine",
    description="AI-powered NLP service mapped to ICD-11 codes. Now with Softmax.",
    version="2.1.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class PredictionRequest(BaseModel):
    symptoms: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Free-text symptom description"
    )
    disease_name: Optional[str] = Field(None, max_length=100, description="Optional local disease name from doctor")
    language: Optional[str] = Field("en", description="Language code")
    severity: Optional[str] = Field(None, description="low, medium, high")
    duration: Optional[str] = Field(None, max_length=50, description="Duration of symptoms")

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, v):
        if v and v.lower() not in ["low", "medium", "high"]:
            raise ValueError("Severity must be one of: low, medium, high")
        return v.lower() if v else None

    @field_validator("symptoms")
    @classmethod
    def validate_symptoms(cls, v):
        stripped = v.strip()
        if len(stripped) < 3:
            raise ValueError("Symptoms must be at least 3 characters")
        return stripped

class PredictionItem(BaseModel):
    icd_code: str
    disease: str
    confidence: float
    confidenceLabel: str
    riskLevel: str
    clinicalNote: str
    confidenceBreakdown: Dict[str, float]
    namaste_code: Optional[str] = None
    namaste_term: Optional[str] = None
    english_disease: Optional[str] = None
    isRelative: bool = False
    matchedSymptoms: List[str] = []
    explanation: dict = {}
    codeExplanation: dict = {}
    insuranceInsights: dict = {}
    ertcInsights: dict = {}

class PredictionResponse(BaseModel):
    traceId: str
    modelVersion: str
    configVersion: str
    predictions: List[PredictionItem]
    latencyMs: int
    message: Optional[str] = None

class FeedbackRequest(BaseModel):
    symptoms: str = Field(..., min_length=3)
    correct_icd_code: str = Field(..., min_length=2)
    correct_disease: str = Field(..., min_length=2)
    doctor_id: Optional[int] = None

class HealthResponse(BaseModel):
    status: str
    basic_model_loaded: bool
    advanced_model_loaded: bool
    model_metrics: dict
    num_classes: int
    feedback_count: int
    timestamp: str

# ---------------------------------------------------------------------------
# Global state
# ---------------------------------------------------------------------------

predictor: Optional[NLPPredictor] = None
FEEDBACK_FILE = "feedback.jsonl"

def get_current_metrics() -> dict:
    total_feedback = 0
    correct = 0
    if os.path.exists(FEEDBACK_FILE):
        with open(FEEDBACK_FILE, "r") as f:
            lines = f.readlines()
            recent_100 = lines[-100:]
            total_feedback = len(recent_100)
            for line in recent_100:
                try:
                    data = json.loads(line)
                    if data.get("correct", True):
                        correct += 1
                except Exception:
                    pass
    accuracy = (correct / total_feedback * 100) if total_feedback > 0 else 100.0
    return {"accuracy": accuracy, "total_feedback": total_feedback}

def write_prediction_log(log_entry: dict):
    pred_logger.info(json.dumps(log_entry))

def write_feedback_log(entry: dict):
    with open(FEEDBACK_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")

@app.on_event("startup")
async def startup():
    global predictor
    logger.info("Starting NAMASTE → ICD-11 NLP Engine...")

    if not os.path.exists("model.pkl"):
        logger.info("model.pkl not found. Running training pipeline...")
        try:
            from train import generate_dataset, train_basic_model
            source_csv = "NATIONAL AYURVEDA MORBIDITY CODES.csv"
            if os.path.exists(source_csv):
                df = generate_dataset(source_csv, "dataset.csv")
                train_basic_model(df)
            else:
                logger.error(f"Source CSV not found: {source_csv}")
        except Exception as e:
            logger.error(f"Training failed: {e}")

    predictor = NLPPredictor("model.pkl")
    if predictor.is_loaded:
        info = predictor.model_info
        logger.info(f"Engine ready. Classes: {info.get('num_classes', 0)}, SBERT: {info.get('advanced_model_loaded', False)}")
    else:
        logger.warning("Engine started WITHOUT a trained model.")

# ---------------------------------------------------------------------------
# POST /predict
# ---------------------------------------------------------------------------

@app.post(
    "/predict",
    response_model=PredictionResponse,
    summary="[Phase 4.5] Predict top-3 ICD-11 codes with hybrid confidence",
)
@limiter.limit("20/minute")
@cached(ttl=300, key_builder=build_cache_key)
async def predict(
    request: Request,
    pred_req: PredictionRequest,
    background_tasks: BackgroundTasks,
    model: str = Query("advanced", enum=["basic", "advanced"]),
    api_key: str = Depends(get_api_key)
):
    start_time = time.time()
    
    if not predictor or not predictor.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded. Please train first.")

    logger.info(f"[Phase 3] Predict request — model={model}, symptoms='{pred_req.symptoms[:80]}...'")

    import uuid
    trace_id = str(uuid.uuid4())

    # Adaptive Weight Tuning
    metrics = get_current_metrics()
    weights_override = None
    if metrics["total_feedback"] >= 5 and metrics["accuracy"] < 70.0:
        logger.warning(f"Accuracy is {metrics['accuracy']}%. Applying adaptive weights (ML=0.4, Sym=0.4, Dis=0.2).")
        weights_override = {"ml": 0.4, "symptom": 0.4, "disease": 0.2}

    results = predictor.predict(
        symptoms=pred_req.symptoms,
        disease_name=pred_req.disease_name,
        model_type=model,
        top_n=3,
        weights_override=weights_override
    )

    if not results:
        latency_ms = int((time.time() - start_time) * 1000)
        # Fallback empty response logic
        return PredictionResponse(
            traceId=trace_id,
            modelVersion="v2.2",
            configVersion="v1.0",
            predictions=[],
            latencyMs=latency_ms,
            message="No strong diagnosis found. Please refine symptoms."
        )

    logger.info("[Phase 4.5] Top predictions returned:")
    for i, r in enumerate(results):
        logger.info(
            "  #%d  disease=%-40s  confidence=%.4f  icd=%s",
            i + 1, r.get('disease', 'N/A'), r.get('confidence', 0.0), r.get('icd_code', 'N/A')
        )

    top_pred = results[0]
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "traceId": trace_id,
        "input": {"symptoms": pred_req.symptoms, "disease_name": pred_req.disease_name, "severity": pred_req.severity, "duration": pred_req.duration},
        "finalPrediction": top_pred.get("disease"),
        "confidence": top_pred.get("confidence"),
        "riskLevel": top_pred.get("riskLevel"),
        "latencyMs": int((time.time() - start_time) * 1000)
    }
    background_tasks.add_task(write_prediction_log, log_entry)

    return PredictionResponse(
        traceId=trace_id,
        modelVersion="v2.2",
        configVersion="v1.0",
        predictions=[PredictionItem(**r) for r in results],
        latencyMs=log_entry["latencyMs"],
        message="Predictions based on hybrid scoring system"
    )

# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse)
async def health():
    info = predictor.model_info if predictor else {}
    feedback_count = 0
    if os.path.exists(FEEDBACK_FILE):
        with open(FEEDBACK_FILE, "r") as f:
            feedback_count = sum(1 for _ in f)

    return HealthResponse(
        status="ok" if (predictor and predictor.is_loaded) else "degraded",
        basic_model_loaded=info.get("basic_model_loaded", False),
        advanced_model_loaded=info.get("advanced_model_loaded", False),
        model_metrics=info.get("metrics", {}),
        num_classes=info.get("num_classes", 0),
        feedback_count=feedback_count,
        timestamp=datetime.utcnow().isoformat(),
    )

# ---------------------------------------------------------------------------
# POST /feedback
# ---------------------------------------------------------------------------

@app.post("/feedback")
async def submit_feedback(request: FeedbackRequest, background_tasks: BackgroundTasks):
    entry = {
        "prediction": request.symptoms, 
        "actual": request.correct_disease,
        "correct_icd_code": request.correct_icd_code,
        "correct": True, 
        "doctor_id": request.doctor_id,
        "timestamp": datetime.utcnow().isoformat(),
    }
    background_tasks.add_task(write_feedback_log, entry)
    return {"status": "ok", "message": "Feedback recorded for tracking."}

@app.get("/metrics")
async def get_metrics():
    metrics = get_current_metrics()
    accuracy = metrics["accuracy"]
    
    total_predictions = 0
    high_risk_count = 0
    low_confidence_count = 0
    total_confidence = 0.0

    if os.path.exists("logs/prediction.log"):
        with open("logs/prediction.log", "r") as f:
            lines = f.readlines()
            total_predictions = len(lines)
            for line in lines:
                try:
                    data = json.loads(line)
                    conf = data.get("confidence", 0.0)
                    total_confidence += conf
                    if data.get("riskLevel") == "HIGH":
                        high_risk_count += 1
                    if conf < 0.4:
                        low_confidence_count += 1
                except Exception:
                    pass
                    
    avg_confidence = (total_confidence / total_predictions) if total_predictions > 0 else 0.0
    low_confidence_rate = (low_confidence_count / total_predictions * 100) if total_predictions > 0 else 0.0

    return {
        "accuracy": round(accuracy, 2),
        "totalPredictions": total_predictions,
        "avgConfidence": round(avg_confidence, 4),
        "highRiskCount": high_risk_count,
        "lowConfidenceRate": round(low_confidence_rate, 2)
    }

# ---------------------------------------------------------------------------
# POST /retrain
# ---------------------------------------------------------------------------

def run_retrain_task():
    global predictor
    try:
        from train import generate_dataset, train_basic_model
        source_csv = "NATIONAL AYURVEDA MORBIDITY CODES.csv"
        if not os.path.exists(source_csv):
            return
        df = generate_dataset(source_csv, "dataset.csv")
        if os.path.exists(FEEDBACK_FILE):
            feedback_rows = []
            with open(FEEDBACK_FILE, "r") as f:
                for line in f:
                    try:
                        entry = json.loads(line.strip())
                        feedback_rows.append({
                            "namaste_terms": entry["symptoms"],
                            "icd_code": entry["correct_icd_code"],
                            "icd_description": entry["correct_disease"],
                        })
                    except Exception:
                        continue
            if feedback_rows:
                df = pd.concat([df, pd.DataFrame(feedback_rows)], ignore_index=True)
        train_basic_model(df)
        predictor = NLPPredictor("model.pkl")
    except Exception as e:
        logger.error(f"Retraining failed: {e}")

@app.post("/retrain")
async def retrain(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_retrain_task)
    return {"status": "success", "message": "Retraining triggered."}

# ---------------------------------------------------------------------------
# GET /analytics
# ---------------------------------------------------------------------------

@app.get("/analytics")
async def analytics():
    result = {}
    if os.path.exists("dataset.csv"):
        df = pd.read_csv("dataset.csv")
        result["total_records"] = len(df)
    if predictor:
        result["model_info"] = predictor.model_info
    return result
