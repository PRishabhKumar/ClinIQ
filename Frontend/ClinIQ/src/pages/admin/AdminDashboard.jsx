import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';

export default function AdminDashboard() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await apiClient.get('/doctors');
        setDoctors(response.data.data);
      } catch (err) {
        setError('Failed to fetch doctors');
      }
    };
    fetchDoctors();
  }, []);

  const handleLeaveSubmit = async (e, confirm = false) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiClient.post(`/admin/doctors/${selectedDoctor.id}/leave`, {
        date: leaveDate,
        reason: leaveReason,
        confirm,
      });

      setSuccess('Leave day added successfully.');
      setConflicts([]);
      setLeaveDate('');
      setLeaveReason('');
      setSelectedDoctor(null);
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setConflicts(err.response.data.data.conflicts);
      } else {
        setError(err.response?.data?.message || 'An error occurred while adding leave');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Admin Dashboard</h2>

      {error && <div className="mb-4 text-red-600 bg-red-100 p-3 rounded">{error}</div>}
      {success && <div className="mb-4 text-green-600 bg-green-100 p-3 rounded">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Doctors List</h3>
          <ul className="space-y-2">
            {doctors.map(doc => (
              <li key={doc.id} className="p-3 border rounded flex justify-between items-center bg-gray-50">
                <div>
                  <div className="font-medium text-gray-800">{doc.user.name}</div>
                  <div className="text-sm text-gray-500">{doc.specializations.join(', ')}</div>
                </div>
                <button 
                  onClick={() => { setSelectedDoctor(doc); setConflicts([]); setLeaveDate(''); }}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                >
                  Manage Leave
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          {selectedDoctor ? (
            <div className="bg-gray-50 p-6 border rounded shadow-sm">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Add Leave for {selectedDoctor.user.name}</h3>
              <form onSubmit={(e) => handleLeaveSubmit(e, false)} className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={leaveDate}
                    onChange={(e) => setLeaveDate(e.target.value)}
                    className="w-full p-2 border rounded focus:ring focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Reason (Optional)</label>
                  <input
                    type="text"
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full p-2 border rounded focus:ring focus:ring-blue-200"
                    placeholder="e.g. Sick Leave"
                  />
                </div>
                
                {conflicts.length > 0 ? (
                  <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
                    <p className="text-orange-700 font-semibold mb-2">Warning: The following appointments will be cancelled:</p>
                    <ul className="list-disc pl-5 mb-4 text-orange-600 text-sm">
                      {conflicts.map(c => (
                        <li key={c.id}>
                          {new Date(c.slotStart).toLocaleTimeString()} - {c.patient.name}
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleLeaveSubmit(e, true)}
                        className="bg-red-600 text-white px-4 py-2 rounded font-medium hover:bg-red-700 transition"
                        disabled={loading}
                      >
                        {loading ? 'Confirming...' : 'Confirm Cancellation'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConflicts([])}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded font-medium hover:bg-gray-400 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white font-medium py-2 rounded hover:bg-blue-700 transition"
                    disabled={loading}
                  >
                    {loading ? 'Checking...' : 'Check for Conflicts & Add'}
                  </button>
                )}
              </form>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed rounded bg-gray-50 p-6">
              Select a doctor to manage their leaves.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
