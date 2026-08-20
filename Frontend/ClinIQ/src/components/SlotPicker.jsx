import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import SymptomIntakeModal from './SymptomIntakeModal';

const SlotPicker = ({ doctorId, doctorName, onClose }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [holding, setHolding] = useState(false);
  const [heldAppointmentId, setHeldAppointmentId] = useState(null);
  const { accessToken } = useAuth();

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
    alert(`Appointment successfully booked! Appointment ID: ${bookedAppointment.id}`);
    onClose();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Book with {doctorName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-bold text-xl">&times;</button>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">Select Date</label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

        {loading ? (
          <p className="text-gray-500 text-center py-4">Checking availability...</p>
        ) : (
          <div>
            <label className="block text-gray-700 font-medium mb-2">Available Slots</label>
            {slots.length === 0 ? (
              <p className="text-gray-500 bg-gray-50 p-4 rounded-lg text-center">No slots available on this date.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {slots.map((slot, idx) => {
                  const startTime = new Date(slot.slotStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <button
                      key={idx}
                      disabled={holding}
                      onClick={() => handleHoldSlot(slot.slotStart, slot.slotEnd)}
                      className="py-2 px-3 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg border border-blue-200 transition-colors disabled:opacity-50 text-sm font-medium"
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
