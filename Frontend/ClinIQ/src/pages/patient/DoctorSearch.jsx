import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import SlotPicker from '../../components/SlotPicker';

const DoctorSearch = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const { accessToken } = useAuth();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/v1/doctors', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setDoctors(response.data.data);
      } catch (err) {
        setError('Failed to load doctors');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [accessToken]);

  return (
    <div className="max-w-4xl mx-auto py-8 relative">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Find a Doctor</h2>
      
      <div className="mb-8">
        <input 
          type="text" 
          placeholder="Search by specialization (e.g. Cardiology)"
          className="w-full md:w-1/2 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {loading && <p className="text-gray-500 text-lg">Loading doctors...</p>}
      {error && <p className="text-red-500 text-lg">{error}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!loading && doctors.length === 0 && !error && (
          <p className="text-gray-500 text-lg col-span-2">No doctors available at the moment.</p>
        )}
        
        {doctors.map(doctor => (
          <div key={doctor.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">{doctor.user.name}</h3>
              <p className="text-blue-600 font-medium mb-3">
                {doctor.specializations.join(', ')}
              </p>
              <div className="text-gray-600 text-sm mb-4">
                <p>Email: {doctor.user.email}</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedDoctor(doctor)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors mt-auto">
              View Availability
            </button>
          </div>
        ))}
      </div>

      {selectedDoctor && (
        <SlotPicker 
          doctorId={selectedDoctor.id} 
          doctorName={selectedDoctor.user.name} 
          onClose={() => setSelectedDoctor(null)} 
        />
      )}
    </div>
  );
};

export default DoctorSearch;
