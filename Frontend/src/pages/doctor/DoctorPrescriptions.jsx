import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { prescriptionAPI, doctorAPI } from '../../api/api';
import { Pill, Clock, CheckCircle2, Search, Calendar, HelpCircle, Check, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DoctorPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [processingId, setProcessingId] = useState(null);

  const loadData = async () => {
    try {
      const [presRes, reqRes] = await Promise.all([
        prescriptionAPI.getAll(),
        doctorAPI.getRequests(),
      ]);
      setPrescriptions(presRes.data);
      setRequests(reqRes.data);
    } catch (err) {
      toast.error('Failed to load prescriptions data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRespond = async (requestId, status) => {
    setProcessingId(requestId);
    try {
      await doctorAPI.respondToRequest({ requestId, status });
      toast.success(`Request ${status.toLowerCase()} successfully!`);
      loadData();
    } catch (err) {
      toast.error('Failed to respond to request');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingQueries = requests.filter(r => r.status === 'PENDING');

  const filtered = prescriptions.filter(p => {
    const matchFilter = filter === 'ALL' || p.status === filter;
    const matchSearch = p.medicines?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><Pill className="w-6 h-6 text-amber-400" /> Prescriptions</h1>
        <p className="page-subtitle">All prescriptions you have created</p>
      </div>

      {/* Chemist substitution queries section */}
      {pendingQueries.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 border border-amber-500/30 bg-amber-950/5 space-y-4">
          <h2 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" /> Pending Chemist Substitution Queries ({pendingQueries.length})
          </h2>
          <div className="space-y-3">
            {pendingQueries.map(q => (
              <div key={q.id} className="p-4 rounded-xl bg-dark-900 border border-dark-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-dark-500 font-semibold">PRESCRIPTION #{q.prescriptionId}</div>
                  <div className="text-sm text-dark-200 font-medium">"{q.requestedMedicine}"</div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    disabled={processingId !== null}
                    onClick={() => handleRespond(q.id, 'APPROVED')}
                    className="btn-success flex-1 sm:flex-initial py-1.5 px-3 text-xs flex items-center justify-center gap-1"
                  >
                    {processingId === q.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Approve
                  </button>
                  <button
                    disabled={processingId !== null}
                    onClick={() => handleRespond(q.id, 'REJECTED')}
                    className="btn-danger flex-1 sm:flex-initial py-1.5 px-3 text-xs flex items-center justify-center gap-1"
                  >
                    {processingId === q.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input type="text" className="input-field pl-10" placeholder="Search medicines..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'DISPENSED'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${filter === f ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-400 hover:text-dark-200'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center"><Pill className="w-12 h-12 text-dark-700 mx-auto mb-3" /><div className="text-dark-400">No prescriptions found</div></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p, idx) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="glass-card p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <Pill className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="text-xs text-dark-500 mb-0.5">Prescription #{p.id}</div>
                      <div className="text-sm font-semibold text-dark-100">Patient #{p.patientId}</div>
                    </div>
                    <span className={p.status === 'DISPENSED' ? 'badge-success' : 'badge-warning'}>
                      {p.status === 'DISPENSED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {p.status}
                    </span>
                  </div>
                  <div className="text-sm text-dark-300 bg-dark-800/50 rounded-lg p-2.5 whitespace-pre-line">{p.medicines}</div>
                  {p.notes && <div className="text-xs text-dark-500 mt-2 italic">{p.notes}</div>}
                  <div className="flex items-center gap-1 text-xs text-dark-600 mt-2">
                    <Calendar className="w-3 h-3" />
                    {formatDate(p.createdAt)}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
