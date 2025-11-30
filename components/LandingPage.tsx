import React, { useEffect } from 'react';
import { Language, Theme, User } from '../types';
import { TRANSLATIONS } from '../constants';
import { Wallet, FileText, Wifi, Lock, Sun, Moon, Languages, ArrowRight, Check, Facebook, TrendingUp, Shield, Zap, Mail, LayoutDashboard } from 'lucide-react';

interface LandingPageProps {
  lang: Language;
  theme: Theme;
  onToggleLang: () => void;
  onToggleTheme: () => void;
  onGetStarted: () => void;
  onShowPrivacy?: () => void;
  onShowTerms?: () => void;
  user?: User | null;
  onGoToDashboard?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  lang,
  theme,
  onToggleLang,
  onToggleTheme,
  onGetStarted,
  onShowPrivacy,
  onShowTerms,
  user,
  onGoToDashboard
}) => {
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    // Smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  // Feature cards data
  const features = [
    {
      icon: <Wallet size={32} />,
      title: t.landingFeature1Title,
      description: t.landingFeature1Desc,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <FileText size={32} />,
      title: t.landingFeature2Title,
      description: t.landingFeature2Desc,
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Wifi size={32} />,
      title: t.landingFeature3Title,
      description: t.landingFeature3Desc,
      color: 'from-cyan-500 to-teal-500'
    },
    {
      icon: <Lock size={32} />,
      title: t.landingFeature4Title,
      description: t.landingFeature4Desc,
      color: 'from-pink-500 to-red-500'
    }
  ];

  const stats = [
    { label: t.landingStat1, icon: <TrendingUp size={24} /> },
    { label: t.landingStat2, icon: <Zap size={24} /> },
    { label: t.landingStat3, icon: <Shield size={24} /> }
  ];

  const benefits = [
    t.landingBenefit1,
    t.landingBenefit2,
    t.landingBenefit3,
    t.landingBenefit4
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'mesh-bg' : 'light-mesh-bg'} transition-colors duration-500`}>
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-cyber-panel/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform duration-300">
                <Wallet size={24} />
              </div>
              <span className="font-black text-xl text-gradient hidden sm:inline">
                {t.landingHeroTitle}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button 
                onClick={onToggleTheme}
                className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition active:scale-90"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-yellow-400" />}
              </button>
              
              <button 
                onClick={onToggleLang}
                className="flex items-center gap-1.5 p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition font-bold text-xs active:scale-90"
                aria-label="Toggle language"
              >
                <Languages size={20} />
                <span className="text-xs font-bold">{lang === 'en' ? 'AR' : 'EN'}</span>
              </button>

              {user && onGoToDashboard ? (
                <button 
                  onClick={onGoToDashboard}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-blue-500/30 transition active:scale-95"
                >
                  <LayoutDashboard size={18} />
                  <span className="hidden sm:inline">{lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</span>
                </button>
              ) : (
                <button 
                  onClick={onGetStarted}
                  className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-blue-500/30 transition active:scale-95"
                >
                  {t.landingCTA}
                  <ArrowRight size={18} className={lang === 'ar' ? 'rotate-180' : ''} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-32">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gradient mb-6 animate-fade-in leading-tight">
              {t.landingHeroTitle}
            </h1>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-cyan-400 mb-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
              {t.landingHeroSubtitle}
            </p>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-10 animate-slide-up max-w-2xl mx-auto leading-relaxed" style={{animationDelay: '0.2s'}}>
              {t.landingHeroDescription}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{animationDelay: '0.3s'}}>
              <button 
                onClick={onGetStarted}
                className="group flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-5 px-10 rounded-2xl shadow-2xl shadow-blue-500/40 transition-all active:scale-95 text-lg hover:shadow-blue-500/60 hover:scale-105"
              >
                {t.landingCTA}
                <ArrowRight size={22} className={`group-hover:translate-x-1 transition-transform ${lang === 'ar' ? 'rotate-180' : ''}`} />
              </button>
              
              <button 
                onClick={onGetStarted}
                className="flex items-center gap-2 bg-white dark:bg-white/10 text-gray-800 dark:text-white font-bold py-5 px-10 rounded-2xl border-2 border-gray-200 dark:border-white/20 hover:border-blue-500 dark:hover:border-cyan-500 transition-all active:scale-95 text-lg hover:scale-105"
              >
                {t.landingCTASecondary}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="glass-panel p-6 sm:p-8 rounded-3xl hover:scale-105 transition-all duration-300 group cursor-pointer border border-white/10 hover:border-white/30 animate-pop-in"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${feature.color} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-black text-center text-gradient mb-16">
            {t.landingStatsTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="glass-panel p-8 sm:p-10 rounded-3xl text-center hover:scale-105 transition-all duration-300 border border-white/10 animate-zoom-in"
                style={{animationDelay: `${index * 0.15}s`}}
              >
                <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-blue-500/30">
                  {stat.icon}
                </div>
                <p className="text-3xl font-black text-gradient mb-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-black text-center text-gradient mb-16">
            {t.landingStatsTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "Sarah K.", text: t.landingTestimonial1, color: "from-blue-500 to-cyan-500" },
              { name: "Ahmed M.", text: t.landingTestimonial2, color: "from-purple-500 to-pink-500" },
              { name: "John D.", text: t.landingTestimonial3, color: "from-green-500 to-emerald-500" },
              { name: "Lisa R.", text: t.landingTestimonial4, color: "from-orange-500 to-red-500" },
              { name: "Omar H.", text: t.landingTestimonial5, color: "from-indigo-500 to-blue-500" },
              { name: "Fatima A.", text: t.landingTestimonial6, color: "from-pink-500 to-rose-500" }
            ].map((testimonial, index) => (
              <div 
                key={index}
                className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 animate-slide-up hover:scale-105 transition-transform duration-300"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${testimonial.color}`}></div>
                  <div>
                    <div className="flex gap-1 text-yellow-400 mb-1">
                      {'★★★★★'.split('').map((star, i) => <span key={i}>{star}</span>)}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{testimonial.name}</p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-200 leading-relaxed italic">
                  "{testimonial.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 animate-slide-in-right" style={{animationDelay: `${index * 0.1}s`}}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Check size={18} className="text-white" />
                  </div>
                  <p className="text-gray-700 dark:text-gray-200 font-medium">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 sm:py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/20">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Mail size={32} className="text-white" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-gradient mb-6">
              {t.landingFooterContact}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              {t.landingFooterAbout}
            </p>
            <a 
              href="https://www.facebook.com/Dark.Storm.X.Blak/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 text-lg hover:shadow-blue-500/50 hover:scale-105"
            >
              <Facebook size={24} />
              {t.landingFooterContact}
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 sm:py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/20">
            <h2 className="text-4xl sm:text-5xl font-black text-gradient mb-6">
              {t.landingCTA}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              {t.landingHeroDescription}
            </p>
            <button 
              onClick={onGetStarted}
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-6 px-12 rounded-2xl shadow-2xl shadow-blue-500/40 transition-all active:scale-95 text-xl hover:shadow-blue-500/60 hover:scale-105"
            >
              {t.landingCTA}
              <ArrowRight size={24} className={`group-hover:translate-x-1 transition-transform ${lang === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200/50 dark:border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* About */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                  <Wallet size={20} />
                </div>
                <span className="font-bold text-lg text-gradient">{t.landingHeroTitle}</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {t.landingFooterAbout}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-gray-800 dark:text-white mb-4">{t.landingFooterQuickLinks}</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li>
                  <button 
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    className="hover:text-blue-500 dark:hover:text-cyan-400 transition"
                  >
                    {t.landingFooterFeatures}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={onShowPrivacy}
                    className="hover:text-blue-500 dark:hover:text-cyan-400 transition"
                  >
                    {t.landingFooterPrivacy}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={onShowTerms}
                    className="hover:text-blue-500 dark:hover:text-cyan-400 transition"
                  >
                    {t.landingFooterTerms}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                    className="hover:text-blue-500 dark:hover:text-cyan-400 transition inline-flex items-center gap-1"
                  >
                    {t.landingFooterContact}
                  </button>
                </li>
              </ul>
            </div>

            {/* Developer Credit */}
            <div>
              <h4 className="font-bold text-gray-800 dark:text-white mb-4">{t.developedBy}</h4>
              <div className="flex items-center gap-3">
                <a 
                  href="https://www.facebook.com/Dark.Storm.X.Blak/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#1877F2] hover:scale-110 transition-transform duration-200"
                >
                  <Facebook size={32} fill="#1877F2" className="drop-shadow-md bg-white rounded-full p-1" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-200/50 dark:border-white/5 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              © {new Date().getFullYear()} {t.landingHeroTitle}. {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-2 font-mono">
              v1.0.0 • Secure Client-Side • PWA Ready
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
