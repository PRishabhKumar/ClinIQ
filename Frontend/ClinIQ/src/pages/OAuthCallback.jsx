import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const userStr = params.get('user');
    const returnTo = params.get('returnTo');

    if (accessToken && refreshToken && userStr) {
      // Save tokens and user
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', userStr);
      
      const parsedUser = JSON.parse(userStr);
      
      let redirectUrl = '/';
      
      if (returnTo && returnTo !== '') {
        redirectUrl = returnTo + (returnTo.includes('?') ? '&' : '?') + 'calendarConnected=true';
      } else {
        if (parsedUser.role === 'ADMIN') redirectUrl = '/admin/dashboard';
        else if (parsedUser.role === 'DOCTOR') redirectUrl = '/doctor/dashboard';
        else redirectUrl = '/dashboard';
      }
      
      // Reload page to let AuthContext pick up the tokens and user
      window.location.href = redirectUrl; 
    } else {
      navigate('/login?error=oauth_failed');
    }
  }, [location, navigate]);

  return (
    <div className="flex justify-center items-center h-64">
      <div className="text-xl text-gray-600">Completing login...</div>
    </div>
  );
}
