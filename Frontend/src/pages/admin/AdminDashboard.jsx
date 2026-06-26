import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { analyticsAPI, adminAPI } from '../../api/api';
import { Users, Activity, BarChart3, Pill, Stethoscope, Building, User, ChevronRight, X, Clock, HelpCircle, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';

function StatCard({ title, value, icon: Icon, colorClass, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="glass-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-dark-400 mb-1">{title}</div>
          <div className="text-2xl font-bold text-dark-50">{value}</div>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass} bg-opacity-20`}>
          <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [diseaseAnalytics, setDiseaseAnalytics] = useState([]);
  const [showAllDiseases, setShowAllDiseases] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [statsRes, diseaseRes, issuesRes] = await Promise.all([
        analyticsAPI.getStats(),
        adminAPI.getDiseaseAnalytics(),
        adminAPI.getIssues()
      ]);
      setStats(statsRes.data);
      setDiseaseAnalytics(diseaseRes.data);
      setIssues(issuesRes.data);
    } catch (err) {
      toast.error('Failed to load admin analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolveIssue = async (issueId) => {
    try {
      await adminAPI.resolveIssue({ issueId, status: 'RESOLVED' });
      toast.success('Emergency issue marked as resolved!');
      loadData();
    } catch (err) {
      toast.error('Failed to resolve issue');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8" /></div>;

  const COLORS = ['#14b8a6', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899'];

  const graphData = showAllDiseases ? diseaseAnalytics : diseaseAnalytics.slice(0, 10);
  const pendingIssues = issues.filter(i => i.status === 'PENDING');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex justify-between items-end">
        <div>
          <h1 className="page-title flex items-center gap-2"><BarChart3 className="w-6 h-6 text-purple-500" /> Admin Overview</h1>
          <p className="page-subtitle">System-wide analytics and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/analytics" className="btn-secondary text-sm">ML Classifier Dashboard</Link>
          <Link to="/admin/users" className="btn-secondary text-sm">Manage Users</Link>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} colorClass="bg-purple-500 text-purple-400" delay={0} />
        <StatCard title="Total Diagnoses" value={stats?.totalDiagnoses || 0} icon={Stethoscope} colorClass="bg-primary-500 text-primary-400" delay={0.1} />
        <StatCard title="Prescriptions" value={stats?.totalPrescriptions || 0} icon={Pill} colorClass="bg-amber-500 text-amber-400" delay={0.2} />
        <StatCard title="Dispensed" value={stats?.dispensedPrescriptions || 0} icon={Activity} colorClass="bg-emerald-500 text-emerald-400" delay={0.3} />
      </div>

      {/* Chemist reported emergency issues */}
      {pendingIssues.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5 border border-red-500/30 bg-red-950/5 space-y-4">
          <h2 className="text-sm font-semibold text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Pending Chemist Emergency Issues ({pendingIssues.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingIssues.map(i => (
              <div key={i.id} className="p-4 rounded-xl bg-dark-900 border border-dark-800 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-dark-500 font-semibold">PRESCRIPTION #{i.prescriptionId} • Chemist ID: {i.chemistId}</div>
                  <div className="text-sm text-red-300">"{i.reason}"</div>
                </div>
                <button
                  onClick={() => handleResolveIssue(i.id)}
                  className="btn-danger w-full py-1.5 text-xs justify-center"
                >
                  Mark Resolved / Safe to Dispense
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Disease Frequency Analytics Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-5 lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-semibold text-dark-200">Common AI Predicted Diseases</h2>
              <p className="text-xs text-dark-500">Interactive graph of disease classifications. Click any bar to view details.</p>
            </div>
            <button
              onClick={() => setShowAllDiseases(!showAllDiseases)}
              className="btn-secondary py-1 px-3 text-xs"
            >
              {showAllDiseases ? 'Show Top 10' : 'Show All'}
            </button>
          </div>
          
          <div className="h-72">
            {graphData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graphData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis dataKey="disease" type="category" stroke="#64748b" fontSize={11} width={120} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#14b8a6" 
                    radius={[0, 4, 4, 0]} 
                    barSize={20}
                    onClick={(data) => setSelectedDisease(data)}
                    className="cursor-pointer"
                  >
                    {graphData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-dark-500 text-sm">Not enough data to display</div>
            )}
          </div>
        </motion.div>

        {/* Morbidity Quick Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-dark-200">Morbidity Breakdown</h2>
            <p className="text-xs text-dark-500">Summary list of disease cases</p>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {diseaseAnalytics.map((da, idx) => (
              <div
                key={da.disease}
                onClick={() => setSelectedDisease(da)}
                className="p-2.5 rounded-lg bg-dark-800/30 hover:bg-dark-700/30 border border-dark-800 hover:border-dark-700 transition-all flex justify-between items-center cursor-pointer group"
              >
                <div>
                  <div className="text-xs font-bold text-dark-100 group-hover:text-primary-400 transition-colors">{da.disease}</div>
                  <div className="text-[10px] text-dark-500">{da.hospitals?.length || 0} associated hospitals</div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="badge-primary text-[10px]">{da.count} cases</span>
                  <ChevronRight className="w-3.5 h-3.5 text-dark-500 group-hover:text-primary-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Disease Detail Modal */}
      <AnimatePresence>
        {selectedDisease && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-card max-w-2xl w-full p-6 space-y-6 relative max-h-[85vh] overflow-y-auto border border-primary-500/20">
              <button onClick={() => setSelectedDisease(null)} className="absolute top-4 right-4 btn-icon">
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-dark-50">{selectedDisease.disease}</h3>
                <p className="text-xs text-primary-400 font-semibold">{selectedDisease.count} Cases Registered</p>
              </div>

              {/* Hospitals Involved */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-dark-400 flex items-center gap-1"><Building className="w-3.5 h-3.5 text-amber-500" /> Associated Hospitals</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDisease.hospitals && selectedDisease.hospitals.length > 0 ? (
                    selectedDisease.hospitals.map(h => (
                      <span key={h} className="badge-warning text-xs">{h}</span>
                    ))
                  ) : (
                    <span className="text-xs text-dark-500 italic">No associated hospitals profile data</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Doctors list */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-dark-400 flex items-center gap-1"><Stethoscope className="w-3.5 h-3.5 text-blue-400" /> Associated Doctors</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedDisease.doctors && selectedDisease.doctors.length > 0 ? (
                      selectedDisease.doctors.map(d => (
                        <div key={d.id} className="p-2 rounded bg-dark-900 border border-dark-800 text-xs">
                          <div className="font-bold text-dark-100">{d.name}</div>
                          <div className="text-dark-500">{d.specialization} • {d.experience} Years Exp</div>
                          <div className="text-dark-500 italic">{d.hospitalName}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-dark-500 italic">No doctor information available</div>
                    )}
                  </div>
                </div>

                {/* Patients list */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-dark-400 flex items-center gap-1"><User className="w-3.5 h-3.5 text-purple-400" /> Patient List</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedDisease.patients && selectedDisease.patients.length > 0 ? (
                      selectedDisease.patients.map(p => (
                        <div key={p.id} className="p-2 rounded bg-dark-900 border border-dark-800 text-xs">
                          <div className="font-bold text-dark-100">{p.name}</div>
                          <div className="text-dark-500">{p.email}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-dark-500 italic">No patients listed</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Prescriptions list */}
              <div className="space-y-2 pt-2 border-t border-dark-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-dark-400 flex items-center gap-1"><Pill className="w-3.5 h-3.5 text-emerald-400" /> Prescriptions & Medicines</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedDisease.prescriptions && selectedDisease.prescriptions.length > 0 ? (
                    selectedDisease.prescriptions.map(p => (
                      <div key={p.id} className="p-3 rounded bg-dark-900 border border-dark-800 text-xs space-y-1.5">
                        <div className="flex justify-between font-semibold">
                          <span className="text-dark-300">Prescription #{p.id}</span>
                          <span className={p.status === 'DISPENSED' ? 'text-emerald-400' : 'text-amber-400'}>{p.status}</span>
                        </div>
                        <div className="text-dark-100 font-mono bg-dark-950 p-2 rounded">{p.medicines}</div>
                        {p.notes && <div className="text-dark-500 italic">Note: {p.notes}</div>}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-dark-500 italic">No prescriptions issued for this disease yet</div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
