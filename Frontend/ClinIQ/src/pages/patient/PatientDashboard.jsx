import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';
import GoogleLoginButton from '../../components/GoogleLoginButton';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/env';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [activeTab, setActiveTab] = useState('scheduled');

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
      toast.success('Google Calendar Connected Successfully! ✅');
    }
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    
    setCancellingId(id);
    try {
      await apiClient.post(`/appointments/${id}/cancel`);
      toast.success('Appointment cancelled successfully');
      // Refresh list
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return <Loader text="Loading your dashboard..." />;
  }

  const now = new Date();
  
  const scheduledAppointments = appointments.filter(a => 
    a.status === 'BOOKED' || a.status === 'HELD'
  );
  
  const completedAppointments = appointments.filter(a => 
    a.status === 'COMPLETED'
  );

  const cancelledAppointments = appointments.filter(a => 
    a.status === 'CANCELLED' || a.status === 'LEAVE_CANCELLED'
  );

  const getAppointmentsForTab = () => {
    switch(activeTab) {
      case 'scheduled': return scheduledAppointments;
      case 'completed': return completedAppointments;
      case 'cancelled': return cancelledAppointments;
      default: return [];
    }
  };

  const currentTabAppointments = getAppointmentsForTab();

  const renderAppointmentCard = (appt, isUpcoming) => {
    const isBooked = appt.status === 'BOOKED';
    const isCancelled = appt.status === 'CANCELLED' || appt.status === 'LEAVE_CANCELLED';
    
    return (
      <div key={appt.id} className="premium-card p-6 flex flex-col justify-between premium-hover fade-in-up">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Dr. {appt.doctor?.user?.name}</h3>
              <p className="text-emerald-700 text-sm font-medium">{appt.doctor?.specializations?.join(', ')}</p>
            </div>
            <span className={
              isBooked ? 'badge-emerald' : 
              isCancelled ? 'badge-red' : 'badge-slate'
            }>
              {appt.status}
            </span>
          </div>
          
          <div className="text-slate-500 mb-4 space-y-2 text-sm font-medium">
            <p className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              {new Date(appt.slotStart).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {new Date(appt.slotStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(appt.slotEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          
          {appt.preVisitSummary && (
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg mt-4 text-sm shadow-inner">
              <p className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                Pre-Visit Summary
              </p>
              <p className="text-slate-600"><span className="font-medium text-slate-700">Complaint:</span> {appt.preVisitSummary.chiefComplaint}</p>
            </div>
          )}

          {appt.status === 'COMPLETED' && appt.postVisitSummary && (
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg mt-4 text-sm shadow-inner">
              <p className="font-semibold text-emerald-800 mb-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                Post-Visit Prescription
              </p>
              <p className="text-slate-700 mb-2"><span className="font-medium text-slate-800">Summary:</span> {appt.postVisitSummary.patientSummary}</p>
              <p className="text-slate-700 mb-2"><span className="font-medium text-slate-800">Medication:</span> {appt.postVisitSummary.medicationSchedule}</p>
              <p className="text-slate-700"><span className="font-medium text-slate-800">Follow-up:</span> {appt.postVisitSummary.followUpSteps}</p>
            </div>
          )}
        </div>
        
        {isUpcoming && isBooked && (
          <button 
            onClick={() => handleCancel(appt.id)}
            disabled={cancellingId === appt.id}
            className="mt-6 w-full text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancellingId === appt.id ? 'Cancelling...' : 'Cancel Appointment'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 fade-in-up">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Welcome back, {user?.name}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Manage your appointments and health summaries.</p>
        </div>
        {user?.googleId ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm font-medium">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            Calendar Connected
          </div>
        ) : (
          <GoogleLoginButton 
            text="Connect Calendar" 
            onClick={() => { window.location.href = `${API_BASE_URL}/auth/google?role=PATIENT&returnTo=/dashboard` }}
          />
        )}
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}

      <div className="mb-8 border-b border-slate-200 fade-in-up">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`cursor-pointer whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'scheduled'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Scheduled
            <span className={`ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium ${
              activeTab === 'scheduled' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {scheduledAppointments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`cursor-pointer whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'completed'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Completed
            <span className={`ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium ${
              activeTab === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {completedAppointments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('cancelled')}
            className={`cursor-pointer whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'cancelled'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Cancelled
            <span className={`ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium ${
              activeTab === 'cancelled' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {cancelledAppointments.length}
            </span>
          </button>
        </nav>
      </div>

      <div className="mb-12">
        {currentTabAppointments.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 fade-in-up">
            <p className="text-lg font-medium">No appointments found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentTabAppointments.map(appt => renderAppointmentCard(appt, activeTab === 'scheduled'))}
          </div>
        )}
      </div>
    </div>
  );
}
