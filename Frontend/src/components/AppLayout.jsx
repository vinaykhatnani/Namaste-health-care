import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, LayoutDashboard, Stethoscope, FileText, Pill, Users,
  BarChart3, LogOut, Menu, X, Bell, ChevronRight, Activity
} from 'lucide-react';

const NAV_ITEMS = {
  DOCTOR: [
    { path: '/doctor', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/doctor/diagnose', icon: Stethoscope, label: 'New Diagnosis' },
    { path: '/doctor/history', icon: FileText, label: 'Diagnosis History' },
    { path: '/doctor/prescriptions', icon: Pill, label: 'Prescriptions' },
  ],
  PATIENT: [
    { path: '/patient', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/patient/diagnoses', icon: Stethoscope, label: 'My Diagnoses' },
    { path: '/patient/prescriptions', icon: Pill, label: 'My Prescriptions' },
  ],
  CHEMIST: [
    { path: '/chemist', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/chemist/queue', icon: Pill, label: 'Prescription Queue' },
    { path: '/chemist/history', icon: FileText, label: 'Dispense History' },
  ],
  ADMIN: [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/users', icon: Users, label: 'User Management' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  ],
};

const ROLE_CONFIG = {
  DOCTOR: { color: 'text-blue-400', bg: 'bg-blue-900/30', border: 'border-blue-800/50', label: 'Doctor' },
  PATIENT: { color: 'text-emerald-400', bg: 'bg-emerald-900/30', border: 'border-emerald-800/50', label: 'Patient' },
  CHEMIST: { color: 'text-amber-400', bg: 'bg-amber-900/30', border: 'border-amber-800/50', label: 'Chemist' },
  ADMIN: { color: 'text-purple-400', bg: 'bg-purple-900/30', border: 'border-purple-800/50', label: 'Admin' },
};

function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = NAV_ITEMS[user?.role] || [];
  const roleConfig = ROLE_CONFIG[user?.role] || {};

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-dark-900 border-r border-dark-800 z-50
        flex flex-col transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-dark-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center glow-teal">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold gradient-text">NAMASTE</div>
              <div className="text-xs text-dark-500">Health System</div>
            </div>
          </div>
          <button className="btn-icon lg:hidden" onClick={onClose} id="close-sidebar">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User card */}
        <div className="p-4 border-b border-dark-800">
          <div className={`p-3 rounded-xl border ${roleConfig.bg} ${roleConfig.border}`}>
            <div className={`text-xs font-semibold ${roleConfig.color} mb-0.5`}>{roleConfig.label}</div>
            <div className="text-sm font-semibold text-dark-100 truncate">{user?.name}</div>
            <div className="text-xs text-dark-500 truncate">{user?.email}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${active ? 'active' : ''}`}
                onClick={onClose}
                id={`nav-${item.label.toLowerCase().replace(/ /g, '-')}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-3 h-3" />}
              </Link>
            );
          })}
        </nav>

        {/* System Status */}
        <div className="p-3 border-t border-dark-800">
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-dark-500">
            <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
            <span>System Online</span>
          </div>
          <button
            className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
            onClick={handleLogout}
            id="logout-btn"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const roleConfig = ROLE_CONFIG[user?.role] || {};

  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-dark-800 bg-dark-900/80 backdrop-blur-sm sticky top-0 z-30">
          <button
            className="btn-icon lg:hidden"
            onClick={() => setSidebarOpen(true)}
            id="open-sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden lg:flex items-center gap-2 text-sm text-dark-400">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>NAMASTE Health System</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="btn-icon relative" id="notifications-btn">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
            </button>
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border ${roleConfig.bg} ${roleConfig.border}`}>
              <span className={`text-xs font-semibold ${roleConfig.color}`}>{roleConfig.label}</span>
              <span className="text-xs text-dark-300">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
