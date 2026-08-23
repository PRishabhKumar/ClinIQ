import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './routes/AppRoutes';
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './pages/OAuthCallback';
import DoctorSearch from './pages/patient/DoctorSearch';
import PatientDashboard from './pages/patient/PatientDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import { useAuth } from './context/AuthContext';
import { Link } from 'react-router-dom';

function App() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
            ClinIQ
          </Link>
          
          <nav className="flex items-center gap-6">
            {user ? (
              <>
                <div className="flex gap-4 items-center mr-4 border-r pr-4 border-gray-200">
                  {user.role === 'ADMIN' && <Link to="/admin/dashboard" className="text-gray-600 hover:text-blue-600 font-medium">Dashboard</Link>}
                  {user.role === 'DOCTOR' && <Link to="/doctor/dashboard" className="text-gray-600 hover:text-blue-600 font-medium">Dashboard</Link>}
                  {user.role === 'PATIENT' && (
                    <>
                      <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium">Dashboard</Link>
                      <Link to="/doctors" className="text-gray-600 hover:text-blue-600 font-medium">Find Doctors</Link>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">Welcome, <span className="font-semibold text-gray-700">{user.name}</span></span>
                  <button onClick={logout} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 font-medium transition text-sm">Logout</button>
                </div>
              </>
            ) : (
              <div className="flex gap-4">
                <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium px-2 py-2">Login</Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition">Register</Link>
              </div>
            )}
          </nav>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<div>Home - Welcome to ClinIQ</div>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="/unauthorized" element={<div className="text-red-500 font-bold">Unauthorized Access</div>} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<PatientDashboard />} />
            <Route path="/doctors" element={<DoctorSearch />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          </Route>
          
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;
