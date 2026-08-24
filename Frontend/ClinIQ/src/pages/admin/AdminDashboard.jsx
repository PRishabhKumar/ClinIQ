import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Loader from '../../components/Loader';

const DEFAULT_USER_FORM = { 
  email: '', name: '', phone: '', role: 'PATIENT', password: '', 
  specializations: '', slotDurationMin: 30,
  workingHours: [
    { weekday: 1, name: 'Mon', enabled: true, startTime: '09:00', endTime: '17:00' },
    { weekday: 2, name: 'Tue', enabled: true, startTime: '09:00', endTime: '17:00' },
    { weekday: 3, name: 'Wed', enabled: true, startTime: '09:00', endTime: '17:00' },
    { weekday: 4, name: 'Thu', enabled: true, startTime: '09:00', endTime: '17:00' },
    { weekday: 5, name: 'Fri', enabled: true, startTime: '09:00', endTime: '17:00' },
    { weekday: 6, name: 'Sat', enabled: false, startTime: '09:00', endTime: '13:00' },
    { weekday: 0, name: 'Sun', enabled: false, startTime: '09:00', endTime: '13:00' }
  ]
};

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
        payload.workingHours = payload.workingHours.filter(wh => wh.enabled).map(wh => ({
          weekday: wh.weekday,
          startTime: wh.startTime,
          endTime: wh.endTime
        }));
      } else {
        delete payload.workingHours;
      }
      if (!payload.password) delete payload.password;

      await apiClient.post('/admin/users', payload);
      setUserFormSuccess(`${payload.role.charAt(0) + payload.role.slice(1).toLowerCase()} "${payload.name}" added successfully!`);
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

  const TAB_CLASS = (tab) => `cursor-pointer px-6 py-3 rounded-t-lg font-bold text-sm transition-colors ${activeTab === tab ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-t border-l border-r border-slate-200 dark:border-slate-800 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Admin Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage users, doctors, schedules, and clinic operations.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="premium-card p-6 flex items-center justify-between premium-hover fade-in-up-delay-1">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wide">Total Doctors</p>
            <p className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mt-2">{doctorCount}</p>
          </div>
          <div className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 p-4 rounded-2xl shadow-sm">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </div>
        </div>
        <div className="premium-card p-6 flex items-center justify-between premium-hover fade-in-up-delay-2">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wide">Total Patients</p>
            <p className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mt-2">{patientCount}</p>
          </div>
          <div className="bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-400 p-4 rounded-2xl shadow-sm">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          </div>
        </div>
        <div className="premium-card p-6 flex items-center justify-between premium-hover fade-in-up-delay-3">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wide">Total Users</p>
            <p className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mt-2">{users.length}</p>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 p-4 rounded-2xl shadow-sm">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 mb-8">
        <button className={TAB_CLASS('leave')} onClick={() => setActiveTab('leave')}>Manage Leave</button>
        <button className={TAB_CLASS('users')} onClick={() => setActiveTab('users')}>User Management</button>
      </div>

      {/* ─── Leave Tab ─── */}
      {activeTab === 'leave' && (
        <div className="fade-in-up">
          {error && <div className="mb-6 text-red-600 bg-red-50 border border-red-200 p-4 rounded-lg font-medium">{error}</div>}
          {success && <div className="mb-6 text-emerald-700 bg-emerald-50 border border-emerald-200 p-4 rounded-lg font-medium">{success}</div>}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="premium-card p-6">
              <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">Doctor Roster</h3>
              <ul className="space-y-3">
                {doctors.map(doc => (
                  <li key={doc.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-100">{doc.user.name}</div>
                      <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{doc.specializations.join(', ')}</div>
                    </div>
                    <button onClick={() => { setSelectedDoctor(doc); setConflicts([]); setLeaveDate(''); }} className="btn-outline text-sm py-1.5 px-3">Manage Leave</button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="premium-card p-6">
              {selectedDoctor ? (
                <div>
                  <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">Add Leave for {selectedDoctor.user.name}</h3>
                  <form onSubmit={(e) => handleLeaveSubmit(e, false)} className="space-y-4">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Date</label>
                      <input type="date" required value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-200" />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Reason (Optional)</label>
                      <input type="text" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-200" placeholder="e.g. Sick Leave" />
                    </div>
                    {conflicts.length > 0 ? (
                      <div className="bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-500 dark:border-orange-600 p-4 mb-4 rounded-r-lg">
                        <p className="text-orange-800 dark:text-orange-300 font-bold mb-2">Warning: The following appointments will be cancelled:</p>
                        <ul className="list-disc pl-5 mb-4 text-orange-700 dark:text-orange-400 text-sm font-medium">
                          {conflicts.map(c => <li key={c.id}>{new Date(c.slotStart).toLocaleTimeString()} - {c.patient.name}</li>)}
                        </ul>
                        <div className="flex gap-2">
                          <button type="button" onClick={(e) => handleLeaveSubmit(e, true)} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition cursor-pointer" disabled={loading}>{loading ? 'Confirming...' : 'Confirm Cancellation'}</button>
                          <button type="button" onClick={() => setConflicts([])} className="btn-outline">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button type="submit" className="w-full btn-primary" disabled={loading}>{loading ? 'Checking...' : 'Check for Conflicts & Add'}</button>
                    )}
                  </form>
                </div>
              ) : (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 p-6">
                  <svg className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <p className="font-medium">Select a doctor from the roster to manage their leaves.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Users Tab ─── */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 fade-in-up">
          {/* Add User Form */}
          <div className="premium-card p-6">
            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">Add New User</h3>
            {userFormError && <div className="mb-4 text-red-600 bg-red-50 border border-red-200 p-4 rounded-lg text-sm font-medium">{userFormError}</div>}
            {userFormSuccess && <div className="mb-4 text-emerald-700 bg-emerald-50 border border-emerald-200 p-4 rounded-lg text-sm font-medium">{userFormSuccess}</div>}
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1 font-bold">Role *</label>
                <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-200 transition-colors">
                  <option value="PATIENT">Patient</option>
                  <option value="DOCTOR">Doctor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1 font-bold">Full Name *</label>
                <input type="text" required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-200 transition-colors" placeholder="Dr. John Smith" />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1 font-bold">Email (Gmail) *</label>
                <input type="email" required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-200 transition-colors" placeholder="user@gmail.com" />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1 font-bold">Phone</label>
                <input type="text" value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-200 transition-colors" placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1 font-bold">Password <span className="text-slate-400 font-normal">(optional — leave blank if user will sign in with Google)</span></label>
                <input type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-200 transition-colors" placeholder="••••••••" />
              </div>
              {userForm.role === 'DOCTOR' && (
                <>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1 font-bold">Specializations * <span className="text-slate-400 font-normal">(comma-separated)</span></label>
                    <input type="text" required value={userForm.specializations} onChange={e => setUserForm({...userForm, specializations: e.target.value})} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-200 transition-colors" placeholder="Cardiology, Internal Medicine" />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1 font-bold">Slot Duration (minutes) *</label>
                    <input type="number" required min="10" max="120" value={userForm.slotDurationMin} onChange={e => setUserForm({...userForm, slotDurationMin: e.target.value})} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-200 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 text-sm mb-2 font-bold">Working Hours *</label>
                    <div className="space-y-2 border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50 max-h-64 overflow-y-auto shadow-inner">
                      {userForm.workingHours.map((wh, idx) => (
                        <div key={wh.weekday} className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={wh.enabled}
                            onChange={(e) => {
                              const newWh = [...userForm.workingHours];
                              newWh[idx].enabled = e.target.checked;
                              setUserForm({...userForm, workingHours: newWh});
                            }}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                          />
                          <span className="w-12 font-bold text-sm text-slate-700 dark:text-slate-300">{wh.name}</span>
                          <input 
                            type="time" 
                            disabled={!wh.enabled}
                            value={wh.startTime} 
                            onChange={(e) => {
                              const newWh = [...userForm.workingHours];
                              newWh[idx].startTime = e.target.value;
                              setUserForm({...userForm, workingHours: newWh});
                            }}
                            className="p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md text-sm disabled:opacity-50"
                          />
                          <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">to</span>
                          <input 
                            type="time" 
                            disabled={!wh.enabled}
                            value={wh.endTime} 
                            onChange={(e) => {
                              const newWh = [...userForm.workingHours];
                              newWh[idx].endTime = e.target.value;
                              setUserForm({...userForm, workingHours: newWh});
                            }}
                            className="p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md text-sm disabled:opacity-50"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <button type="submit" disabled={addingUser} className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed mt-2">
                {addingUser ? 'Adding...' : `Add ${userForm.role.charAt(0) + userForm.role.slice(1).toLowerCase()}`}
              </button>
            </form>
          </div>

          {/* User List */}
          <div className="premium-card p-6">
            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">Registered Users</h3>
            {usersLoading ? (
              <div className="py-8"><Loader text="Loading users..." /></div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${u.role === 'DOCTOR' ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-400 border border-teal-200 dark:border-teal-800' : u.role === 'ADMIN' ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'}`}>{u.role}</span>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{u.name}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">{u.email}</p>
                        {u.googleId && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">✓ Google Linked</p>}
                      </div>
                    </div>
                    <button onClick={() => handleRemoveUser(u.id, u.name)} className="text-red-500 hover:text-red-700 text-xs font-bold border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Remove</button>
                  </div>
                ))}
                {users.length === 0 && <p className="text-slate-400 text-center py-8 font-medium">No users found.</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



