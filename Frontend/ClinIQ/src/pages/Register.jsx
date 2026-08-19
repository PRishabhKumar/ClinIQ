import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">Patient Registration</h2>
      {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Full Name</label>
          <input name="name" type="text" onChange={handleChange} className="w-full p-2 border rounded" required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input name="email" type="email" onChange={handleChange} className="w-full p-2 border rounded" required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Password</label>
          <input name="password" type="password" onChange={handleChange} className="w-full p-2 border rounded" required minLength="6" />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Phone (Optional)</label>
          <input name="phone" type="text" onChange={handleChange} className="w-full p-2 border rounded" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          Register
        </button>
      </form>
      <p className="mt-4 text-center">
        Already have an account? <Link to="/login" className="text-blue-600">Login</Link>
      </p>
    </div>
  );
}
