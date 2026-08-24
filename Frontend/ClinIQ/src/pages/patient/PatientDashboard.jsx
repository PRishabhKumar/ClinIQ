import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchAppointments = async () => {
    try {
      const response = await apiClient.get('/appointments');
      setAppointments(response.data.data);
    } catch (err) {
      setError('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    
    // Check if calendar was just connected
    const params = new URLSearchParams(window.location.search);
    if (params.get('calendarConnected') === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname);
      alert('Google Calendar Connected Successfully! ✅');
    }
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    
    setCancellingId(id);
    try {
      await apiClient.post(`/appointments/${id}/cancel`);
      // Refresh list
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 text-lg">Loading dashboard...</div>;
  }

  const now = new Date();
  
  const upcomingAppointments = appointments.filter(a => 
    (a.status === 'BOOKED' || a.status === 'HELD') && new Date(a.slotStart) > now
  );
  
  const pastAppointments = appointments.filter(a => 
    a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'LEAVE_CANCELLED' || new Date(a.slotStart) <= now
  );

  const renderAppointmentCard = (appt, isUpcoming) => {
    const isBooked = appt.status === 'BOOKED';
    const isCancelled = appt.status === 'CANCELLED' || appt.status === 'LEAVE_CANCELLED';
    
    return (
      <div key={appt.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Dr. {appt.doctor?.user?.name}</h3>
              <p className="text-blue-600 text-sm font-medium">{appt.doctor?.specializations?.join(', ')}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
              isBooked ? 'bg-green-100 text-green-700' : 
              isCancelled ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {appt.status}
            </span>
          </div>
          
          <div className="text-gray-600 mb-4 space-y-1 text-sm">
            <p className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              {new Date(appt.slotStart).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {new Date(appt.slotStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(appt.slotEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          
          {appt.preVisitSummary && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-md mt-4 text-sm">
              <p className="font-semibold text-blue-800 mb-1">Pre-Visit AI Summary</p>
              <p className="text-gray-700 mb-2"><span className="font-medium">Complaint:</span> {appt.preVisitSummary.chiefComplaint}</p>
              {appt.preVisitSummary.suggestedQuestions && appt.preVisitSummary.suggestedQuestions.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Suggested Questions for your doctor:</span>
                  <ul className="list-disc pl-5 text-gray-600 mt-1">
                    {appt.preVisitSummary.suggestedQuestions.map((q, i) => <li key={i}>{q}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
        {isUpcoming && isBooked && (
          <button 
            onClick={() => handleCancel(appt.id)}
            disabled={cancellingId === appt.id}
            className="mt-6 w-full text-red-600 border border-red-200 hover:bg-red-50 py-2 rounded-lg font-medium transition disabled:opacity-50"
          >
            {cancellingId === appt.id ? 'Cancelling...' : 'Cancel Appointment'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-start mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
        {user?.googleId ? (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md flex items-center gap-2 shadow-sm font-medium">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            Google Calendar Connected
          </div>
        ) : (
          <a 
            href="http://localhost:5000/api/v1/auth/google?role=PATIENT&returnTo=/dashboard" 
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 font-medium transition shadow-sm flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Connect Google Calendar
          </a>
        )}
      </div>
      <p className="text-gray-500 mb-8">Manage your appointments and health summaries.</p>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          Upcoming Appointments
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">{upcomingAppointments.length}</span>
        </h2>
        
        {upcomingAppointments.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-500">
            <p className="text-lg">You don't have any upcoming appointments.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingAppointments.map(appt => renderAppointmentCard(appt, true))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          Past Appointments
        </h2>
        
        {pastAppointments.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-500">
            <p className="text-lg">No past appointments found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastAppointments.map(appt => renderAppointmentCard(appt, false))}
          </div>
        )}
      </div>
    </div>
  );
}
