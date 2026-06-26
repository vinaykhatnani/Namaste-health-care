import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { diagnosisAPI, prescriptionAPI, userAPI } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { Stethoscope, Pill, Calendar, Clock, ChevronRight, CheckCircle2, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [diagnoses, setDiagnoses] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [changingDoctor, setChangingDoctor] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dRes, pRes, uRes, docRes] = await Promise.all([
        diagnosisAPI.getMyDiagnoses(),
        prescriptionAPI.getMyPrescriptions(),
        userAPI.getById(user.userId),
        userAPI.getByRole('DOCTOR')
      ]);
      setDiagnoses(dRes.data.slice(0, 5));
      setPrescriptions(pRes.data.slice(0, 5));
      setUserProfile(uRes.data);
      setDoctors(docRes.data);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.userId]);

  const handleChangeDoctor = async () => {
    if (!selectedDoctorId) {
      toast.error('Please select a doctor');
      return;
    }
    setChangingDoctor(true);
    try {
      await userAPI.changeDoctor(user.userId, parseInt(selectedDoctorId));
      toast.success('Doctor changed successfully!');
      setShowDoctorModal(false);
      loadData(); // Reload data to get updated doctor info
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change doctor');
    } finally {
      setChangingDoctor(false);
    }
  };

  if (loading && !userProfile) {
    return <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="page-header flex justify-between items-end">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle flex items-center gap-2 mt-2">
            <UserIcon className="w-4 h-4 text-primary-400" />
            Assigned Doctor: <strong className="text-primary-300">{userProfile?.assignedDoctorName ? `Dr. ${userProfile.assignedDoctorName}` : 'None'}</strong>
          </p>
        </div>
        <button onClick={() => setShowDoctorModal(true)} className="btn-secondary text-sm py-2">
          Change Doctor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="stat-card bg-primary-900/10 border-primary-800/30">
          <div className="stat-icon bg-primary-900/30"><Stethoscope className="w-6 h-6 text-primary-400" /></div>
          <div>
            <div className="text-3xl font-bold text-primary-100">{diagnoses.length}</div>
            <div className="text-sm text-primary-400/80">Recent Diagnoses</div>
          </div>
        </div>
        <div className="stat-card bg-amber-900/10 border-amber-800/30">
          <div className="stat-icon bg-amber-900/30"><Pill className="w-6 h-6 text-amber-400" /></div>
          <div>
            <div className="text-3xl font-bold text-amber-100">{prescriptions.length}</div>
            <div className="text-sm text-amber-400/80">Total Prescriptions</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Diagnoses */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-dark-200 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary-500" /> Recent Diagnoses
            </h2>
            <Link to="/patient/diagnoses" className="text-xs text-primary-400 hover:text-primary-300">View all</Link>
          </div>
          {diagnoses.length === 0 ? (
            <div className="text-center py-8 text-dark-500 text-sm">No diagnoses yet</div>
          ) : (
            <div className="space-y-3">
              {diagnoses.map((d) => (
                <Link key={d.id} to="/patient/diagnoses" className="flex flex-col gap-1 p-3 bg-dark-800/50 rounded-lg hover:bg-dark-700/50 transition-colors border-l-2 border-l-primary-500">
                  <div className="flex items-start justify-between">
                    <div className="font-medium text-dark-100">{d.predictedDisease}</div>
                    <ChevronRight className="w-4 h-4 text-dark-500" />
                  </div>
                  {d.doctorName && (
                    <div className="text-xs text-primary-400 font-semibold">
                      Dr. {d.doctorName} {d.hospitalName ? `(${d.hospitalName})` : ''}
                    </div>
                  )}
                  {d.medicines && (
                    <div className="text-xs text-amber-400 truncate">
                      💊 {d.medicines}
                    </div>
                  )}
                  <div className="text-xs text-dark-500 flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" /> {formatDate(d.createdAt)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Prescriptions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-dark-200 flex items-center gap-2">
              <Pill className="w-4 h-4 text-amber-500" /> Recent Prescriptions
            </h2>
            <Link to="/patient/prescriptions" className="text-xs text-amber-400 hover:text-amber-300">View all</Link>
          </div>
          {prescriptions.length === 0 ? (
            <div className="text-center py-8 text-dark-500 text-sm">No prescriptions yet</div>
          ) : (
            <div className="space-y-3">
              {prescriptions.map((p) => (
                <div key={p.id} className="flex flex-col gap-2 p-3 bg-dark-800/50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="font-medium text-dark-100 line-clamp-1">{p.medicines}</div>
                    <span className={p.status === 'DISPENSED' ? 'badge-success shrink-0' : 'badge-warning shrink-0'}>
                      {p.status === 'DISPENSED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {p.status}
                    </span>
                  </div>
                  <div className="text-xs text-dark-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {formatDate(p.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {showDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-dark-50 mb-4">Change Assigned Doctor</h2>
            <div className="form-group mb-6">
              <label className="input-label">Select New Doctor</label>
              <select
                className="input-field appearance-none"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
              >
                <option value="" disabled>Select a doctor...</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>Dr. {doc.name} {doc.hospitalName ? `(${doc.hospitalName})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDoctorModal(false)} className="btn-secondary py-2" disabled={changingDoctor}>Cancel</button>
              <button onClick={handleChangeDoctor} className="btn-primary py-2" disabled={changingDoctor}>
                {changingDoctor ? 'Updating...' : 'Confirm Change'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function formatDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
