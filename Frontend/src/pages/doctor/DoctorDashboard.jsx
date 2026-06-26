import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doctorAPI, userAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { Stethoscope, Users, FileText, Pill, TrendingUp, Clock, ChevronRight, AlertCircle, Building, Award, ShieldAlert, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

function StatCard({ icon: Icon, label, value, color, bgColor, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="stat-card"
    >
      <div className={`stat-icon ${bgColor}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <div className="text-2xl font-bold text-dark-50">{value}</div>
        <div className="text-xs text-dark-500 mt-0.5">{label}</div>
      </div>
    </motion.div>
  );
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    hospitalName: '',
    experience: '',
    specialization: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const loadDashboard = async () => {
    try {
      const [pRes, dRes] = await Promise.all([
        userAPI.getByRole('PATIENT'),
        doctorAPI.getDashboard(),
      ]);
      setPatients(pRes.data);
      setDashboardData(dRes.data);
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
    if (!profileForm.hospitalName.trim() || !profileForm.experience || !profileForm.specialization.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setSavingProfile(true);
    try {
      await doctorAPI.saveProfile({
        hospitalName: profileForm.hospitalName,
        experience: parseInt(profileForm.experience),
        specialization: profileForm.specialization
      });
      toast.success('Profile completed successfully!');
      loadDashboard();
    } catch (err) {
      toast.error('Failed to save doctor profile');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  // Force profile setup if incomplete
  if (dashboardData && !dashboardData.profileComplete) {
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
              <Stethoscope className="w-7 h-7 text-primary-400" />
            </div>
            <h2 className="text-xl font-bold text-dark-50">Complete Your Doctor Profile</h2>
            <p className="text-xs text-dark-500">Please provide your details before accessing the NAMASTE Health System dashboard.</p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="form-group">
              <label className="input-label flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-primary-400" /> Hospital Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. City General Hospital"
                value={profileForm.hospitalName}
                onChange={(e) => setProfileForm({ ...profileForm, hospitalName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="input-label flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-primary-400" /> Experience (Years)</label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="e.g. 8"
                  value={profileForm.experience}
                  onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="input-label flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5 text-primary-400" /> Specialization</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. General Medicine"
                  value={profileForm.specialization}
                  onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="btn-primary w-full justify-center py-3 mt-2 shadow-lg shadow-primary-950/20"
            >
              {savingProfile ? 'Saving Details...' : 'Complete Profile Setup'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const stats = [
    { icon: Users, label: 'Total Patients', value: patients.length, color: 'text-blue-400', bgColor: 'bg-blue-900/30', delay: 0 },
    { icon: Stethoscope, label: 'My Diagnoses', value: dashboardData?.totalDiagnoses || 0, color: 'text-primary-400', bgColor: 'bg-primary-900/30', delay: 0.1 },
    { icon: Pill, label: 'Prescriptions', value: dashboardData?.totalPrescriptions || 0, color: 'text-amber-400', bgColor: 'bg-amber-900/30', delay: 0.2 },
    { icon: TrendingUp, label: 'Active Cases', value: dashboardData?.activeCases || 0, color: 'text-emerald-400', bgColor: 'bg-emerald-900/30', delay: 0.3 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Good {getGreeting()}, Dr. {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">Here's an overview of your practice today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-5"
      >
        <h2 className="text-sm font-semibold text-dark-300 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/doctor/diagnose" id="btn-new-diagnosis" className="flex items-center gap-3 p-4 bg-primary-900/20 border border-primary-800/40 rounded-xl hover:bg-primary-900/30 hover:border-primary-700/60 transition-all duration-200 group">
            <div className="w-10 h-10 bg-primary-900/50 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-primary-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-dark-100">New Diagnosis</div>
              <div className="text-xs text-dark-500">AI-powered disease prediction</div>
            </div>
            <ChevronRight className="w-4 h-4 text-dark-500 group-hover:text-primary-400 transition-colors" />
          </Link>

          <Link to="/doctor/prescriptions" id="btn-prescriptions" className="flex items-center gap-3 p-4 bg-amber-900/10 border border-amber-800/30 rounded-xl hover:bg-amber-900/20 hover:border-amber-700/50 transition-all duration-200 group">
            <div className="w-10 h-10 bg-amber-900/30 rounded-xl flex items-center justify-center">
              <Pill className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-dark-100">Prescriptions</div>
              <div className="text-xs text-dark-500">View & manage prescriptions</div>
            </div>
            <ChevronRight className="w-4 h-4 text-dark-500 group-hover:text-amber-400 transition-colors" />
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Diagnoses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-dark-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-500" />
              Recent Diagnoses
            </h2>
            <Link to="/doctor/history" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
              View all
            </Link>
          </div>
          {!dashboardData?.recentDiagnoses || dashboardData.recentDiagnoses.length === 0 ? (
            <div className="text-center py-8 text-dark-500 text-sm">No diagnoses yet</div>
          ) : (
            <div className="space-y-2">
              {dashboardData.recentDiagnoses.slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-lg">
                  <div className="w-8 h-8 bg-primary-900/40 rounded-lg flex items-center justify-center shrink-0">
                    <Stethoscope className="w-4 h-4 text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-dark-100 truncate">{d.predictedDisease}</div>
                    <div className="text-xs text-dark-500">{formatDate(d.createdAt)}</div>
                  </div>
                  {d.icdCode && d.icdCode !== 'N/A' && (
                    <span className="badge-primary text-xs shrink-0">{d.icdCode}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Patient List Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-dark-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Registered Patients
            </h2>
          </div>
          {patients.length === 0 ? (
            <div className="text-center py-8 text-dark-500 text-sm">No patients registered yet</div>
          ) : (
            <div className="space-y-2">
              {patients.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-900/40 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-blue-300">
                      {p.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-dark-100 truncate">{p.name}</div>
                    <div className="text-xs text-dark-500 truncate">{p.email}</div>
                  </div>
                  <span className="badge-info text-xs">ID: {p.id}</span>
                </div>
              ))}
              {patients.length > 5 && (
                <div className="text-center text-xs text-dark-500 pt-1">
                  +{patients.length - 5} more patients
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

function formatDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
