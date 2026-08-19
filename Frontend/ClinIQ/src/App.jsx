import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4 text-center">
        <h1 className="text-2xl font-bold text-blue-600">ClinIQ</h1>
      </header>
      <main className="container mx-auto p-4">
        <Routes>
          {/* Public / Patient Routes */}
          <Route path="/" element={<div>Home - Welcome to ClinIQ</div>} />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/register" element={<div>Register Page</div>} />
          <Route path="/dashboard" element={<div>Patient Dashboard</div>} />
          <Route path="/doctors" element={<div>Doctor Search</div>} />

          {/* Doctor Routes */}
          <Route path="/doctor/dashboard" element={<div>Doctor Dashboard</div>} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
