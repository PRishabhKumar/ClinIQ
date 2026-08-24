import { useState } from 'react';
import { useNavigate, Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/GoogleLoginButton';

export default function Login() {
  const { role = 'patient' } = useParams();
  const normalizedRole = role.toUpperCase();
  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);

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
    oauthErrorMsg = `This email (${oauthEmail}) is registered as a ${actualRole}, not a ${expectedRole}. Please use the correct role login page.`;
  } else if (oauthError === 'oauth_failed') {
    oauthErrorMsg = 'Google sign-in failed. Please try again.';
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      // Validate role
      if (user.role !== normalizedRole) {
        setError(`You are a ${user.role}, but tried to sign in as a ${normalizedRole}.`);
        return;
      }

      if (user.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user.role === 'DOCTOR') navigate('/doctor/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed');
    }
  };

  const BACKEND = 'http://localhost:5000/api/v1';

  return (
    <div className="max-w-md mx-auto mt-10 p-8 premium-card fade-in-up border-t-4 border-t-emerald-600">
      <Link to="/login" className="text-sm text-slate-500 hover:text-emerald-600 mb-6 inline-block transition-colors">&larr; Back to role selection</Link>
      
      <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mb-2">Sign in as <span className="text-emerald-700 dark:text-emerald-500">{roleDisplay}</span></h2>
      <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-8">Securely access your ClinIQ account</p>

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
          <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 text-slate-900 dark:text-white transition-colors" required />
        </div>
        <div className="mb-6">
          <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 text-slate-900 dark:text-white transition-colors" required />
        </div>
        <button type="submit" className="w-full btn-primary mb-4">
          Sign In
        </button>
      </form>

      <div className="flex items-center my-5">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="px-3 text-gray-400 text-xs font-medium">OR</span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>

      <div className="flex flex-col gap-3">
        <GoogleLoginButton 
          text="Sign in with Google" 
          onClick={() => { window.location.href = `${BACKEND}/auth/google?role=${normalizedRole}` }}
        />
      </div>

      {normalizedRole === 'PATIENT' && (
        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account? <Link to="/register" className="text-emerald-600 font-bold hover:underline transition-colors">Register</Link>
        </p>
      )}
    </div>
  );
}
