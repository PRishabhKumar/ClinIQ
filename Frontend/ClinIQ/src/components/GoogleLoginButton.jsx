import React from 'react';

const GoogleLoginButton = ({ onClick, text = "Sign in with Google", type = "button" }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className="group relative flex items-center justify-center p-1 rounded-full bg-white dark:bg-slate-800 shadow-md transition-all duration-500 ease-out hover:w-full max-w-[50px] hover:max-w-xs google-glow-container overflow-hidden active:scale-95 mx-auto cursor-pointer"
      style={{ height: '50px' }}
    >
      <div className="absolute inset-[2px] bg-white dark:bg-slate-800 rounded-full z-0 pointer-events-none"></div>
      
      <div className="google-glow-content flex items-center justify-start w-full px-2 gap-3 whitespace-nowrap z-10">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center p-1">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        </div>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 font-bold text-slate-700 dark:text-slate-200">
          {text}
        </span>
      </div>
    </button>
  );
};

export default GoogleLoginButton;
