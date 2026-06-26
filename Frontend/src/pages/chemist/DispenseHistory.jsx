import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { dispenseAPI } from '../../api/api';
import { CheckCircle2, Calendar, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DispenseHistory() {
  const [dispenses, setDispenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispenseAPI.getMyDispenses()
      .then(res => setDispenses(res.data))
      .catch(() => toast.error('Failed to load dispense history'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><CheckCircle2 className="w-6 h-6 text-emerald-500" /> Dispense History</h1>
        <p className="page-subtitle">Records of all prescriptions you have dispensed</p>
      </div>

      {dispenses.length === 0 ? (
        <div className="glass-card p-12 text-center"><CheckCircle2 className="w-12 h-12 text-dark-700 mx-auto mb-3" /><div className="text-dark-400">No dispense history found</div></div>
      ) : (
        <div className="space-y-3">
          {dispenses.map((d, idx) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="glass-card p-4 border-l-4 border-l-emerald-500">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-bold text-dark-100 mb-1">Prescription #{d.prescriptionId}</div>
                  <div className="text-xs text-dark-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {formatDate(d.dispensedAt)}
                  </div>
                  {d.notes && (
                    <div className="mt-3 text-sm text-dark-300 bg-dark-800/50 p-2.5 rounded-lg border border-dark-700 flex items-start gap-2">
                      <FileText className="w-4 h-4 text-dark-500 shrink-0 mt-0.5" />
                      {d.notes}
                    </div>
                  )}
                </div>
                <div className="badge-success"><CheckCircle2 className="w-3 h-3" /> DISPENSED</div>
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
  return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
