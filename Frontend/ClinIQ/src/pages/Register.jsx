import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { API_BASE_URL } from '../config/env';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="max-w-md mx-auto mt-10 p-8 premium-card fade-in-up border-t-4 border-t-emerald-600">
      <h2 className="text-2xl font-bold text-center text-emerald-700 mb-6">Patient Registration</h2>
      {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-slate-700 font-medium mb-2">Full Name</label>
          <input name="name" type="text" onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-colors" required />
        </div>
        <div className="mb-4">
          <label className="block text-slate-700 font-medium mb-2">Email</label>
          <input name="email" type="email" onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-colors" required />
        </div>
        <div className="mb-4">
          <label className="block text-slate-700 font-medium mb-2">Password</label>
          <input name="password" type="password" onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-colors" required minLength="6" />
        </div>
        <div className="mb-6">
          <label className="block text-slate-700 font-medium mb-2">Phone (Optional)</label>
          <input name="phone" type="text" onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-colors" />
        </div>
        <button type="submit" className="w-full btn-primary mb-4">
          Register
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
          onClick={() => { window.location.href = `${API_BASE_URL}/auth/google?role=PATIENT` }}
        />
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account? <Link to="/login" className="text-emerald-600 font-bold hover:underline transition-colors">Login</Link>
      </p>
    </div>
  );
}
