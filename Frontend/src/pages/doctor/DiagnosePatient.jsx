import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { diagnosisAPI, prescriptionAPI, userAPI } from '../../api/api';
import { Stethoscope, Brain, Code2, CheckCircle2, Loader2, AlertCircle, Plus, X, Pill, Languages, BarChart3, TrendingUp, FileText, Clock, ShieldCheck, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Phase 4: Colour coding for confidence tiers ─────────────────────────────
function getConfidenceMeta(score, label) {
  const pct = Math.round(score * 100);
  const displayLabel = label || (pct >= 75 ? 'Highly Likely' : pct >= 40 ? 'Possible' : 'Unlikely');
  if (pct >= 75) return { pct, label: displayLabel, barCls: 'bg-emerald-500', textCls: 'text-emerald-400', badgeCls: 'bg-emerald-900/40 text-emerald-400' };
  if (pct >= 40) return { pct, label: displayLabel, barCls: 'bg-amber-500', textCls: 'text-amber-400', badgeCls: 'bg-amber-900/40 text-amber-400' };
  return { pct, label: displayLabel, barCls: 'bg-red-500', textCls: 'text-red-400', badgeCls: 'bg-red-900/40 text-red-400' };
}

export default function DiagnosePatient() {
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ patientId: '', symptoms: '', diseaseInput: '', language: 'en', severity: '', duration: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [showPrescription, setShowPrescription] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({ medicines: '', notes: '' });
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    userAPI.getByRole('PATIENT')
      .then(res => setPatients(res.data))
      .catch(() => toast.error('Failed to load patients'))
      .finally(() => setLoadingPatients(false));
      
    // Fetch system accuracy metrics
    fetch('http://localhost:8080/api/feedback/metrics', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => console.error('Failed to fetch metrics', err));
  }, []);

  const handleDiagnose = async (e) => {
    e.preventDefault();
    if (!form.patientId) { toast.error('Please select a patient'); return; }
    if (!form.symptoms.trim()) { toast.error('Please enter symptoms'); return; }
    if (form.symptoms.length > 200) { toast.error('Input too long'); return; }

    setLoading(true);
    setResult(null);
    setShowPrescription(false);

    try {
      const res = await diagnosisAPI.create({
        patientId: parseInt(form.patientId),
        symptoms: form.symptoms,
        diseaseName: form.diseaseInput || undefined,
        language: form.language,
        severity: form.severity || undefined,
        duration: form.duration || undefined,
      });
      setResult(res.data);
      setResult(res.data);
      if (res.data?.mlPredictions && res.data.mlPredictions.length > 0) {
          const disease = res.data.mlPredictions[0].disease;
          if (disease === 'Too Many Requests') {
              toast.error('Too many requests. Please wait.');
          } else if (disease === 'Unknown (Service Error)') {
              toast.error('AI Service is temporarily unavailable');
          } else {
              toast.success('Diagnosis completed!');
          }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Diagnosis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrescription = async (e) => {
    e.preventDefault();
    if (!prescriptionForm.medicines.trim()) { toast.error('Please enter medicines'); return; }
    setSavingPrescription(true);
    try {
      await prescriptionAPI.create({
        diagnosisId: result.id,
        patientId: result.patientId,
        medicines: prescriptionForm.medicines,
        notes: prescriptionForm.notes,
      });
      toast.success('Prescription saved!');
      setShowPrescription(false);
      setPrescriptionForm({ medicines: '', notes: '' });
    } catch (err) {
      toast.error('Failed to save prescription');
    } finally {
      setSavingPrescription(false);
    }
  };

  // Phase 3: full predictions list from API response
  const mlPredictions = [...(result?.mlPredictions || [])].sort((a, b) => b.confidence - a.confidence);

  // Top prediction confidence for the main bar
  const confidence = result ? Math.round((result.confidenceScore || 0) * 100) : 0;
  const confidenceColor = confidence >= 75 ? 'bg-emerald-500' : confidence >= 40 ? 'bg-amber-500' : 'bg-red-500';
  const confidenceLabel = mlPredictions[0]?.confidenceLabel || (confidence >= 75 ? 'Highly Likely' : confidence >= 40 ? 'Possible' : 'Unlikely');

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-primary-500" />
          AI Diagnosis
        </h1>
        <p className="page-subtitle">Enter patient symptoms to get AI-powered disease prediction and ICD-11 code</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diagnosis Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6"
        >
          <h2 className="text-base font-semibold text-dark-100 mb-5">Diagnosis Form</h2>
          <form onSubmit={handleDiagnose} className="space-y-4">
            <div className="form-group">
              <label className="input-label">Select Patient</label>
              {loadingPatients ? (
                <div className="input-field flex items-center gap-2 text-dark-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading patients...
                </div>
              ) : (
                <select
                  className="input-field"
                  value={form.patientId}
                  onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                  id="select-patient"
                >
                  <option value="">-- Select a patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (ID: {p.id})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label className="input-label">Symptoms</label>
              <textarea
                className="input-field resize-none"
                rows={6}
                placeholder={"Describe patient symptoms in detail...\ne.g., fever, headache, fatigue, cough for 3 days"}
                value={form.symptoms}
                onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                id="symptoms-input"
              />
              <div className="text-xs text-dark-600 mt-1">{form.symptoms.length} characters</div>
            </div>

            {/* Optional Context: Duration and Severity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="input-label">Duration (Optional)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 2 weeks"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  maxLength={50}
                />
              </div>
              <div className="form-group">
                <label className="input-label">Severity (Optional)</label>
                <select
                  className="input-field"
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                >
                  <option value="">-- Select --</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Phase 1: Optional Doctor Disease Input */}
            <div className="p-4 rounded-xl bg-dark-800/30 border border-dark-700/50 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Languages className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-semibold text-dark-300 uppercase tracking-wider">Doctor Diagnosis (Optional)</span>
              </div>
              <div className="form-group">
                <label className="input-label">Disease Name in Your Language</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter diagnosis in your language (e.g., ताप / ज्वर / Fever)"
                  value={form.diseaseInput}
                  onChange={(e) => setForm({ ...form, diseaseInput: e.target.value })}
                  id="disease-input"
                />
              </div>
              <div className="form-group">
                <label className="input-label">Input Language</label>
                <select
                  className="input-field"
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  id="language-select"
                >
                  <option value="en">English</option>
                  <option value="mr">Marathi (मराठी)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3"
              id="diagnose-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing symptoms...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Run AI Diagnosis
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Results Panel */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {/* Skeleton for Primary Prediction */}
                <div className="glass-card p-5 border border-primary-800/30 animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary-900/40 rounded-xl shrink-0 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                    </div>
                    <div className="flex-1 space-y-3 py-1">
                      <div className="h-3 bg-dark-700 rounded w-1/4"></div>
                      <div className="h-6 bg-dark-600 rounded w-3/4"></div>
                      <div className="h-2 bg-dark-700 rounded w-full mt-4"></div>
                    </div>
                  </div>
                </div>
                {/* Skeleton for Top 3 List */}
                <div className="glass-card p-5 border border-violet-800/30 animate-pulse space-y-4">
                  <div className="h-4 bg-dark-700 rounded w-1/3 mb-2"></div>
                  <div className="h-16 bg-dark-800 rounded-xl w-full"></div>
                  <div className="h-16 bg-dark-800 rounded-xl w-full"></div>
                  <div className="h-16 bg-dark-800 rounded-xl w-full"></div>
                </div>
              </motion.div>
            )}

            {result && !loading && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {mlPredictions.length === 0 ? (
                  <div className="glass-card p-8 flex flex-col items-center justify-center gap-3 min-h-64 text-center border border-dashed border-red-800/30 empty-state">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                    <div className="text-red-400 text-sm">
                      <div className="font-medium text-red-300 mb-1">No strong diagnosis found.</div>
                      Please refine symptoms or consult a doctor.
                    </div>
                  </div>
                ) : (
                  <>
                {/* Primary Disease Prediction */}
                <div className="glass-card p-5 border border-primary-800/30">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary-900/40 rounded-xl flex items-center justify-center shrink-0">
                      <Brain className="w-5 h-5 text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-1">AI Predicted Disease</div>
                      <div className="text-xl font-bold text-dark-50 mb-3">{result.predictedDisease}</div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-dark-400">Confidence Score</span>
                          <span className={`font-bold ${confidence >= 75 ? 'text-emerald-400' : confidence >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                            {confidence}% ({confidenceLabel})
                          </span>
                        </div>
                        <div className="confidence-bar">
                          <motion.div
                            className={`confidence-fill ${confidenceColor}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${confidence}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                          />
                        </div>
                      </div>
                      
                      {/* Clinical Note & Risk */}
                      {mlPredictions[0] && mlPredictions[0].riskLevel && (
                        <div className={`mt-3 p-2 rounded-lg border text-xs flex flex-col gap-1
                          ${mlPredictions[0].riskLevel === 'HIGH' ? 'bg-red-900/20 border-red-800/40 text-red-400' :
                            mlPredictions[0].riskLevel === 'MEDIUM' ? 'bg-amber-900/20 border-amber-800/40 text-amber-400' :
                            mlPredictions[0].riskLevel === 'UNKNOWN' ? 'bg-dark-800/50 border-dark-700/50 text-dark-400' :
                            'bg-emerald-900/20 border-emerald-800/40 text-emerald-400'}`}
                        >
                          <div className="flex items-center gap-1 font-bold uppercase">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {mlPredictions[0].riskLevel} RISK
                          </div>
                          <div>{mlPredictions[0].clinicalNote}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ─── Phase 3: Top 3 ML Predictions Panel ─────────────────── */}
                {mlPredictions.length > 0 && (
                  <div className="glass-card p-5 border border-violet-800/30">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-violet-900/40 rounded-lg flex items-center justify-center shrink-0">
                        <BarChart3 className="w-4 h-4 text-violet-400" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Top 3 AI Predictions</div>
                        <div className="text-xs text-dark-500">Real probability distribution from ML model</div>
                      </div>
                    </div>

                    <div className="space-y-3" id="ml-predictions-list">
                      {mlPredictions.map((pred, idx) => {
                        const meta = getConfidenceMeta(pred.confidence, pred.confidenceLabel);
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.12 }}
                            className={`rounded-xl p-3 border ${
                              idx === 0
                                ? 'border-violet-600/40 bg-violet-900/20'
                                : 'border-dark-700/40 bg-dark-800/30'
                            }`}
                            id={`prediction-${idx + 1}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                  idx === 0 ? 'bg-violet-500 text-white' : 'bg-dark-700 text-dark-300'
                                }`}>
                                  {idx + 1}
                                </span>
                                <div>
                                  <div className="text-sm font-semibold text-dark-100 leading-tight">{pred.disease}</div>
                                  {pred.icdCode && pred.icdCode !== 'N/A' && (
                                    <div className="text-xs text-dark-500 font-mono">ICD: {pred.icdCode}</div>
                                  )}
                                </div>
                              </div>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${meta.badgeCls}`}>
                                {meta.pct}% ({meta.label})
                              </span>
                            </div>

                            {/* Confidence bar for each prediction */}
                            <div className="w-full bg-dark-800 rounded-full h-1.5 overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${meta.barCls}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${meta.pct}%` }}
                                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 + idx * 0.1 }}
                              />
                            </div>

                              {/* Namaste code info */}
                            {pred.namasteTerm && pred.namasteTerm !== 'N/A' && (
                              <div className="mt-1.5 text-xs text-dark-500">
                                NAMC: <span className="text-dark-400">{pred.namasteTerm}</span>
                                {pred.namasteCode && pred.namasteCode !== 'N/A' && (
                                  <span className="ml-1 font-mono text-dark-600">({pred.namasteCode})</span>
                                )}
                              </div>
                            )}

                            {/* Matched Symptoms Tags */}
                            {pred.matchedSymptoms && pred.matchedSymptoms.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                <span className="text-[10px] uppercase text-dark-500 mr-1 flex items-center">Symptoms:</span>
                                {pred.matchedSymptoms.map((sym, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-dark-700/50 text-dark-300 border border-dark-600/50">
                                    {sym}
                                  </span>
                                ))}
                              </div>
                            )}
                            {/* Confidence Breakdown */}
                            {pred.confidenceBreakdown && (
                              <div className="mt-2 grid grid-cols-3 gap-2">
                                <div className="text-[10px] text-dark-400 text-center bg-dark-900/50 p-1 rounded border border-dark-800">
                                  <div className="uppercase tracking-wider opacity-60">ML Score</div>
                                  <div className="font-mono text-dark-300">{Math.round(pred.confidenceBreakdown.mlScore * 100)}%</div>
                                </div>
                                <div className="text-[10px] text-dark-400 text-center bg-dark-900/50 p-1 rounded border border-dark-800">
                                  <div className="uppercase tracking-wider opacity-60">Symptoms</div>
                                  <div className="font-mono text-dark-300">{Math.round(pred.confidenceBreakdown.symptomScore * 100)}%</div>
                                </div>
                                <div className="text-[10px] text-dark-400 text-center bg-dark-900/50 p-1 rounded border border-dark-800">
                                  <div className="uppercase tracking-wider opacity-60">Doc Match</div>
                                  <div className="font-mono text-dark-300">{Math.round(pred.confidenceBreakdown.diseaseMatch * 100)}%</div>
                                </div>
                              </div>
                            )}
                            {/* Phase 6.1: Explainable AI Block */}
                            {pred.explanation && (
                              <div className="mt-3 p-3 bg-dark-900/50 rounded-lg border border-dark-700/50 space-y-2">
                                <div className="text-[10px] font-semibold text-primary-400 uppercase tracking-wider">AI Explanation</div>
                                <div className="text-xs text-dark-300 space-y-1">
                                  <div className="flex gap-2">
                                    <span className="shrink-0 font-medium text-dark-400">Reason:</span>
                                    <span>{pred.explanation.predictionReason || 'Not available'}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="shrink-0 font-medium text-dark-400">Symptoms:</span>
                                    <span>{pred.explanation.symptomMatch || 'Not available'}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="shrink-0 font-medium text-dark-400">Doctor Input:</span>
                                    <span>{pred.explanation.doctorInputMatch || 'Not available'}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Phase 6.1: ICD Explanation Block */}
                            {pred.codeExplanation && (
                              <div className="mt-2 p-3 bg-cyan-900/20 rounded-lg border border-cyan-800/40 space-y-2">
                                <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                                  <Code2 className="w-3 h-3" /> ICD-11 Context
                                </div>
                                <div className="text-xs text-dark-300 space-y-1">
                                  <div className="flex gap-2">
                                    <span className="shrink-0 font-medium text-cyan-500/70">Description:</span>
                                    <span>{pred.codeExplanation.icdDescription || 'Not available'}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="shrink-0 font-medium text-cyan-500/70">Clinical Usage:</span>
                                    <span>{pred.codeExplanation.clinicalUsage || 'Not available'}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Phase 6.2: ERTC Insights Block */}
                            {pred.ertcInsights && (
                              <div className={`mt-2 p-3 rounded-lg border space-y-2 ${
                                pred.ertcInsights.riskLevel === 'High' ? 'bg-red-900/20 border-red-800/40' : 
                                pred.ertcInsights.riskLevel === 'Medium' ? 'bg-orange-900/20 border-orange-800/40' : 
                                'bg-emerald-900/20 border-emerald-800/40'
                              }`}>
                                <div className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${
                                  pred.ertcInsights.riskLevel === 'High' ? 'text-red-400' : 
                                  pred.ertcInsights.riskLevel === 'Medium' ? 'text-orange-400' : 
                                  'text-emerald-400'
                                }`}>
                                  <AlertCircle className="w-3 h-3" /> ERTC Risk: {pred.ertcInsights.riskLevel}
                                </div>
                                <div className="text-xs text-dark-300 space-y-1">
                                  <div className="flex gap-2">
                                    <span className="shrink-0 font-medium opacity-70">Care Plan:</span>
                                    <span>{pred.ertcInsights.carePlan}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="shrink-0 font-medium opacity-70">Recommended Tests:</span>
                                    <span>{pred.ertcInsights.recommendedTests?.join(', ')}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Phase 6.2: Insurance Insights Block */}
                            {pred.insuranceInsights && (
                              <div className="mt-2 p-3 bg-blue-900/20 rounded-lg border border-blue-800/40 space-y-2">
                                <div className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                                  <FileText className="w-3 h-3" /> Insurance Intelligence
                                </div>
                                <div className="text-xs text-dark-300 space-y-1">
                                  <div className="flex gap-2">
                                    <span className="shrink-0 font-medium text-blue-500/70">Category:</span>
                                    <span>{pred.insuranceInsights.claimCategory}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="shrink-0 font-medium text-blue-500/70">Required Docs:</span>
                                    <span>{pred.insuranceInsights.requiredDocuments?.join(', ')}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Confidence sum note */}
                    <div className="mt-3 pt-3 border-t border-dark-700/40 flex items-center gap-2 text-xs text-dark-500">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Matches based on historical data patterns · Values differ per disease
                    </div>
                  </div>
                )}
                {/* ─────────────────────────────────────────────────────────── */}

                {/* Trace ID & Model Version */}
                <div className="flex items-center justify-between text-[10px] text-dark-600 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    {result.traceId && <span>Trace ID: {result.traceId}</span>}
                    {result.traceId && result.modelVersion && <span>•</span>}
                    {result.modelVersion && <span>Model: {result.modelVersion}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    {result.latencyMs !== undefined && (
                      <div className="flex items-center gap-1 text-cyan-400/80">
                        <AlertCircle className="w-3 h-3" />
                        Response Time: {result.latencyMs}ms
                      </div>
                    )}
                    {metrics && metrics.total_entries > 0 && (
                      <div className="flex items-center gap-1 text-primary-400/80">
                        <BarChart3 className="w-3 h-3" />
                        System Accuracy: {metrics.accuracy}%
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* NAMASTE Code */}
                  <div className="glass-card p-4 border border-violet-800/30">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-violet-900/30 rounded-xl flex items-center justify-center shrink-0">
                        <Languages className="w-4 h-4 text-violet-400" />
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-violet-500 uppercase tracking-wider mb-1">NAMASTE Code</div>
                        <div className="text-lg font-mono font-bold text-dark-50">{mlPredictions[0]?.namasteCode || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* ICD-11 Code */}
                  <div className="glass-card p-4 border border-cyan-800/30">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-cyan-900/30 rounded-xl flex items-center justify-center shrink-0">
                        <Code2 className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-cyan-500 uppercase tracking-wider mb-1">ICD-11 Code</div>
                        <div className="text-lg font-mono font-bold text-dark-50">{result.icdCode}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phase 6.2: Primary ERTC Insights */}
                {mlPredictions[0]?.ertcInsights && (
                  <div className="glass-card p-5 border border-orange-800/30 mt-3">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-orange-900/40 rounded-lg flex items-center justify-center shrink-0">
                        <Activity className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Estimated Time to Cure (ERTC)</div>
                        <div className="text-xs text-dark-500">AI-driven care plan and recovery estimation</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="text-sm">
                          <span className="text-dark-400">Risk Level: </span>
                          <span className={`font-bold ${
                            mlPredictions[0].ertcInsights.riskLevel === 'High' ? 'text-red-400' :
                            mlPredictions[0].ertcInsights.riskLevel === 'Medium' ? 'text-orange-400' :
                            'text-emerald-400'
                          }`}>{mlPredictions[0].ertcInsights.riskLevel}</span>
                        </div>
                        <div>
                          <div className="text-xs text-dark-400 mb-1">Care Plan</div>
                          <div className="text-sm text-dark-100">{mlPredictions[0].ertcInsights.carePlan}</div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {mlPredictions[0].ertcInsights.earlyActions?.length > 0 && (
                          <div>
                            <div className="text-xs text-dark-400 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Early Actions</div>
                            <ul className="text-sm text-dark-100 list-disc list-inside">
                              {mlPredictions[0].ertcInsights.earlyActions.map((action, i) => (
                                <li key={i}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {mlPredictions[0].ertcInsights.recommendedTests?.length > 0 && (
                          <div>
                            <div className="text-xs text-dark-400 mb-1">Recommended Tests</div>
                            <div className="flex flex-wrap gap-1.5">
                              {mlPredictions[0].ertcInsights.recommendedTests.map((test, i) => (
                                <span key={i} className="px-2 py-0.5 rounded text-xs bg-dark-800 text-dark-300 border border-dark-700">
                                  {test}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Phase 6.2: Primary Insurance Insights */}
                {mlPredictions[0]?.insuranceInsights && (
                  <div className="glass-card p-5 border border-blue-800/30 mt-3">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-blue-900/40 rounded-lg flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Insurance Intelligence</div>
                        <div className="text-xs text-dark-500">Automated claim probability and requirements</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-dark-900/50 rounded-lg border border-dark-800">
                        <div className="text-[10px] text-dark-400 uppercase tracking-wider mb-1">Claim Category</div>
                        <div className="text-sm font-medium text-dark-100">{mlPredictions[0].insuranceInsights.claimCategory}</div>
                      </div>
                      <div className="p-3 bg-dark-900/50 rounded-lg border border-dark-800">
                        <div className="text-[10px] text-dark-400 uppercase tracking-wider mb-1">Probability</div>
                        <div className={`text-sm font-bold ${
                          mlPredictions[0].insuranceInsights.claimProbability === 'High' ? 'text-emerald-400' :
                          mlPredictions[0].insuranceInsights.claimProbability === 'Medium' ? 'text-amber-400' :
                          'text-red-400'
                        }`}>{mlPredictions[0].insuranceInsights.claimProbability}</div>
                      </div>
                      <div className="p-3 bg-dark-900/50 rounded-lg border border-dark-800 col-span-2">
                        <div className="text-[10px] text-dark-400 uppercase tracking-wider mb-1">Est. Approval Time</div>
                        <div className="text-sm font-medium text-dark-100 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          {mlPredictions[0].insuranceInsights.estimatedApprovalTime}
                        </div>
                      </div>
                    </div>
                    
                    {mlPredictions[0].insuranceInsights.requiredDocuments?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-dark-800/50">
                        <div className="text-xs text-dark-400 mb-2 flex items-center gap-1"><FileText className="w-3 h-3" /> Required Documents for Claim</div>
                        <div className="flex flex-wrap gap-2">
                          {mlPredictions[0].insuranceInsights.requiredDocuments.map((doc, i) => (
                            <div key={i} className="text-xs flex items-center gap-1.5 bg-blue-900/10 text-blue-300 px-2.5 py-1 rounded-md border border-blue-800/30">
                              <CheckCircle2 className="w-3 h-3 text-blue-500" />
                              {doc}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Saved confirmation */}
                <div className="glass-card p-4 border border-emerald-800/30">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-medium">Diagnosis saved to patient record</span>
                  </div>
                  <div className="text-xs text-dark-500 mt-1">Diagnosis ID: #{result.id}</div>
                </div>

                {/* Medical Disclaimer */}
                <div className="p-3 bg-amber-900/20 border border-amber-800/40 rounded-xl flex items-start gap-2 mt-4">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-400/90 leading-relaxed">
                    This is an AI-assisted prediction and not a medical diagnosis. Please consult a qualified doctor.
                  </div>
                </div>

                {/* Create Prescription CTA */}
                <button
                  className="btn-primary w-full justify-center py-3"
                  onClick={() => setShowPrescription(true)}
                  id="create-prescription-btn"
                >
                  <Pill className="w-4 h-4" />
                  Create Prescription
                </button>
                </>
                )}
              </motion.div>
            )}

            {!result && !loading && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-8 flex flex-col items-center justify-center gap-3 min-h-64 text-center border border-dashed border-dark-700"
              >
                <Brain className="w-12 h-12 text-dark-700" />
                <div className="text-dark-500 text-sm">
                  <div className="font-medium text-dark-400 mb-1">No diagnosis yet</div>
                  Select a patient and enter symptoms to begin
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Prescription Modal */}
      <AnimatePresence>
        {showPrescription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-dark-100 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-amber-400" />
                  Create Prescription
                </h3>
                <button className="btn-icon" onClick={() => setShowPrescription(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-dark-800/80 rounded-lg">
                <div className="text-xs text-dark-500">For diagnosis</div>
                <div className="text-sm font-medium text-dark-100">{result?.predictedDisease} • ID #{result?.id}</div>
              </div>

              <form onSubmit={handleSavePrescription} className="space-y-4">
                <div className="form-group">
                  <label className="input-label">Medicines</label>
                  <textarea
                    className="input-field resize-none"
                    rows={4}
                    placeholder={"List medicines, dosage, and frequency...\ne.g., Paracetamol 500mg - 3 times daily\nVitamin C 1000mg - once daily"}
                    value={prescriptionForm.medicines}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medicines: e.target.value })}
                    id="prescription-medicines"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Doctor's Notes (Optional)</label>
                  <textarea
                    className="input-field resize-none"
                    rows={2}
                    placeholder="Additional instructions..."
                    value={prescriptionForm.notes}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}
                    id="prescription-notes"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowPrescription(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={savingPrescription} className="btn-primary flex-1 justify-center" id="save-prescription-btn">
                    {savingPrescription ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><CheckCircle2 className="w-4 h-4" /> Save Prescription</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
