import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { diagnosisAPI } from '../../api/api';
import { Stethoscope, Code2, Calendar, ChevronDown, BrainCircuit, Activity, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyDiagnoses() {
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    diagnosisAPI.getMyDiagnoses()
      .then(res => setDiagnoses(res.data))
      .catch(() => toast.error('Failed to load diagnoses'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><Stethoscope className="w-6 h-6 text-primary-500" /> My Diagnoses</h1>
        <p className="page-subtitle">Your complete diagnosis history</p>
      </div>

      {diagnoses.length === 0 ? (
        <div className="glass-card p-12 text-center"><Stethoscope className="w-12 h-12 text-dark-700 mx-auto mb-3" /><div className="text-dark-400">No diagnoses found</div></div>
      ) : (
        <div className="space-y-4">
          {diagnoses.map((d, idx) => {
            const isOpen = expanded === d.id;
            return (
              <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="glass-card overflow-hidden border-l-4 border-l-primary-500">
                <button className="w-full flex items-center justify-between p-4 hover:bg-dark-700/20 text-left" onClick={() => setExpanded(isOpen ? null : d.id)}>
                  <div>
                    <div className="text-lg font-bold text-dark-50">{d.predictedDisease}</div>
                    <div className="text-xs text-dark-500 flex items-center gap-1 mt-1"><Calendar className="w-3 h-3" /> {formatDate(d.createdAt)}</div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-dark-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-4 pb-4 border-t border-dark-800 pt-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-dark-500 mb-1">Symptoms</div>
                        <div className="text-sm text-dark-200 bg-dark-800/50 p-2.5 rounded">{d.symptoms}</div>
                      </div>
                      <div>
                        <div className="text-xs text-dark-500 mb-1">ICD-11 Code</div>
                        <div className="flex items-center gap-2 bg-cyan-900/10 p-2.5 rounded border border-cyan-800/30 h-[40px]">
                          <Code2 className="w-4 h-4 text-cyan-500" />
                          <div>
                            <div className="font-mono font-bold text-cyan-100 leading-tight">{d.icdCode || 'N/A'}</div>
                            {d.icdTitle && <div className="text-[10px] text-cyan-400/80 leading-tight truncate max-w-[200px]">{d.icdTitle}</div>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Insights Section */}
                    {(() => {
                      let explanation, ertc, insurance;
                      try { if (d.aiExplanationJson) explanation = JSON.parse(d.aiExplanationJson); } catch(e){}
                      try { if (d.ertcJson) ertc = JSON.parse(d.ertcJson); } catch(e){}
                      try { if (d.insuranceJson) insurance = JSON.parse(d.insuranceJson); } catch(e){}

                      if (!explanation && !ertc && !insurance) return null;

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          {/* AI Explanation Widget */}
                          {explanation && (
                            <div className="glass-card p-3 border border-primary-500/30 bg-primary-900/10 col-span-1 sm:col-span-2">
                              <div className="flex items-center gap-2 mb-2">
                                <BrainCircuit className="w-4 h-4 text-primary-400" />
                                <div className="text-xs font-semibold text-primary-400 uppercase tracking-wider">AI Explanation</div>
                              </div>
                              <div className="text-xs text-dark-300 space-y-1">
                                <div className="flex gap-2"><span className="shrink-0 font-medium text-primary-400/70">Reason:</span><span>{explanation.reason}</span></div>
                                <div className="flex gap-2"><span className="shrink-0 font-medium text-primary-400/70">Key Symptoms:</span><span>{explanation.matched_symptoms}</span></div>
                              </div>
                            </div>
                          )}

                          {/* ERTC Widget */}
                          {ertc && (
                            <div className="glass-card p-3 border border-orange-800/30 bg-orange-900/10">
                              <div className="flex items-center gap-2 mb-2">
                                <Activity className="w-4 h-4 text-orange-400" />
                                <div className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Estimated Time to Cure</div>
                              </div>
                              <div className="text-xs text-dark-300 space-y-1">
                                <div className="flex gap-2"><span className="shrink-0 font-medium text-orange-400/70">Risk Level:</span><span className={`font-semibold ${ertc.riskLevel?.toLowerCase() === 'high' ? 'text-red-400' : ertc.riskLevel?.toLowerCase() === 'moderate' ? 'text-yellow-400' : 'text-green-400'}`}>{ertc.riskLevel}</span></div>
                                <div className="flex gap-2"><span className="shrink-0 font-medium text-orange-400/70">Care Plan:</span><span>{ertc.carePlan}</span></div>
                                <div className="flex gap-2"><span className="shrink-0 font-medium text-orange-400/70">Tests:</span><span>{ertc.recommendedTests?.join(', ')}</span></div>
                              </div>
                            </div>
                          )}

                          {/* Insurance Widget */}
                          {insurance && (
                            <div className="glass-card p-3 border border-blue-800/30 bg-blue-900/10">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-blue-400" />
                                <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Insurance Intelligence</div>
                              </div>
                              <div className="text-xs text-dark-300 space-y-1">
                                <div className="flex gap-2"><span className="shrink-0 font-medium text-blue-400/70">Category:</span><span>{insurance.claimCategory}</span></div>
                                <div className="flex gap-2"><span className="shrink-0 font-medium text-blue-400/70">Docs Required:</span><span>{insurance.requiredDocuments?.join(', ')}</span></div>
                                {insurance.claimProbability && <div className="flex gap-2"><span className="shrink-0 font-medium text-blue-400/70">Approval Probability:</span><span className="font-semibold text-blue-300">{insurance.claimProbability}</span></div>}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-dark-800/50 mt-2">
                      <div>
                        <div className="text-xs text-dark-500 mb-1">Consulting Doctor</div>
                        <div className="text-sm text-dark-200 font-semibold">
                          Dr. {d.doctorName || 'N/A'} 
                          {d.hospitalName && <span className="text-xs text-dark-400 block font-normal">{d.hospitalName}</span>}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-dark-500 mb-1">Prescribed Medicines</div>
                        <div className="text-sm text-amber-300 font-medium">
                          {d.medicines ? d.medicines : 'No medicines prescribed yet'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}
