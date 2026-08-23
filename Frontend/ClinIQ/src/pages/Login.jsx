import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GOOGLE_ICON = (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for OAuth error params coming back from the callback
  const params = new URLSearchParams(location.search);
  const oauthError = params.get('error');
  const oauthEmail = params.get('email');
  const expectedRole = params.get('expectedRole');
  const actualRole = params.get('actualRole');

  let oauthErrorMsg = null;
  if (oauthError === 'no_account') {
    oauthErrorMsg = `No ClinIQ account found for ${oauthEmail}. Please contact the admin to get registered.`;
  } else if (oauthError === 'unauthorized_role') {
    oauthErrorMsg = `This email (${oauthEmail}) is registered as a ${actualRole}, not a ${expectedRole}. Please use the correct "Sign in as ${actualRole?.charAt(0) + actualRole?.slice(1).toLowerCase()}" button.`;
  } else if (oauthError === 'oauth_failed') {
    oauthErrorMsg = 'Google sign-in failed. Please try again.';
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user.role === 'DOCTOR') navigate('/doctor/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed');
    }
  };

  const BACKEND = 'http://localhost:5000/api/v1';

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-blue-600 mb-2">Login to ClinIQ</h2>
      <p className="text-center text-gray-500 text-sm mb-6">Access your account securely</p>

      {/* OAuth Error Banner */}
      {oauthErrorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
          {oauthErrorMsg}
        </div>
      )}

      {/* Email + Password Form */}
      {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded" required />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded" required />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-semibold mb-4">
          Login
        </button>
      </form>

      <div className="flex items-center my-5">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="px-3 text-gray-400 text-xs font-medium">OR SIGN IN WITH GOOGLE AS</span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>

      {/* Role-specific Google SSO buttons */}
      <div className="flex flex-col gap-3">
        <a href={`${BACKEND}/auth/google?role=PATIENT`} className="flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-blue-50 hover:border-blue-300 font-medium transition shadow-sm">
          {GOOGLE_ICON}
          <span>Sign in as <strong>Patient</strong></span>
        </a>
        <a href={`${BACKEND}/auth/google?role=DOCTOR`} className="flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-green-50 hover:border-green-300 font-medium transition shadow-sm">
          {GOOGLE_ICON}
          <span>Sign in as <strong>Doctor</strong></span>
        </a>
        <a href={`${BACKEND}/auth/google?role=ADMIN`} className="flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-purple-50 hover:border-purple-300 font-medium transition shadow-sm">
          {GOOGLE_ICON}
          <span>Sign in as <strong>Admin</strong></span>
        </a>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don't have an account? <Link to="/register" className="text-blue-600 font-medium">Register</Link>
      </p>
    </div>
  );
}
