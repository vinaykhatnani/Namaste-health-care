import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { prescriptionAPI, dispenseAPI, chemistAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { Pill, CheckCircle2, Clock, Calendar, ChevronRight, Building } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChemistDashboard() {
  const { user } = useAuth();
  const [pending, setPending] = useState([]);
  const [dispensed, setDispensed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chemistProfile, setChemistProfile] = useState(null);
  
  // Profile form state
  const [hospitalName, setHospitalName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const loadDashboard = async () => {
    try {
      const [pRes, dRes] = await Promise.all([
        prescriptionAPI.getPending(),
        dispenseAPI.getMyDispenses(),
      ]);
      setPending(pRes.data);
      setDispensed(dRes.data);
      
      // Load chemist profile
      try {
        const profRes = await chemistAPI.getProfile();
        setChemistProfile(profRes.data);
      } catch (profErr) {
        if (profErr.response?.status === 404) {
          setChemistProfile(null);
        }
      }
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!hospitalName.trim()) {
      toast.error('Please enter hospital name');
      return;
    }
    setSavingProfile(true);
    try {
      const res = await chemistAPI.saveProfile({ hospitalName });
      setChemistProfile(res.data);
      toast.success('Hospital linked successfully!');
      loadDashboard();
    } catch (err) {
      toast.error('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8" /></div>;

  // Force profile setup if not present
  if (!chemistProfile) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card max-w-md w-full p-8 space-y-6 border border-primary-500/30 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl" />
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-primary-950/50 border border-primary-800/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Pill className="w-7 h-7 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-dark-50">Link Your Pharmacy</h2>
            <p className="text-xs text-dark-500">Please provide the name of the hospital pharmacy you are associated with before accessing the dashboard.</p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="form-group">
              <label className="input-label flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-primary-400" /> Associated Hospital Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. City General Hospital"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="btn-primary w-full justify-center py-3 mt-2 shadow-lg shadow-primary-950/20"
            >
              {savingProfile ? 'Linking...' : 'Complete Registration'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="page-title">Good day, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Manage your pharmacy queue and dispensations</p>
        </div>
        {chemistProfile && (
          <div className="flex items-center gap-2 bg-dark-900 border border-dark-800 py-2 px-4 rounded-xl">
            <Building className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-dark-300">{chemistProfile.hospitalName}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="stat-card bg-amber-900/10 border-amber-800/30">
          <div className="stat-icon bg-amber-900/30"><Clock className="w-6 h-6 text-amber-400" /></div>
          <div>
            <div className="text-3xl font-bold text-amber-100">{pending.length}</div>
            <div className="text-sm text-amber-400/80">Pending Queue</div>
          </div>
        </div>
        <div className="stat-card bg-emerald-900/10 border-emerald-800/30">
          <div className="stat-icon bg-emerald-900/30"><CheckCircle2 className="w-6 h-6 text-emerald-400" /></div>
          <div>
            <div className="text-3xl font-bold text-emerald-100">{dispensed.length}</div>
            <div className="text-sm text-emerald-400/80">Recent Dispenses</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 border-t-2 border-t-amber-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-dark-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Pending Prescriptions
            </h2>
            <Link to="/chemist/queue" className="text-xs text-amber-400 hover:text-amber-300">Go to Queue</Link>
          </div>
          {pending.length === 0 ? (
            <div className="text-center py-8 text-dark-500 text-sm">Queue is empty</div>
          ) : (
            <div className="space-y-3">
              {pending.map((p) => (
                <Link key={p.id} to="/chemist/queue" className="flex flex-col gap-2 p-3 bg-dark-800/50 rounded-lg hover:bg-dark-700/50 transition-colors border-l-2 border-l-amber-500">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-dark-100">Prescription #{p.id}</div>
                      <div className="text-xs text-dark-500">Patient #{p.patientId}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-dark-500" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 border-t-2 border-t-emerald-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-dark-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Recent Dispenses
            </h2>
            <Link to="/chemist/history" className="text-xs text-emerald-400 hover:text-emerald-300">View all</Link>
          </div>
          {dispensed.length === 0 ? (
            <div className="text-center py-8 text-dark-500 text-sm">No recent dispenses</div>
          ) : (
            <div className="space-y-3">
              {dispensed.map((d) => (
                <div key={d.id} className="flex items-start justify-between p-3 bg-dark-800/50 rounded-lg border-l-2 border-l-emerald-500">
                  <div>
                    <div className="font-medium text-dark-100">Prescription #{d.prescriptionId}</div>
                    <div className="text-xs text-dark-500 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" /> {formatDate(d.dispensedAt)}
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function formatDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
