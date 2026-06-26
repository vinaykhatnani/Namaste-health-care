"""
NAMASTE → ICD-11 NLP Mapping Engine — Prediction Module
========================================================
Hybrid inference:
  Step 1: TF-IDF + Logistic Regression → top-5 candidates
  Step 2: Sentence-BERT re-ranking via cosine similarity → top-3
  Step 3: Phase 4 Hybrid Scoring (ML + Symptoms + Disease Similarity)
"""

import os
import re
import logging
import math
import numpy as np
import joblib
from functools import lru_cache
from typing import List, Dict, Optional
from difflib import get_close_matches
from sklearn.metrics.pairwise import cosine_similarity
from rapidfuzz import fuzz
import json

# Suppress Hugging Face symlink warnings on Windows
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
# Suppress tokenizers parallelism warning
os.environ["TOKENIZERS_PARALLELISM"] = "false"
# Prevent Hugging Face from making network requests on startup to check for model updates
os.environ["TRANSFORMERS_OFFLINE"] = "1"
os.environ["HF_HUB_OFFLINE"] = "1"

# ---------------------------------------------------------------------------
# Dynamic Configuration
# ---------------------------------------------------------------------------
logger = logging.getLogger(__name__)
try:
    with open("weights.json", "r") as f:
        WEIGHTS = json.load(f)
except Exception:
    WEIGHTS = {"ml": 0.5, "symptom": 0.3, "disease": 0.2}

try:
    with open("canonical_diseases.json", "r") as f:
        CANONICAL_DISEASES = json.load(f)
except Exception:
    CANONICAL_DISEASES = {}

try:
    with open("data/icd_explanations.json", "r") as f:
        ICD_DATA = json.load(f)
except Exception:
    ICD_DATA = {}

try:
    with open("data/insurance_config.json", "r") as f:
        INSURANCE_CONFIG = json.load(f)
except Exception:
    INSURANCE_CONFIG = {
        "criticalPrefixes": ["2", "3", "8", "B", "C"],
        "infectiousPrefixes": ["1A", "1B", "1C", "1D", "1E", "1F"],
        "chronicKeywords": ["diabetes", "hypertension", "chronic", "syndrome", "failure", "cirrhosis"],
        "highRiskSymptoms": ["chest pain", "unconscious", "severe bleeding", "paralysis", "seizures", "breathlessness", "severe headache", "convulsions", "fracture"],
        "defaultDocuments": ["Doctor prescription", "Medical reports", "Identity proof"]
    }

try:
    with open("data/test_mapping.json", "r") as f:
        TEST_MAP = json.load(f)
except Exception:
    TEST_MAP = {}

# ---------------------------------------------------------------------------
# Synonym dictionary (shared with train.py)
# ---------------------------------------------------------------------------

SYNONYM_MAP = {
    "high temperature": "fever",
    "pyrexia": "fever",
    "cephalgia": "headache",
    "emesis": "vomiting",
    "nausea and vomiting": "nausea vomiting",
    "loose motions": "diarrhoea",
    "loose stools": "diarrhoea",
    "breathlessness": "shortness of breath",
    "dyspnoea": "shortness of breath",
    "chest tightness": "chest pain",
    "palpitation": "palpitations",
    "giddiness": "dizziness",
    "vertigo": "dizziness",
    "oedema": "swelling",
    "edema": "swelling",
    "haemorrhage": "bleeding",
    "hemorrhage": "bleeding",
    "micturition": "urination",
    "dysuria": "painful urination",
    "anorexia": "loss of appetite",
    "coryza": "runny nose cold",
    "rhinorrhoea": "runny nose",
    "horripilation": "goosebumps chills",
    "spasm": "muscle cramps",
    "stambha": "stiffness",
    "shotha": "swelling oedema",
    "jwara": "fever",
    "jvara": "fever",
    "shula": "pain",
    "atisara": "diarrhoea",
    "chardi": "vomiting",
    "kasa": "cough",
    "shvasa": "breathlessness difficulty breathing",
    "hikka": "hiccup",
    "aruchi": "tastelessness loss of appetite",
    "trishna": "thirst",
    "daha": "burning sensation",
    "pandu": "anaemia pallor",
    "kamala": "jaundice",
    "prameha": "diabetes urinary disorder",
    "kushtha": "skin disease",
    "visarpa": "cellulitis erysipelas",
    "gulma": "abdominal lump mass",
    "arsha": "haemorrhoids",
    "bhagandara": "fistula",
    "mutraghata": "urinary obstruction retention",
    "ashtheela": "prostatic enlargement",
    "gridhrasi": "sciatica",
    "ardita": "facial paralysis",
    "pakshaghata": "hemiplegia stroke paralysis",
    "apatantraka": "convulsions seizures",
    "unmada": "psychosis mental disorder",
    "apasmara": "epilepsy seizures",
    "vatarakta": "gout",
    "amavata": "rheumatoid arthritis",
    "sandhivata": "osteoarthritis",
}

STOPWORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "through", "during", "before", "after", "above", "below",
    "between", "and", "but", "or", "nor", "not", "so", "very", "just",
    "than", "too", "also", "both", "each", "few", "more", "most", "other",
    "some", "such", "no", "only", "own", "same", "this", "that", "these",
    "those", "it", "its", "he", "she", "they", "them", "their", "we",
    "you", "your", "my", "his", "her", "our", "me", "him", "us",
    "which", "who", "whom", "what", "when", "where", "why", "how",
    "all", "any", "if", "then", "because", "while", "about", "up",
    "out", "off", "over", "under", "again", "further", "once",
}

# We build MEDICAL_VOCAB dynamically at the bottom of the file from our JSON dataset
MEDICAL_VOCAB = set()

MIN_CONFIDENCE = 0.15

def normalize(text: str) -> str:
    if not text:
        return ""
    return text.lower().strip()

def preprocess_text(text: str) -> str:
    """Clean, normalize and reduce text for NLP processing."""
    text = normalize(text)
    if not text:
        return ""
    text = re.sub(r"\[([^\]]*)\]", r" \1 ", text)
    for old, new in SYNONYM_MAP.items():
        text = text.replace(old, new)
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    tokens = [t for t in text.split() if t not in STOPWORDS and len(t) > 1]
    return " ".join(tokens)

def fix_spelling(text: str) -> str:
    """Apply fuzzy matching to correct common misspellings."""
    words = text.split()
    corrected = []
    for word in words:
        if word in STOPWORDS or len(word) <= 2:
            corrected.append(word)
            continue
        matches = get_close_matches(word, MEDICAL_VOCAB, n=1, cutoff=0.75)
        if matches:
            corrected.append(matches[0])
        else:
            corrected.append(word)
    return " ".join(corrected)

# Phase 6.1 Bonus: Dynamically load symptoms for all diseases to fix overlap bug
# Phase 6.2 Bonus: Dynamically build spelling correction vocabulary from the dataset
try:
    with open("data/icd_symptom_database.json", "r") as f:
        __db = json.load(f)
        DISEASE_SYMPTOMS = {item["disease"].lower(): item["description"].split() for item in __db}
        # Build dynamic MEDICAL_VOCAB for spelling correction
        for item in __db:
            ICD_DATA[item["icd_code"]] = {
                "description": item["disease"],
                "usage": f"Used globally for clinical diagnosis, insurance claims, and epidemiological tracking of {item['disease'].lower()}."
            }
            for w in item["description"].split():
                if len(w) > 3:
                    MEDICAL_VOCAB.add(w)
        MEDICAL_VOCAB = list(MEDICAL_VOCAB)
except Exception:
    DISEASE_SYMPTOMS = {}
    MEDICAL_VOCAB = ["fever", "headache", "cough", "pain"]


def build_explanation(prediction, symptoms, disease_name, scores):
    try:
        reason = f"Prediction based on ML probability ({scores.get('mlScore', 0):.2f}), symptom overlap ({scores.get('symptomScore', 0):.2f}), and doctor input similarity ({scores.get('diseaseMatch', 0):.2f})"
        if symptoms and len(symptoms) > 0:
            symptom_match = f"Key contributing symptoms: {', '.join(symptoms[:3])}"
        else:
            symptom_match = "No strong symptom match identified"
        
        if disease_name:
            doctor_match = f"Doctor input matched with {scores.get('diseaseMatch', 0)*100:.0f}% similarity"
        else:
            doctor_match = "No doctor input provided"
            
        return {
            "predictionReason": reason[:300],
            "symptomMatch": symptom_match[:300],
            "doctorInputMatch": doctor_match[:300]
        }
    except Exception:
        return {
            "predictionReason": "Unable to generate explanation",
            "symptomMatch": "Unavailable",
            "doctorInputMatch": "Unavailable"
        }

def build_code_explanation(icd_code):
    try:
        data = ICD_DATA.get(icd_code, None)
        if not data:
            return {
              "icdDescription": "Unknown ICD code",
              "whyThisCode": "Mapped based on predicted disease classification",
              "clinicalUsage": "Used for general medical classification"
            }
        return {
            "icdDescription": str(data["description"])[:300],
            "whyThisCode": "This ICD-11 code is assigned because it corresponds to the predicted disease classification"[:300],
            "clinicalUsage": str(data["usage"])[:300]
        }
    except Exception:
        return {
            "icdDescription": "Unavailable",
            "whyThisCode": "Unavailable",
            "clinicalUsage": "Unavailable"
        }

