import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';

const DEFAULT_USER_FORM = { email: '', name: '', phone: '', role: 'PATIENT', password: '', specializations: '', slotDurationMin: 30 };

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('leave');

  // Leave management state
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // User management state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userForm, setUserForm] = useState(DEFAULT_USER_FORM);
  const [addingUser, setAddingUser] = useState(false);
  const [userFormError, setUserFormError] = useState(null);
  const [userFormSuccess, setUserFormSuccess] = useState(null);

  useEffect(() => {
    fetchDoctors();
    fetchUsers();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await apiClient.get('/doctors');
      setDoctors(response.data.data);
    } catch (err) {
      setError('Failed to fetch doctors');
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await apiClient.get('/admin/users');
      setUsers(response.data.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleLeaveSubmit = async (e, confirm = false) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.post(`/admin/doctors/${selectedDoctor.id}/leave`, { date: leaveDate, reason: leaveReason, confirm });
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

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddingUser(true);
    setUserFormError(null);
    setUserFormSuccess(null);
    try {
      const payload = { ...userForm };
      if (payload.role === 'DOCTOR') {
        payload.specializations = payload.specializations.split(',').map(s => s.trim()).filter(Boolean);
        payload.slotDurationMin = parseInt(payload.slotDurationMin) || 30;
      }
      if (!payload.password) delete payload.password;

      await apiClient.post('/admin/users', payload);
      setUserFormSuccess(`${payload.role === 'DOCTOR' ? 'Doctor' : 'Patient'} "${payload.name}" added successfully!`);
      setUserForm(DEFAULT_USER_FORM);
      fetchUsers();
    } catch (err) {
      setUserFormError(err.response?.data?.error?.message || 'Failed to add user');
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name}? This cannot be undone.`)) return;
    try {
      await apiClient.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to remove user');
    }
  };

  const patientCount = users.filter(u => u.role === 'PATIENT').length;
  const doctorCount = users.filter(u => u.role === 'DOCTOR').length;

  const TAB_CLASS = (tab) => `px-4 py-2 rounded-t-lg font-semibold text-sm transition ${activeTab === tab ? 'bg-white text-blue-600 border-t border-l border-r border-gray-200' : 'text-gray-500 hover:text-gray-700'}`;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8 border-b pb-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Admin Dashboard</h2>
          <p className="text-gray-500 mt-1">Manage users, doctors, schedules, and clinic operations.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium uppercase">Total Doctors</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{doctorCount}</p>
          </div>
          <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium uppercase">Total Patients</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{patientCount}</p>
          </div>
          <div className="bg-green-100 text-green-600 p-3 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium uppercase">Total Users</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{users.length}</p>
          </div>
          <div className="bg-purple-100 text-purple-600 p-3 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        <button className={TAB_CLASS('leave')} onClick={() => setActiveTab('leave')}>Manage Leave</button>
        <button className={TAB_CLASS('users')} onClick={() => setActiveTab('users')}>User Management</button>
      </div>

      {/* ─── Leave Tab ─── */}
      {activeTab === 'leave' && (
        <div>
          {error && <div className="mb-4 text-red-600 bg-red-100 p-4 rounded-lg font-medium">{error}</div>}
          {success && <div className="mb-4 text-green-600 bg-green-100 p-4 rounded-lg font-medium">{success}</div>}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Doctor Roster</h3>
              <ul className="space-y-2">
                {doctors.map(doc => (
                  <li key={doc.id} className="p-3 border rounded flex justify-between items-center bg-gray-50">
                    <div>
                      <div className="font-medium text-gray-800">{doc.user.name}</div>
                      <div className="text-sm text-gray-500">{doc.specializations.join(', ')}</div>
                    </div>
                    <button onClick={() => { setSelectedDoctor(doc); setConflicts([]); setLeaveDate(''); }} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition">Manage Leave</button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              {selectedDoctor ? (
                <div>
                  <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Add Leave for {selectedDoctor.user.name}</h3>
                  <form onSubmit={(e) => handleLeaveSubmit(e, false)} className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-1">Date</label>
                      <input type="date" required value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} className="w-full p-2 border rounded focus:ring focus:ring-blue-200" />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1">Reason (Optional)</label>
                      <input type="text" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} className="w-full p-2 border rounded focus:ring focus:ring-blue-200" placeholder="e.g. Sick Leave" />
                    </div>
                    {conflicts.length > 0 ? (
                      <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
                        <p className="text-orange-700 font-semibold mb-2">Warning: The following appointments will be cancelled:</p>
                        <ul className="list-disc pl-5 mb-4 text-orange-600 text-sm">
                          {conflicts.map(c => <li key={c.id}>{new Date(c.slotStart).toLocaleTimeString()} - {c.patient.name}</li>)}
                        </ul>
                        <div className="flex gap-2">
                          <button type="button" onClick={(e) => handleLeaveSubmit(e, true)} className="bg-red-600 text-white px-4 py-2 rounded font-medium hover:bg-red-700 transition" disabled={loading}>{loading ? 'Confirming...' : 'Confirm Cancellation'}</button>
                          <button type="button" onClick={() => setConflicts([])} className="bg-gray-300 text-gray-700 px-4 py-2 rounded font-medium hover:bg-gray-400 transition">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button type="submit" className="w-full bg-blue-600 text-white font-medium py-2 rounded hover:bg-blue-700 transition" disabled={loading}>{loading ? 'Checking...' : 'Check for Conflicts & Add'}</button>
                    )}
                  </form>
                </div>
              ) : (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-gray-400 border-2 border-dashed rounded-lg bg-gray-50 p-6">
                  <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <p>Select a doctor from the roster to manage their leaves.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Users Tab ─── */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add User Form */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Add New User</h3>
            {userFormError && <div className="mb-3 text-red-600 bg-red-50 border border-red-200 p-3 rounded text-sm">{userFormError}</div>}
            {userFormSuccess && <div className="mb-3 text-green-600 bg-green-50 border border-green-200 p-3 rounded text-sm">{userFormSuccess}</div>}
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm mb-1 font-medium">Role *</label>
                <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full p-2 border rounded focus:ring focus:ring-blue-200">
                  <option value="PATIENT">Patient</option>
                  <option value="DOCTOR">Doctor</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm mb-1 font-medium">Full Name *</label>
                <input type="text" required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full p-2 border rounded focus:ring focus:ring-blue-200" placeholder="Dr. John Smith" />
              </div>
              <div>
                <label className="block text-gray-700 text-sm mb-1 font-medium">Email (Gmail) *</label>
                <input type="email" required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full p-2 border rounded focus:ring focus:ring-blue-200" placeholder="user@gmail.com" />
              </div>
              <div>
                <label className="block text-gray-700 text-sm mb-1 font-medium">Phone</label>
                <input type="text" value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} className="w-full p-2 border rounded focus:ring focus:ring-blue-200" placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-gray-700 text-sm mb-1 font-medium">Password <span className="text-gray-400 font-normal">(optional — leave blank if user will sign in with Google)</span></label>
                <input type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full p-2 border rounded focus:ring focus:ring-blue-200" placeholder="••••••••" />
              </div>
              {userForm.role === 'DOCTOR' && (
                <>
                  <div>
                    <label className="block text-gray-700 text-sm mb-1 font-medium">Specializations * <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                    <input type="text" required value={userForm.specializations} onChange={e => setUserForm({...userForm, specializations: e.target.value})} className="w-full p-2 border rounded focus:ring focus:ring-blue-200" placeholder="Cardiology, Internal Medicine" />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm mb-1 font-medium">Slot Duration (minutes) *</label>
                    <input type="number" required min="10" max="120" value={userForm.slotDurationMin} onChange={e => setUserForm({...userForm, slotDurationMin: e.target.value})} className="w-full p-2 border rounded focus:ring focus:ring-blue-200" />
                  </div>
                </>
              )}
              <button type="submit" disabled={addingUser} className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition disabled:opacity-60">
                {addingUser ? 'Adding...' : `Add ${userForm.role === 'DOCTOR' ? 'Doctor' : 'Patient'}`}
              </button>
            </form>
          </div>

          {/* User List */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Registered Users</h3>
            {usersLoading ? (
              <p className="text-gray-400 text-center py-8">Loading users...</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 hover:bg-gray-100">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${u.role === 'DOCTOR' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{u.role}</span>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{u.name}</p>
                        <p className="text-gray-500 text-xs">{u.email}</p>
                        {u.googleId && <p className="text-xs text-green-600">✓ Google Linked</p>}
                      </div>
                    </div>
                    <button onClick={() => handleRemoveUser(u.id, u.name)} className="text-red-500 hover:text-red-700 text-xs font-medium border border-red-200 px-2 py-1 rounded hover:bg-red-50 transition">Remove</button>
                  </div>
                ))}
                {users.length === 0 && <p className="text-gray-400 text-center py-8">No users found.</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



