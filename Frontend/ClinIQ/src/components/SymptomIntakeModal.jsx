import React, { useState } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const SymptomIntakeModal = ({ appointmentId, onClose, onBookingComplete }) => {
  const [symptoms, setSymptoms] = useState('');
  const [durationDays, setDurationDays] = useState(1);
  const [severity, setSeverity] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { accessToken } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post(`/appointments/${appointmentId}/symptoms`, {
        rawText: symptoms,
        durationDays,
        severity
      });
      
      onBookingComplete(response.data.data);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('An error occurred while confirming your booking.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] fade-in-up">
      <div className="premium-card w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto relative bg-white dark:bg-slate-900 m-auto mt-20 md:mt-auto">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Complete Your Booking</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">
          Your slot is temporarily held. Please provide your symptoms so we can prepare for your visit.
        </p>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 font-medium">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2">What are your main symptoms?</label>
            <textarea 
              required
              rows="4"
              className="w-full p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-200 transition-colors"
              placeholder="E.g., I have had a severe headache and fever..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2">Duration (Days)</label>
              <input 
                type="number" 
                min="1"
                required
                className="w-full p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-200 transition-colors"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2">Severity</label>
              <select 
                className="w-full p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-200 transition-colors cursor-pointer"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="Low" className="text-slate-900 dark:text-slate-100">Low</option>
                <option value="Medium" className="text-slate-900 dark:text-slate-100">Medium</option>
                <option value="High" className="text-slate-900 dark:text-slate-100">High</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="btn-outline disabled:opacity-50 cursor-pointer"
            >
              Cancel Hold
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary disabled:opacity-50 flex items-center cursor-pointer"
            >
              {loading ? (
                <span>Processing...</span>
              ) : (
                <span>Confirm Booking</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SymptomIntakeModal;