def build_insurance_insights(icd_code, disease_name, confidence, symptoms):
    try:
        icd_code_str = str(icd_code).upper()
        if icd_code_str.startswith(tuple(INSURANCE_CONFIG.get("criticalPrefixes", []))):
            category = "Critical Illness"
        elif icd_code_str.startswith(tuple(INSURANCE_CONFIG.get("infectiousPrefixes", []))):
            category = "Infectious Disease"
        elif any(word in str(disease_name).lower() for word in INSURANCE_CONFIG.get("chronicKeywords", [])):
            category = "Chronic Disease"
        else:
            category = "General"

        if confidence > 0.8:
            probability = "High"
        elif confidence > 0.5:
            probability = "Medium"
        else:
            probability = "Low"

        documents = list(INSURANCE_CONFIG.get("defaultDocuments", []))
        if category == "Critical Illness":
            documents.extend(["Specialist report", "Hospital admission proof"])
            approval = "7-15 days"
        elif category == "Infectious Disease":
            approval = "3-7 days"
        elif category == "Chronic Disease":
            approval = "5-10 days"
        else:
            approval = "3-5 days"

        return {
            "claimProbability": probability,
            "claimCategory": category,
            "requiredDocuments": list(set(documents))[:5],
            "estimatedApprovalTime": approval
        }
    except Exception as e:
        logger.error(f"Insurance logic error: {e}")
        return {
            "claimProbability": "Low",
            "claimCategory": "General",
            "requiredDocuments": ["Doctor prescription", "Medical reports", "Identity proof"],
            "estimatedApprovalTime": "3-5 days"
        }

def build_ertc_insights(icd_code, symptoms, confidence):
    try:
        risk = "Low"
        high_risk = INSURANCE_CONFIG.get("highRiskSymptoms", [])
        if any(s in high_risk for s in symptoms):
            risk = "High"
        elif confidence > 0.75:
            risk = "Medium"

        if risk == "High":
            actions = ["Seek immediate medical attention", "Visit nearest hospital"]
            care_plan = "Immediate intervention required"
        elif risk == "Medium":
            actions = ["Consult doctor within 24-48 hours"]
            care_plan = "Medical evaluation recommended"
        else:
            actions = ["Monitor symptoms", "Consult if condition worsens"]
            care_plan = "Observation and basic care"

        tests = set()
        for s in symptoms:
            if s in TEST_MAP:
                tests.update(TEST_MAP[s])

        if not tests:
            tests.add("Basic health checkup")

        return {
            "riskLevel": risk,
            "earlyActions": actions[:5],
            "recommendedTests": list(tests)[:5],
            "carePlan": care_plan[:300]
        }
    except Exception as e:
        logger.error(f"ERTC logic error: {e}")
        return {
            "riskLevel": "Low",
            "earlyActions": ["Monitor symptoms"],
            "recommendedTests": ["Basic health checkup"],
            "carePlan": "Observation and basic care"
        }

def softmax(x):
    """Compute softmax values for each sets of scores in x."""
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum()

