import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Heart, AlertCircle, Loader2, CheckCircle2, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { userAPI } from '../api/api';

const ROLES = [
  { value: 'PATIENT', label: 'Patient', icon: '🧑‍⚕️' },
  { value: 'DOCTOR', label: 'Doctor', icon: '👨‍⚕️' },
  { value: 'CHEMIST', label: 'Chemist', icon: '💊' },
  { value: 'ADMIN', label: 'Admin', icon: '🛡️' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: '', doctorId: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await userAPI.getByRole('DOCTOR');
        setDoctors(res.data);
      } catch (err) {
        console.error('Failed to fetch doctors', err);
      }
    };
    fetchDoctors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.role) { setError('Please select your role'); return; }
    if (form.role === 'PATIENT' && !form.doctorId) { setError('Please select a doctor'); return; }
    setError('');
    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role, form.doctorId ? parseInt(form.doctorId) : null);
      toast.success(`Account created! Welcome, ${user.name}! 🎉`);
      const roleRoutes = { DOCTOR: '/doctor', PATIENT: '/patient', CHEMIST: '/chemist', ADMIN: '/admin' };
      navigate(roleRoutes[user.role] || '/');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-dark-950">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">NAMASTE Health</span>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-dark-50 mb-1">Create Account</h2>
          <p className="text-dark-400 text-sm mb-6">Join the NAMASTE Healthcare System</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="alert-error flex items-center gap-2 mb-5"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="input-label">Full Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="Dr. John Smith"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                id="reg-name"
              />
            </div>

            <div className="form-group">
              <label className="input-label">Email Address</label>
              <input
                type="email"
                className="input-field"
                placeholder="john@hospital.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                id="reg-email"
              />
            </div>

            <div className="form-group">
              <label className="input-label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  id="reg-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-200 transition-colors"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="input-label">Select Your Role</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    id={`role-${role.value}`}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 ${
                      form.role === role.value
                        ? 'border-primary-500 bg-primary-900/30 text-primary-300'
                        : 'border-dark-700 bg-dark-800/50 text-dark-400 hover:border-dark-600 hover:text-dark-200'
                    }`}
                    onClick={() => setForm({ ...form, role: role.value, doctorId: '' })}
                  >
                    <span>{role.icon}</span>
                    <span>{role.label}</span>
                    {form.role === role.value && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-primary-400" />}
                  </button>
                ))}
              </div>
            </div>

            {form.role === 'PATIENT' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="form-group"
              >
                <label className="input-label flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  Assign Doctor
                </label>
                <select
                  className="input-field appearance-none"
                  value={form.doctorId}
                  onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                  required
                >
                  <option value="" disabled>Select a doctor...</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>Dr. {doc.name} {doc.hospitalName ? `(${doc.hospitalName})` : ''}</option>
                  ))}
                </select>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2"
              id="reg-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="divider" />
          <p className="text-center text-sm text-dark-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
