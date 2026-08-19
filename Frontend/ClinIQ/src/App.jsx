import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './routes/AppRoutes';
import Login from './pages/Login';
import Register from './pages/Register';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">ClinIQ</h1>
        {user && (
          <button onClick={logout} className="text-gray-600 hover:text-gray-800">Logout</button>
        )}
      </header>
      <main className="container mx-auto p-4">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<div>Home - Welcome to ClinIQ</div>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<div className="text-red-500 font-bold">Unauthorized Access</div>} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Patient Dashboard - Welcome {user?.name}</div>} />
            <Route path="/doctors" element={<div>Doctor Search</div>} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
            <Route path="/doctor/dashboard" element={<div>Doctor Dashboard</div>} />
          </Route>
          
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;
