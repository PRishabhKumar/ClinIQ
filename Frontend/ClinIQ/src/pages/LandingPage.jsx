import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-[85vh] fade-in-up relative overflow-hidden">
      
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-1/2 h-[600px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-bl-full blur-3xl -z-10 pointer-events-none translate-x-1/4 -translate-y-1/4"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/5 rounded-tr-full blur-3xl -z-10 pointer-events-none -translate-x-1/4 translate-y-1/4"></div>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center text-center py-24 px-4 z-10">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 mb-8 fade-in-up-delay-1">
            <span className="flex w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            The Future of Healthcare is Here
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-8 leading-[1.1] fade-in-up-delay-1">
            Care without the <br className="hidden md:block" />
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">complexity.</span>
              <svg className="absolute w-full h-4 -bottom-1 left-0 text-emerald-400/30 dark:text-emerald-400/20" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 15 100 5" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
            </span>
          </h1>
          
          <p className="text-lg md:text-2xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto font-medium fade-in-up-delay-2 leading-relaxed">
            A frictionless platform uniting elite specialists and modern convenience. Seamless booking, instant records, and care tailored to you.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center fade-in-up-delay-3">
            <Link to="/register" className="group relative inline-flex items-center justify-center gap-2 bg-emerald-600 text-white text-lg font-semibold px-8 py-4 rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-600/20">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative">Start Your Journey</span>
              <svg className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </Link>
            
            <Link to="/login" className="inline-flex items-center justify-center bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-lg font-semibold px-8 py-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all active:scale-95">
              Access Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Modern Features Grid */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
            {/* Feature 1 */}
            <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-3xl p-8 border border-white/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/20 dark:shadow-none hover:-translate-y-2 transition-all duration-500 overflow-hidden fade-in-up-delay-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100 to-transparent dark:from-emerald-900/30 opacity-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <div className="w-14 h-14 bg-emerald-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-slate-600 relative z-10">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 relative z-10">Curated Experts</h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed relative z-10">Connect instantly with a network of board-certified specialists, vetted for excellence and available when you need them.</p>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-3xl p-8 border border-white/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/20 dark:shadow-none hover:-translate-y-2 transition-all duration-500 overflow-hidden fade-in-up-delay-2 lg:translate-y-8">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-100 to-transparent dark:from-teal-900/30 opacity-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <div className="w-14 h-14 bg-teal-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-6 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-slate-600 relative z-10">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 relative z-10">Intelligent Booking</h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed relative z-10">Our dynamic calendar system syncs effortlessly with your life. Reschedule, cancel, or book in seconds.</p>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-3xl p-8 border border-white/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/20 dark:shadow-none hover:-translate-y-2 transition-all duration-500 overflow-hidden fade-in-up-delay-3">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-transparent dark:from-blue-900/30 opacity-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <div className="w-14 h-14 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-6 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 relative z-10">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 relative z-10">Digital Health Hub</h3>
              <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed relative z-10">Every prescription, visit summary, and doctor's note stored securely in your encrypted personal portal.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
