import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AppLayout from './components/AppLayout';

// Auth
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Doctor
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DiagnosePatient from './pages/doctor/DiagnosePatient';
import DiagnosisHistory from './pages/doctor/DiagnosisHistory';
import DoctorPrescriptions from './pages/doctor/DoctorPrescriptions';

// Patient
import PatientDashboard from './pages/patient/PatientDashboard';
import MyDiagnoses from './pages/patient/MyDiagnoses';
import MyPrescriptions from './pages/patient/MyPrescriptions';

// Chemist
import ChemistDashboard from './pages/chemist/ChemistDashboard';
import PrescriptionQueue from './pages/chemist/PrescriptionQueue';
import DispenseHistory from './pages/chemist/DispenseHistory';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AnalyticsPage from './pages/admin/AnalyticsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' },
          success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
        }} />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Root Redirect based on Auth */}
          <Route path="/" element={<PrivateRoute><RoleRedirect /></PrivateRoute>} />
          <Route path="/unauthorized" element={<div className="min-h-screen flex items-center justify-center text-dark-400">Unauthorized Access</div>} />

          {/* Doctor Routes */}
          <Route path="/doctor" element={<PrivateRoute allowedRoles={['DOCTOR']}><AppLayout><DoctorDashboard /></AppLayout></PrivateRoute>} />
          <Route path="/doctor/diagnose" element={<PrivateRoute allowedRoles={['DOCTOR']}><AppLayout><DiagnosePatient /></AppLayout></PrivateRoute>} />
          <Route path="/doctor/history" element={<PrivateRoute allowedRoles={['DOCTOR']}><AppLayout><DiagnosisHistory /></AppLayout></PrivateRoute>} />
          <Route path="/doctor/prescriptions" element={<PrivateRoute allowedRoles={['DOCTOR']}><AppLayout><DoctorPrescriptions /></AppLayout></PrivateRoute>} />

          {/* Patient Routes */}
          <Route path="/patient" element={<PrivateRoute allowedRoles={['PATIENT']}><AppLayout><PatientDashboard /></AppLayout></PrivateRoute>} />
          <Route path="/patient/diagnoses" element={<PrivateRoute allowedRoles={['PATIENT']}><AppLayout><MyDiagnoses /></AppLayout></PrivateRoute>} />
          <Route path="/patient/prescriptions" element={<PrivateRoute allowedRoles={['PATIENT']}><AppLayout><MyPrescriptions /></AppLayout></PrivateRoute>} />

          {/* Chemist Routes */}
          <Route path="/chemist" element={<PrivateRoute allowedRoles={['CHEMIST']}><AppLayout><ChemistDashboard /></AppLayout></PrivateRoute>} />
          <Route path="/chemist/queue" element={<PrivateRoute allowedRoles={['CHEMIST']}><AppLayout><PrescriptionQueue /></AppLayout></PrivateRoute>} />
          <Route path="/chemist/history" element={<PrivateRoute allowedRoles={['CHEMIST']}><AppLayout><DispenseHistory /></AppLayout></PrivateRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<PrivateRoute allowedRoles={['ADMIN']}><AppLayout><AdminDashboard /></AppLayout></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute allowedRoles={['ADMIN']}><AppLayout><UserManagement /></AppLayout></PrivateRoute>} />
          <Route path="/admin/analytics" element={<PrivateRoute allowedRoles={['ADMIN']}><AppLayout><AnalyticsPage /></AppLayout></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Redirects user to their respective dashboard on root visit
function RoleRedirect() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;
  const user = JSON.parse(userStr);
  const routes = { DOCTOR: '/doctor', PATIENT: '/patient', CHEMIST: '/chemist', ADMIN: '/admin' };
  return <Navigate to={routes[user.role] || '/login'} replace />;
}

export default App;
