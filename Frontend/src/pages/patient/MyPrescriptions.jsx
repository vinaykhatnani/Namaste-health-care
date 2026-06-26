import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { prescriptionAPI } from '../../api/api';
import { Pill, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    prescriptionAPI.getMyPrescriptions()
      .then(res => setPrescriptions(res.data))
      .catch(() => toast.error('Failed to load prescriptions'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><Pill className="w-6 h-6 text-amber-500" /> My Prescriptions</h1>
        <p className="page-subtitle">Your prescription history and status</p>
      </div>

      {prescriptions.length === 0 ? (
        <div className="glass-card p-12 text-center"><Pill className="w-12 h-12 text-dark-700 mx-auto mb-3" /><div className="text-dark-400">No prescriptions found</div></div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((p, idx) => (
            <motion.div key={p.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="glass-card p-5 border-l-4 border-l-amber-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 text-xs text-dark-500">
                  <Calendar className="w-4 h-4" /> {formatDate(p.createdAt)}
                </div>
                <span className={p.status === 'DISPENSED' ? 'badge-success' : 'badge-warning'}>
                  {p.status === 'DISPENSED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {p.status}
                </span>
              </div>
              <div className="bg-dark-800/50 p-4 rounded-lg">
                <div className="text-sm font-medium text-dark-100 whitespace-pre-line">{p.medicines}</div>
              </div>
              {p.notes && (
                <div className="mt-3 text-xs text-dark-400 border-l-2 border-dark-700 pl-3 italic">
                  Note: {p.notes}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}
