import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';
import GoogleLoginButton from '../../components/GoogleLoginButton';
import toast from 'react-hot-toast';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for the Post-Visit notes modal/expandable section
  const [completingAppt, setCompletingAppt] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAppointments = async () => {
    try {
      const response = await apiClient.get('/doctors/me/appointments');
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
      // Clear the URL without reloading the page
      window.history.replaceState({}, document.title, window.location.pathname);
      toast.success('Google Calendar Connected Successfully! ✅');
    }
  }, []);

  const handleComplete = async (e) => {
    e.preventDefault();
    if (!clinicalNotes.trim()) return;

    setIsSubmitting(true);
    try {
      await apiClient.post(`/appointments/${completingAppt.id}/complete`, { clinicalNotes });
      setCompletingAppt(null);
      setClinicalNotes('');
      toast.success('Appointment completed successfully');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Loader text="Loading your schedule..." />;
  }

  const now = new Date();
  
  // As per feedback, show today's and future appointments
  const upcomingAppointments = appointments.filter(a => 
    (a.status === 'BOOKED' || a.status === 'HELD') && new Date(a.slotStart) >= new Date(now.setHours(0,0,0,0))
  );

  const completedAppointments = appointments.filter(a => 
    a.status === 'COMPLETED'
  );

  const renderAppointmentCard = (appt, isUpcoming) => {
    const isBooked = appt.status === 'BOOKED';
    
    return (
      <div key={appt.id} className="premium-card p-6 flex flex-col premium-hover fade-in-up">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{appt.patient?.name}</h3>
            <div className="text-slate-500 dark:text-slate-400 mt-2 space-y-1 text-sm font-medium">
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                {new Date(appt.slotStart).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {new Date(appt.slotStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(appt.slotEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <span className={appt.status === 'COMPLETED' ? 'badge-slate' : 'badge-emerald'}>
            {appt.status}
          </span>
        </div>
        
        {/* Pre-Visit AI Summary */}
        {appt.preVisitSummary && (
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-4 rounded-lg mt-2 mb-4 text-sm flex-grow shadow-inner">
            <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
              Pre-Visit AI Summary
            </p>
            <p className="text-slate-600 dark:text-slate-300"><span className="font-medium text-slate-700 dark:text-slate-200">Urgency:</span> <span className={`font-bold ${appt.preVisitSummary.urgency === 'HIGH' ? 'text-red-600 dark:text-red-400' : appt.preVisitSummary.urgency === 'MEDIUM' ? 'text-orange-500 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{appt.preVisitSummary.urgency}</span></p>
            <p className="text-slate-600 dark:text-slate-300 mt-2"><span className="font-medium text-slate-700 dark:text-slate-200">Chief Complaint:</span> {appt.preVisitSummary.chiefComplaint}</p>
            {appt.preVisitSummary.suggestedQuestions && appt.preVisitSummary.suggestedQuestions.length > 0 && (
              <div className="mt-3">
                <span className="font-medium text-slate-700 dark:text-slate-200">Suggested Questions:</span>
                <ul className="list-disc pl-5 text-slate-600 dark:text-slate-300 mt-1">
                  {appt.preVisitSummary.suggestedQuestions.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        {isUpcoming && isBooked && completingAppt?.id !== appt.id && (
          <button 
            onClick={() => {
              setCompletingAppt(appt);
              setClinicalNotes('');
            }}
            className="mt-auto w-full btn-primary"
          >
            Add Clinical Notes & Complete
          </button>
        )}

        {/* Completion Form */}
        {completingAppt?.id === appt.id && (
          <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-4 fade-in-up">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Post-Visit Clinical Notes</h4>
            <form onSubmit={handleComplete}>
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Enter your clinical observations, diagnosis, prescribed medications, and follow-up advice..."
                className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 mb-3 transition-colors"
                rows="4"
                required
              ></textarea>
              <div className="flex gap-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 btn-primary disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Generating Summary...' : 'Submit & Complete'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setCompletingAppt(null)}
                  disabled={isSubmitting}
                  className="btn-outline disabled:opacity-70"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center fade-in-up">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-1 tracking-tight">Welcome, Dr. {user?.name}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Here is your schedule for today and upcoming appointments.</p>
        </div>
        {user?.googleId ? (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm font-medium">
            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            Calendar Connected
          </div>
        ) : (
          <GoogleLoginButton 
            text="Connect Calendar" 
            onClick={() => { window.location.href = `http://localhost:5000/api/v1/auth/google?role=DOCTOR&returnTo=/doctor/dashboard` }}
          />
        )}
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}

      <div className="mb-12 fade-in-up">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
          Upcoming Schedule
          <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-sm font-bold">{upcomingAppointments.length}</span>
        </h2>
        
        {upcomingAppointments.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400">
            <p className="text-lg font-medium">No appointments scheduled for today or the future.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingAppointments.map(appt => renderAppointmentCard(appt, true))}
          </div>
        )}
      </div>

      {completedAppointments.length > 0 && (
        <div className="fade-in-up-delay-1">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            Recently Completed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedAppointments.slice(0, 6).map(appt => renderAppointmentCard(appt, false))}
          </div>
        </div>
      )}
    </div>
  );
}
