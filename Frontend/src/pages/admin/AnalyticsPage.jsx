import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { analyticsAPI } from '../../api/api';
import axios from 'axios';
import { 
  BarChart3, Brain, Database, Activity, CheckCircle2, 
  AlertCircle, RefreshCw, Play, Users, FileText, Pill 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const ML_API_BASE = '/ml-api';

function MetricCard({ title, value, icon: Icon, colorClass, delay, subtitle }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay }} 
      className="glass-card p-5 flex flex-col justify-between h-32"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-dark-400 mb-1">{title}</div>
          <div className="text-2xl font-bold text-dark-50">{value}</div>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass} bg-opacity-20`}>
          <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
      </div>
      {subtitle && <div className="text-xs text-dark-500 mt-2">{subtitle}</div>}
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const [sysStats, setSysStats] = useState(null);
  const [mlStats, setMlStats] = useState(null);
  const [mlHealth, setMlHealth] = useState({ online: false, trained: false });
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  
  // Playground state
  const [testSymptoms, setTestSymptoms] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

  const fetchAllData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // 1. Fetch system statistics from Spring Boot
      const sysResponse = await analyticsAPI.getStats();
      setSysStats(sysResponse.data);

      // 2. Fetch ML Server Health and stats
      try {
        const healthRes = await axios.get(`${ML_API_BASE}/health`);
        const statsRes = await axios.get(`${ML_API_BASE}/analytics`);
        setMlHealth({ online: true, trained: healthRes.data.model_trained });
        setMlStats(statsRes.data);
      } catch (mlErr) {
        console.warn('ML Server seems offline:', mlErr);
        setMlHealth({ online: false, trained: false });
        setMlStats(null);
      }
    } catch (err) {
      toast.error('Failed to load system analytics');
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    const toastId = toast.loading('Retraining model on NATIONAL AYURVEDA MORBIDITY CODES...');
    try {
      const res = await axios.post(`${ML_API_BASE}/retrain`);
      if (res.data.status === 'success') {
        toast.success('Model successfully retrained!', { id: toastId });
        await fetchAllData(true);
      } else {
        toast.error(res.data.message || 'Retraining failed', { id: toastId });
      }
    } catch (err) {
      toast.error('Could not connect to ML Server to retrain.', { id: toastId });
    } finally {
      setRetraining(false);
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!testSymptoms.trim()) return;
    setPredicting(true);
    setPrediction(null);
    try {
      const res = await axios.post(`${ML_API_BASE}/predict`, { symptoms: testSymptoms });
      if (res.data.predictions && res.data.predictions.length > 0) {
        setPrediction(res.data.predictions[0]);
      } else {
        toast.error('No predictions returned from ML Model');
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Failed to get prediction from ML API';
      toast.error(errMsg);
      console.error(err);
    } finally {
      setPredicting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="spinner w-10 h-10" />
        <span className="text-dark-400 text-sm animate-pulse">Loading system and ML metrics...</span>
      </div>
    );
  }

  // Formatting categories for charts
  const categoryData = mlStats?.category_distribution 
    ? Object.entries(mlStats.category_distribution).map(([key, val]) => ({
        name: `Category ${key}`,
        count: val
      })).sort((a, b) => b.count - a.count)
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-dark-800">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary-500" /> 
            System & ML Analytics
          </h1>
          <p className="page-subtitle">Ayurveda Morbidity classifier dashboard and performance insights</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`badge ${mlHealth.online ? 'badge-success' : 'badge-danger'} py-1.5 px-3`}>
            {mlHealth.online ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                ML Server: Online
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                ML Server: Offline
              </>
            )}
          </div>
          
          <button 
            onClick={handleRetrain} 
            disabled={retraining || !mlHealth.online}
            className="btn-primary py-2 text-sm shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${retraining ? 'animate-spin' : ''}`} />
            {retraining ? 'Retraining...' : 'Retrain Model'}
          </button>
        </div>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* System metrics */}
        <MetricCard 
          title="Total Diagnoses (System)" 
          value={sysStats?.totalDiagnoses || 0} 
          icon={FileText} 
          colorClass="bg-primary-500 text-primary-400" 
          delay={0}
          subtitle={`Prescriptions: ${sysStats?.totalPrescriptions || 0}`}
        />
        <MetricCard 
          title="Active System Users" 
          value={sysStats?.totalUsers || 0} 
          icon={Users} 
          colorClass="bg-purple-500 text-purple-400" 
          delay={0.1}
          subtitle={`Doctors: ${sysStats?.totalDoctors || 0} | Patients: ${sysStats?.totalPatients || 0}`}
        />
        
        {/* ML model metrics */}
        <MetricCard 
          title="Dataset Size" 
          value={mlStats?.total_records || 'N/A'} 
          icon={Database} 
          colorClass="bg-blue-500 text-blue-400" 
          delay={0.2}
          subtitle={`Valid Training Codes: ${mlStats?.valid_training_records || 'N/A'}`}
        />
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category distribution bar chart */}
        <div className="glass-card p-5 flex flex-col justify-between min-h-[400px]">
          <div>
            <h2 className="text-base font-semibold text-dark-100 mb-1 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              Morbidity Code Distribution
            </h2>
            <p className="text-xs text-dark-500 mb-6">Distribution of Ayurveda codes grouped by category prefix</p>
          </div>
          
          <div className="h-64 flex-1">
            {mlHealth.online && categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#334155', 
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }} 
                  />
                  <Bar dataKey="count" fill="url(#colorUv)" radius={[4, 4, 0, 0]} barSize={32}>
                    <defs>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-dark-500 text-sm gap-2">
                <AlertCircle className="w-8 h-8 text-dark-600" />
                <span>{mlHealth.online ? 'No category data loaded' : 'Connect ML Server to load dataset statistics'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Prediction Playground */}
        <div className="glass-card p-5 flex flex-col justify-between min-h-[400px]">
          <div>
            <h2 className="text-base font-semibold text-dark-100 mb-1 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              Morbidity Classifier Playground
            </h2>
            <p className="text-xs text-dark-500 mb-4">Test predictions directly from the trained Naive Bayes Ayurveda Model</p>
          </div>
          
          <form onSubmit={handlePredict} className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <textarea
                className="input-field min-h-[100px] resize-none"
                placeholder="Enter symptoms or descriptions in English (e.g. 'fever, stiffness of low back, pricking pain in joints')..."
                value={testSymptoms}
                onChange={(e) => setTestSymptoms(e.target.value)}
                disabled={!mlHealth.online}
              />
              
              <button 
                type="submit" 
                disabled={predicting || !testSymptoms.trim() || !mlHealth.online}
                className="btn-primary w-full justify-center"
              >
                <Play className="w-4 h-4 fill-current" />
                {predicting ? 'Classifying...' : 'Predict NAMC Disease'}
              </button>
            </div>

            {/* Prediction Result Display */}
            {prediction && (
              <div className="mt-4 p-4 rounded-lg bg-dark-900 border border-dark-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-dark-400 font-semibold uppercase tracking-wider">Classification</span>
                  <span className={`badge ${prediction.confidence > 0.7 ? 'badge-success' : 'badge-warning'}`}>
                    {(prediction.confidence * 100).toFixed(1)}% Confidence
                  </span>
                </div>
                
                <div>
                  <div className="text-sm font-bold text-dark-100">{prediction.disease}</div>
                  <div className="text-xs text-dark-500 mt-1">Ayurveda Morbidity Term (NAMC Term)</div>
                </div>

                <div className="space-y-1">
                  <div className="confidence-bar">
                    <div 
                      className={`confidence-fill ${prediction.confidence > 0.7 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${prediction.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {!mlHealth.online && (
              <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-lg text-xs flex items-center gap-2 mt-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>The ML engine is currently offline. Running fallback keywords instead.</span>
              </div>
            )}
          </form>
        </div>

      </div>
    </div>
  );
}
