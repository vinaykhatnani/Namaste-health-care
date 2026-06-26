import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Heart, Stethoscope, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'PATIENT', label: 'Patient', icon: '🧑‍⚕️', desc: 'View diagnosis & prescriptions' },
  { value: 'DOCTOR', label: 'Doctor', icon: '👨‍⚕️', desc: 'Diagnose & prescribe' },
  { value: 'CHEMIST', label: 'Chemist', icon: '💊', desc: 'Dispense medicines' },
  { value: 'ADMIN', label: 'Admin', icon: '🛡️', desc: 'Manage system & analytics' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}! 🎉`);
      const roleRoutes = {
        DOCTOR: '/doctor',
        PATIENT: '/patient',
        CHEMIST: '/chemist',
        ADMIN: '/admin',
      };
      navigate(roleRoutes[user.role] || '/');
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please check your credentials.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex flex-col justify-between w-1/2 bg-dark-900 p-12 relative overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">NAMASTE Health</span>
          </div>
          <h1 className="text-4xl font-bold text-dark-50 leading-tight mb-4">
            AI-Powered<br />
            <span className="gradient-text">Healthcare</span><br />
            Diagnosis System
          </h1>
          <p className="text-dark-400 text-lg leading-relaxed max-w-sm">
            Intelligent diagnosis with ICD-11 coding, ML predictions, and seamless prescription management.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-3">
          {ROLES.map((role) => (
            <div key={role.value} className="glass-card p-3">
              <div className="text-xl mb-1">{role.icon}</div>
              <div className="text-sm font-semibold text-dark-200">{role.label}</div>
              <div className="text-xs text-dark-500">{role.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-dark-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Heart className="w-6 h-6 text-primary-500" />
            <span className="text-lg font-bold gradient-text">NAMASTE Health</span>
          </div>

          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold text-dark-50 mb-1">Welcome back</h2>
            <p className="text-dark-400 text-sm mb-8">Sign in to your account to continue</p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="alert-error flex items-center gap-2 mb-6"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="form-group">
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="doctor@hospital.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  id="login-email"
                />
              </div>

              <div className="form-group">
                <label className="input-label">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input-field pr-12"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    id="login-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-200 transition-colors"
                    onClick={() => setShowPass(!showPass)}
                    id="toggle-password"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3"
                id="login-submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Stethoscope className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="divider" />

            <p className="text-center text-sm text-dark-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Create account
              </Link>
            </p>
          </div>

          {/* Demo hint */}
          <div className="mt-4 glass-card p-3 text-xs text-dark-500 text-center">
            💡 Register with your desired role to get started
          </div>
        </motion.div>
      </div>
    </div>
  );
}