class NLPPredictor:
    """Hybrid NLP predictor: TF-IDF + optional Sentence-BERT re-ranking."""

    def __init__(self, model_path: str = "model.pkl"):
        self.model_bundle = None
        self.sbert_model = None
        self.sbert_available = False

        if os.path.exists(model_path):
            self.model_bundle = joblib.load(model_path)
            logger.info(f"Basic model loaded from {model_path}")
            metrics = self.model_bundle.get("metrics", {})
            logger.info(f"  Accuracy: {metrics.get('accuracy', 'N/A')}")
        else:
            logger.warning(f"Model file not found: {model_path}")

        self._load_sbert()

    def _load_sbert(self):
        try:
            from sentence_transformers import SentenceTransformer
            self.sbert_model = SentenceTransformer("all-MiniLM-L6-v2")
            self.sbert_available = True
            logger.info("Sentence-BERT (all-MiniLM-L6-v2) loaded for advanced re-ranking.")
        except ImportError:
            logger.warning("sentence-transformers not installed. Advanced model unavailable.")
        except Exception as e:
            logger.warning(f"Could not load Sentence-BERT: {e}")

    def predict_basic(self, symptoms: str, top_n: int = 5) -> List[Dict]:
        """
        Step 1: TF-IDF vectorization + Logistic Regression predict_proba
        Returns top_n predictions with real probability as confidence.
        """
        if not self.model_bundle:
            return []

        vectorizer = self.model_bundle.get("vectorizer")
        clf = self.model_bundle.get("classifier")
        code_to_meta = self.model_bundle.get("code_to_meta")
        
        if not vectorizer or not clf or not code_to_meta:
            logger.warning("Incompatible model.pkl format. Needs retrain.")
            return []

        # Preprocess
        processed = preprocess_text(fix_spelling(symptoms))
        if not processed.strip():
            return []

        # Predict probabilities
        query_vec = vectorizer.transform([processed])
        probs = clf.predict_proba(query_vec)[0]
        classes = clf.classes_

        # Get top-N indices sorted by probability
        top_indices = probs.argsort()[-top_n:][::-1]

        results = []
        user_symptoms = processed.split()

        for idx in top_indices:
            # Normalize ML score slightly (0.3 in a 100-class model is actually very high)
            raw_score = float(probs[idx])
            score = min(1.0, raw_score * 2.5) 
            
            code = classes[idx]
            meta = code_to_meta.get(code, {})
            
            disease_name = meta.get("icd_description", "Unknown")
            
            # Use actual symptoms if available, otherwise fallback to title words
            if disease_name.lower() in DISEASE_SYMPTOMS:
                disease_symptoms = DISEASE_SYMPTOMS[disease_name.lower()]
            else:
                disease_symptoms = disease_name.lower().split()
                
            matched = list(set(user_symptoms) & set(disease_symptoms))
            
            results.append({
                "icd_code": meta.get("icd_code", "UNK"),
                "disease": disease_name,
                "confidence": score, # Normalized score
                "raw_ml_confidence": raw_score,
                "namaste_code": code,
                "namaste_term": meta.get("namaste_term", "Unknown"),
                "english_disease": disease_name,
                "matchedSymptoms": matched,
                "isRelative": True
            })

        return results

    def rerank_with_sbert(self, symptoms: str, candidates: List[Dict]) -> List[Dict]:
        """Step 2: Re-rank candidates using Sentence-BERT cosine similarity."""
        if not self.sbert_available or not self.sbert_model or not candidates:
            return candidates

        try:
            from sentence_transformers import util as sbert_util

            symptom_embedding = self.sbert_model.encode(symptoms, convert_to_tensor=True)
            descriptions = [f"{c['namaste_term']}: {c['english_disease']}" for c in candidates]
            desc_embeddings = self.sbert_model.encode(descriptions, convert_to_tensor=True)

            cos_scores = sbert_util.cos_sim(symptom_embedding, desc_embeddings)[0].cpu().numpy()

            for i, candidate in enumerate(candidates):
                original_conf = candidate["confidence"]
                sbert_score = float(cos_scores[i])
                sbert_normalized = max(0.0, min(1.0, (sbert_score + 1) / 2))
                candidate["confidence"] = 0.6 * original_conf + 0.4 * sbert_normalized

            candidates.sort(key=lambda x: x["confidence"], reverse=True)
        except Exception as e:
            logger.warning(f"SBERT re-ranking failed: {e}")

        return candidates

    # Remove lru_cache because we are moving to aiocache at the endpoint level
    def predict(self, symptoms: str, disease_name: str = "", model_type: str = "advanced", top_n: int = 3, weights_override: dict = None) -> List[Dict]:
        """Main routing function. Optionally translates input, runs basic model, and conditionally reranks."""
        # --- Language Translation Layer ---
        import re
        if re.search(r"[^\x00-\x7F]", symptoms):
            try:
                from deep_translator import GoogleTranslator
                symptoms = GoogleTranslator(source='auto', target='en').translate(symptoms)
                logger.info(f"Translated Symptoms to English: {symptoms}")
            except Exception as e:
                logger.error(f"Translation failed for symptoms: {e}")
        
        if disease_name and re.search(r"[^\x00-\x7F]", disease_name):
            try:
                from deep_translator import GoogleTranslator
                disease_name = GoogleTranslator(source='auto', target='en').translate(disease_name)
                logger.info(f"Translated Disease to English: {disease_name}")
            except Exception as e:
                logger.error(f"Translation failed for disease: {e}")
        # ----------------------------------

        # Edge Case 1: Empty input
        if (not symptoms or len(symptoms.strip()) < 3) and not disease_name:
            return []
            
        # Canonical Disease Normalization
        if disease_name:
            norm_dn = disease_name.lower().strip()
            disease_name = CANONICAL_DISEASES.get(norm_dn, disease_name)

        # Edge Case 2: Only disease
        if not symptoms or len(symptoms.strip()) < 3:
            symptoms = disease_name

        symptoms = normalize(symptoms)
        if not symptoms:
            return []

        # Get top-10 initially to allow deduplication room
        basic_results = self.predict_basic(symptoms, top_n=10)
        
        if not basic_results:
            return []

        if model_type == "advanced" and self.sbert_available:
            reranked = self.rerank_with_sbert(symptoms, basic_results)
        else:
            reranked = basic_results

        # Deduplication
        seen = set()
        unique_results = []
        for item in reranked:
            if item['disease'] not in seen:
                unique_results.append(item)
                seen.add(item['disease'])
            if len(unique_results) == top_n * 2:
                break
                
        # Phase 4.3: Hybrid Scoring & Phase 4.4 Explainability
        final_results = []
        input_symptoms_count = max(1, len(symptoms.split()))
        
        for item in unique_results:
            ml_score = float(item['confidence'])
            overlap = len(item['matchedSymptoms']) / input_symptoms_count
            
            disease_similarity = 0.0
            if disease_name:
                disease_similarity = fuzz.ratio(disease_name.lower(), item['english_disease'].lower()) / 100.0
            
            # Contradiction Detection Penalty
            penalty = 0.0
            if disease_name and disease_similarity < 0.3:
                penalty = 0.15

            # Edge Case 3: Only symptoms (disease_similarity is 0)
            
            # Formula with dynamic weights
            current_weights = weights_override if weights_override else WEIGHTS
            w_ml = current_weights.get("ml", 0.5)
            w_sym = current_weights.get("symptom", 0.3)
            w_dis = current_weights.get("disease", 0.2)
            
            # If no disease name, distribute w_dis to w_ml and w_sym
            if not disease_name:
                w_ml += w_dis * (w_ml / (w_ml + w_sym))
                w_sym += w_dis * (w_sym / (w_ml + w_sym))
                w_dis = 0.0
                
            final_score = (w_ml * ml_score) + (w_sym * overlap) + (w_dis * disease_similarity) - penalty
            final_score = min(max(final_score, 0.0), 1.0)
            
            # Phase 4.5 Calibration
            calibrated_score = 1 / (1 + math.exp(-(final_score - 0.5) * 10))
            calibrated_score = max(0.0, min(calibrated_score, 1.0))
            
            item['confidence'] = round(calibrated_score, 4)
            
            # Confidence Breakdown
            item['confidenceBreakdown'] = {
                "mlScore": round(ml_score, 4),
                "symptomScore": round(overlap, 4),
                "diseaseMatch": round(disease_similarity, 4)
            }
            
            # Labels & Risk Level
            if calibrated_score > 0.8:
                label = "Highly Likely"
                risk = "HIGH"
                clinical = "Immediate medical confirmation required"
            elif calibrated_score > 0.5:
                label = "Possible"
                risk = "MEDIUM"
                clinical = "Further tests recommended"
            else:
                label = "Unlikely"
                risk = "LOW"
                clinical = "Low confidence prediction"
                
            item['confidenceLabel'] = label
            item['riskLevel'] = risk
            item['clinicalNote'] = clinical
            
            # Phase 6.1: Explanation Engine
            item['explanation'] = build_explanation(
                prediction=item['disease'],
                symptoms=item['matchedSymptoms'],
                disease_name=disease_name,
                scores=item['confidenceBreakdown']
            )
            item['codeExplanation'] = build_code_explanation(item.get('icd_code', ''))
            
            # Phase 6.2: Dynamic Insurance & ERTC Intelligence
            item['insuranceInsights'] = build_insurance_insights(
                icd_code=item.get('icd_code', ''),
                disease_name=item['disease'],
                confidence=calibrated_score,
                symptoms=item['matchedSymptoms']
            )
            item['ertcInsights'] = build_ertc_insights(
                icd_code=item.get('icd_code', ''),
                symptoms=item['matchedSymptoms'],
                confidence=calibrated_score
            )
            
            final_results.append(item)
            
        # Always return top 3 predictions as per instructions
        final_results.sort(key=lambda x: x["confidence"], reverse=True)
            
        return final_results[:top_n]

    @property
    def is_loaded(self) -> bool:
        return self.model_bundle is not None

    @property
    def model_info(self) -> dict:
        info = {
            "basic_model_loaded": self.model_bundle is not None,
            "advanced_model_loaded": self.sbert_available,
        }
        if self.model_bundle:
            info["metrics"] = self.model_bundle.get("metrics", {})
            info["num_classes"] = len(self.model_bundle.get("classes", []))
        return info
