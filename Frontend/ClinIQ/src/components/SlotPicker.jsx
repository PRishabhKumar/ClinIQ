import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import SymptomIntakeModal from './SymptomIntakeModal';
import Loader from './Loader';

const SlotPicker = ({ doctorId, doctorName, onClose }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [holding, setHolding] = useState(false);
  const [heldAppointmentId, setHeldAppointmentId] = useState(null);
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!date) return;
    
    const fetchSlots = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`http://localhost:5000/api/v1/doctors/${doctorId}/availability?date=${date}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        setSlots(response.data.data);
      } catch (err) {
        setError('Failed to fetch slots.');
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [doctorId, date, accessToken]);

  const handleHoldSlot = async (slotStart, slotEnd) => {
    setHolding(true);
    setError('');
    try {
      const response = await axios.post(`http://localhost:5000/api/v1/appointments/hold`, {
        doctorId,
        slotStart,
        slotEnd
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      setHeldAppointmentId(response.data.data.id);
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setError('Sorry, this slot is no longer available. Please choose another.');
        setDate(date); 
      } else {
        setError('Failed to hold slot. Try again.');
      }
      setHolding(false);
    }
  };

  const handleBookingComplete = (bookedAppointment) => {
    toast.success(`Appointment successfully booked! (ID: ${bookedAppointment.id})`);
    onClose();
    navigate('/dashboard');
  };

  if (heldAppointmentId) {
    return (
      <SymptomIntakeModal 
        appointmentId={heldAppointmentId}
        onClose={onClose}
        onBookingComplete={handleBookingComplete}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50 fade-in-up">
      <div className="premium-card w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto relative bg-white dark:bg-slate-900">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Book with {doctorName}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold text-2xl transition-colors cursor-pointer">&times;</button>
        </div>

        <div className="mb-6">
          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2">Select Date</label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-200 transition-colors"
          />
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 font-medium">{error}</div>}

        {loading ? (
          <div className="py-6"><Loader text="Checking availability..." /></div>
        ) : (
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-3">Available Slots</label>
            {slots.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-6 rounded-xl text-center border-2 border-dashed border-slate-200 dark:border-slate-700 font-medium">No slots available on this date.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {slots.map((slot, idx) => {
                  const startTime = new Date(slot.slotStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <button
                      key={idx}
                      disabled={holding}
                      onClick={() => handleHoldSlot(slot.slotStart, slot.slotEnd)}
                      className="py-2.5 px-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors disabled:opacity-50 text-sm font-bold shadow-sm cursor-pointer"
                    >
                      {startTime}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotPicker;
