import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { diagnosisAPI } from '../../api/api';
import { Stethoscope, Code2, Search, Calendar, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DiagnosisHistory() {
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    diagnosisAPI.getMyDoctorDiagnoses()
      .then(res => setDiagnoses(res.data))
      .catch(() => toast.error('Failed to load diagnoses'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = diagnoses.filter(d =>
    d.predictedDisease?.toLowerCase().includes(search.toLowerCase()) ||
    d.icdCode?.toLowerCase().includes(search.toLowerCase()) ||
    d.symptoms?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-primary-500" />
          Diagnosis History
        </h1>
        <p className="page-subtitle">All diagnoses you've performed</p>
      </div>

      {/* Search */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type="text"
            className="input-field pl-10"
            placeholder="Search by disease, ICD code, or symptoms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="search-diagnoses"
          />
        </div>
      </div>

      <div className="text-xs text-dark-500">{filtered.length} diagnosis records</div>

      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Stethoscope className="w-12 h-12 text-dark-700 mx-auto mb-3" />
          <div className="text-dark-400">No diagnoses found</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d, idx) => {
            const isOpen = expanded === d.id;
            const confidence = Math.round((d.confidenceScore || 0) * 100);
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card overflow-hidden"
              >
                <button
                  className="w-full flex items-center gap-4 p-4 hover:bg-dark-700/20 transition-colors text-left"
                  onClick={() => setExpanded(isOpen ? null : d.id)}
                >
                  <div className="w-10 h-10 bg-primary-900/40 rounded-xl flex items-center justify-center shrink-0">
                    <Stethoscope className="w-5 h-5 text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-dark-100">{d.predictedDisease}</div>
                    <div className="text-xs text-dark-500 flex items-center gap-2 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {formatDate(d.createdAt)}
                      <span>•</span>
                      Patient #{d.patientId}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {d.icdCode && d.icdCode !== 'N/A' && (
                      <span className="badge-primary hidden sm:flex">{d.icdCode}</span>
                    )}
                    <span className={`text-xs font-bold ${confidence >= 80 ? 'text-emerald-400' : confidence >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                      {confidence}%
                    </span>
                    <ChevronDown className={`w-4 h-4 text-dark-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-dark-700/50 px-4 pb-4 pt-3 space-y-3"
                  >
                    <div>
                      <div className="text-xs text-dark-500 mb-1">Symptoms Reported</div>
                      <div className="text-sm text-dark-200 bg-dark-800/50 rounded-lg p-3">{d.symptoms}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-dark-500 mb-1">ICD-11 Code</div>
                        <div className="flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-cyan-500" />
                          <span className="font-mono font-bold text-dark-100">{d.icdCode || 'N/A'}</span>
                        </div>
                        {d.icdTitle && <div className="text-xs text-dark-400 mt-0.5">{d.icdTitle}</div>}
                      </div>
                      <div>
                        <div className="text-xs text-dark-500 mb-1">Confidence</div>
                        <div className="space-y-1">
                          <div className="confidence-bar">
                            <div
                              className={`confidence-fill ${confidence >= 80 ? 'bg-emerald-500' : confidence >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${confidence}%` }}
                            />
                          </div>
                          <span className={`text-sm font-bold ${confidence >= 80 ? 'text-emerald-400' : confidence >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                            {confidence}%
                          </span>
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
  return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
