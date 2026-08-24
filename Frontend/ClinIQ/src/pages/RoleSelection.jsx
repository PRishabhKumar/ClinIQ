import { useNavigate } from 'react-router-dom';

export default function RoleSelection() {
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    navigate(`/login/${role.toLowerCase()}`);
  };

  const roles = [
    {
      id: 'ADMIN',
      title: 'Admin',
      description: 'Manage users, doctors, and clinic operations',
      icon: (
        <svg className="w-8 h-8 mb-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'hover:border-purple-500 hover:shadow-purple-100',
    },
    {
      id: 'DOCTOR',
      title: 'Doctor',
      description: 'Manage your appointments and patients',
      icon: (
        <svg className="w-8 h-8 mb-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      color: 'hover:border-blue-500 hover:shadow-blue-100',
    },
    {
      id: 'PATIENT',
      title: 'Patient',
      description: 'Book appointments and track your health',
      icon: (
        <svg className="w-8 h-8 mb-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: 'hover:border-green-500 hover:shadow-green-100',
    }
  ];

  return (
    <div className="max-w-4xl mx-auto mt-16 p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to ClinIQ</h1>
        <p className="text-xl text-gray-600">You are an :</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => handleRoleSelect(role.id)}
            className={`flex flex-col items-center p-8 bg-white rounded-xl shadow-sm border-2 border-transparent transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${role.color}`}
          >
            {role.icon}
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{role.title}</h2>
            <p className="text-gray-500 text-center text-sm">{role.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
