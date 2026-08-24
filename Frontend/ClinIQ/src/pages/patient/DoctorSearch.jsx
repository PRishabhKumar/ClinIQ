import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import SlotPicker from '../../components/SlotPicker';
import Loader from '../../components/Loader';

const DoctorSearch = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const { accessToken } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const url = debouncedSearchTerm 
          ? `/doctors?specialization=${encodeURIComponent(debouncedSearchTerm)}` 
          : '/doctors';
        const response = await apiClient.get(url);
        setDoctors(response.data.data);
      } catch (err) {
        setError('Failed to load doctors');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [debouncedSearchTerm]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 relative fade-in-up">
      <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-6 tracking-tight">Find a Doctor</h2>
      
      <div className="mb-10">
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by specialization (e.g. Cardiology)"
          className="w-full md:w-1/2 p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-colors"
        />
      </div>

      {loading && <Loader text="Searching for doctors..." />}
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}
      
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 col-span-full">
              <p className="text-lg font-medium">No doctors available at the moment.</p>
            </div>
          ) : (
            doctors.map((doctor, idx) => (
              <div key={doctor.id} className={`premium-card p-6 flex flex-col justify-between premium-hover fade-in-up-delay-${(idx % 2) + 1}`}>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">{doctor.user.name}</h3>
                  <p className="text-emerald-700 dark:text-emerald-500 font-medium mb-4 text-sm">
                    {doctor.specializations.join(', ')}
                  </p>
                  <div className="text-slate-500 text-sm mb-6 flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    {doctor.user.email}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedDoctor(doctor)}
                  className="w-full btn-primary mt-auto cursor-pointer">
                  View Availability
                </button>
              </div>
            ))
          )}
        </div>
      )}

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
