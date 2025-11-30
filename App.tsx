
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { LandingPage } from './components/LandingPage';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { StorageSetupModal } from './components/StorageSetupModal';
import { User, Language, Theme, UserSettings } from './types';
import { TRANSLATIONS, CURRENCIES, ENTITY_TYPES } from './constants';
import { Sun, Moon, Languages, LogOut, CheckCircle, Briefcase, Facebook, Lock, ShieldCheck, Wallet, PieChart, Home } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('light');
  const [loading, setLoading] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  
  // Setup Wizard State
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState<UserSettings>({
    currency: 'USD',
    entityName: '',
    entityType: 'individual'
  });

  // Storage State
  const [showStorageSetup, setShowStorageSetup] = useState(false);
  const [fileHandle, setFileHandle] = useState<any>(null);

  // Lock State
  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Initialize theme and lang from local storage or system
  useEffect(() => {
    const savedTheme = localStorage.getItem('mda_theme') as Theme;
    const savedLang = localStorage.getItem('mda_lang') as Language;
    
    if (savedTheme) setTheme(savedTheme);
    if (savedLang) setLang(savedLang);
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
       setTheme('dark');
    }
    
    // Check for existing session
    const savedUser = localStorage.getItem('mda_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      // Keep landing page as main page - don't hide it
      
      // Check for PIN
      if (parsedUser.settings?.securityPin) {
        setIsLocked(true);
      }

      // If user exists but no settings, show setup
      if (!parsedUser.settings) {
         setShowSetup(true);
         setShowLanding(false); // Hide landing during setup
      } else if (!parsedUser.settings.storageType) {
         setShowStorageSetup(true);
         setShowLanding(false); // Hide landing during storage setup
      } else if (parsedUser.settings.storageType === 'file') {
         setShowStorageSetup(true);
         setShowLanding(false); // Hide landing during file selection
      }
    }
  }, []);

  // Effect to apply theme class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mda_theme', theme);
  }, [theme]);

  // Effect to apply direction and lang
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.style.fontFamily = lang === 'ar' ? '"Noto Sans Arabic", sans-serif' : '"Inter", sans-serif';
    localStorage.setItem('mda_lang', lang);
  }, [lang]);

  const handleLogin = (demo: boolean) => {
    setLoading(true);
    setTimeout(() => {
      const newUser: User = demo ? {
        id: 'demo-123',
        name: 'Demo User',
        email: 'demo@example.com',
        avatar: 'https://picsum.photos/100/100',
      } : {
        id: 'google-user-123',
        name: 'User Name',
        email: 'user@gmail.com',
        avatar: 'https://picsum.photos/100/100'
      };
      
      setUser(newUser);
      localStorage.setItem('mda_user', JSON.stringify(newUser));
      setLoading(false);
      // Keep landing page visible - don't hide it
      
      if (!newUser.settings) {
        setShowSetup(true);
        setShowLanding(false); // Hide only for setup
      } else if (!newUser.settings.storageType) {
        setShowStorageSetup(true);
        setShowLanding(false); // Hide only for storage setup
      }
    }, 800);
  };

  const handleLogout = () => {
    setUser(null);
    setShowSetup(false);
    localStorage.removeItem('mda_user');
    setIsLocked(false);
    setPinInput('');
    setShowLanding(true); // Return to landing page after logout
    setFileHandle(null);
    setShowStorageSetup(false);
  };

  const handleSetupComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const finalSetupData = {
      ...setupData,
      entityName: setupData.entityName.trim() || user.name
    };

    const updatedUser = { ...user, settings: finalSetupData };
    setUser(updatedUser);
    localStorage.setItem('mda_user', JSON.stringify(updatedUser));
    setShowSetup(false);
    
    // After account setup, show storage setup
    if (!updatedUser.settings.storageType) {
      setShowStorageSetup(true);
    } else {
      setShowLanding(true); // Return to landing page after setup
    }
  };

  const handleStorageSetupComplete = (type: 'local' | 'file', handle?: any) => {
    if (!user) return;
    
    const updatedUser = { 
      ...user, 
      settings: { 
        ...user.settings!, 
        storageType: type 
      } 
    };
    
    setUser(updatedUser);
    localStorage.setItem('mda_user', JSON.stringify(updatedUser));
    
    if (type === 'file' && handle) {
      setFileHandle(handle);
    }
    
    setShowStorageSetup(false);
    setShowLanding(true); // Return to landing page after storage setup
  };

  const handleUnlock = () => {
    if (user?.settings?.securityPin === pinInput) {
      setIsLocked(false);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'ar' : 'en');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const t = TRANSLATIONS[lang];

  // Lock Screen
  if (user && isLocked) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${theme === 'dark' ? 'mesh-bg' : 'light-mesh-bg'}`}>
         <div className="glass-panel p-6 sm:p-8 rounded-3xl w-full max-w-sm text-center animate-zoom-in relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-pink-500"></div>
           <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 ring-4 ring-red-500/20">
             <Lock size={32} className="sm:w-9 sm:h-9" />
           </div>
           <h2 className="text-xl sm:text-2xl font-bold dark:text-white mb-2">{t.enterPin}</h2>
           <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-8">{user.name}</p>
           
           <input
             type="password"
             maxLength={4}
             value={pinInput}
             onChange={(e) => {
               setPinInput(e.target.value.replace(/\D/g, ''));
               setPinError(false);
             }}
             className="w-full text-center text-4xl tracking-[1em] py-4 border-b-2 border-gray-300 dark:border-gray-600 focus:border-red-500 bg-transparent dark:text-white outline-none mb-8 font-mono transition-colors"
             placeholder="••••"
           />
           {pinError && <p className="text-red-500 text-sm mb-4 animate-pulse font-medium">{t.pinError}</p>}
           
           <button 
             onClick={handleUnlock}
             className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white py-4 rounded-xl font-bold transition shadow-lg shadow-red-500/30 active:scale-[0.98]"
           >
             Unlock
           </button>
         </div>
      </div>
    );
  }

  if (!user) {
    // Show Privacy Policy
    if (showPrivacy) {
      return (
        <PrivacyPolicy
          lang={lang}
          theme={theme}
          onBack={() => {
            setShowPrivacy(false);
            setShowLanding(true);
          }}
        />
      );
    }

    // Show Terms of Service
    if (showTerms) {
      return (
        <TermsOfService
          lang={lang}
          theme={theme}
          onBack={() => {
            setShowTerms(false);
            setShowLanding(true);
          }}
        />
      );
    }

    // Show Landing Page first
    if (showLanding) {
      return (
        <LandingPage
          lang={lang}
          theme={theme}
          onToggleLang={toggleLang}
          onToggleTheme={toggleTheme}
          onGetStarted={() => setShowLanding(false)}
          onShowPrivacy={() => {
            setShowLanding(false);
            setShowPrivacy(true);
          }}
          onShowTerms={() => {
            setShowLanding(false);
            setShowTerms(true);
          }}
          user={user}
          onGoToDashboard={() => setShowLanding(false)}
        />
      );
    }

    // Login Screen
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden ${theme === 'dark' ? 'mesh-bg' : 'light-mesh-bg'}`}>
        
        {/* Floating Elements - Hidden on mobile for cleaner look */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
          <div className="absolute top-[10%] left-[10%] text-6xl opacity-20 animate-float select-none blur-sm">💰</div>
          <div className="absolute top-[20%] right-[15%] text-4xl opacity-20 animate-float select-none blur-sm" style={{ animationDelay: '1s' }}>💎</div>
          <div className="absolute bottom-[15%] left-[15%] text-6xl opacity-20 animate-float select-none blur-sm" style={{ animationDelay: '2s' }}>🚀</div>
          <div className="absolute bottom-[20%] right-[10%] text-5xl opacity-20 animate-float select-none blur-sm" style={{ animationDelay: '3s' }}>🛡️</div>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl animate-pop-in border-t border-white/40">
          <div className="flex justify-end gap-3 mb-8">
            <button onClick={toggleTheme} className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition active:scale-90 text-gray-600 dark:text-gray-300">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-yellow-400" />}
            </button>
            <button onClick={toggleLang} className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition font-bold text-xs active:scale-90 text-gray-600 dark:text-gray-300 flex items-center gap-1">
              <Languages size={18} /> {lang === 'en' ? 'AR' : 'EN'}
            </button>
          </div>

          <div className="text-center mb-8 sm:mb-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-500/30 rotate-3 hover:rotate-6 transition-transform duration-500">
              <Wallet size={32} className="text-white sm:w-10 sm:h-10" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-gradient mb-3 animate-slide-up">
              {t.appTitle}
            </h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 animate-slide-up font-medium" style={{animationDelay: '0.1s'}}>{t.signInTitle}</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => handleLogin(false)}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-white/90 text-gray-700 font-bold py-4 px-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50 transition active:scale-[0.98] animate-slide-up group"
              style={{animationDelay: '0.2s'}}
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {t.signInGoogle}
            </button>

            <div className="relative flex py-2 items-center animate-slide-up" style={{animationDelay: '0.3s'}}>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold tracking-wider">OR</span>
              <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            </div>

            <button 
              onClick={() => handleLogin(true)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-cyber-primary text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-blue-500/20 hover:opacity-90 transition active:scale-[0.98] animate-slide-up"
              style={{animationDelay: '0.4s'}}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <CheckCircle size={20} />
                  {t.demoLogin}
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="absolute bottom-6 flex flex-col items-center gap-2 animate-fade-in z-20" style={{animationDelay: '0.5s'}}>
          <div className="flex items-center gap-2 glass-card px-4 py-2 rounded-full">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t.developedBy}</span>
            <a 
              href="https://www.facebook.com/Dark.Storm.X.Blak/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#1877F2] hover:scale-110 transition-transform duration-200"
            >
              <Facebook size={24} fill="#1877F2" className="drop-shadow-sm bg-white rounded-full p-0.5" />
            </a>
          </div>
          <p className="text-gray-400 text-xs text-center opacity-60 font-mono">
            v1.0.0 • Secure Client-Side
          </p>
        </div>
      </div>
    );
  }

  // Storage Setup Overlay
  if (showStorageSetup && user) {
    return (
      <StorageSetupModal
        lang={lang}
        onComplete={handleStorageSetupComplete}
        onCancel={() => {
           // If they cancel, default to local? Or logout?
           // Let's default to local for safety
           handleStorageSetupComplete('local');
        }}
      />
    );
  }

  // Account Setup Wizard Overlay
  if (showSetup) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${theme === 'dark' ? 'mesh-bg' : 'light-mesh-bg'}`}>
        <div className="relative z-10 w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl animate-zoom-in">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-purple-500/30">
               <Briefcase size={28} className="text-white sm:w-8 sm:h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gradient mb-2 animate-slide-up">
              {t.setupTitle}
            </h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 animate-slide-up" style={{animationDelay: '0.1s'}}>{t.setupSubtitle}</p>
          </div>

          <form onSubmit={handleSetupComplete} className="space-y-6">
            <div className="animate-slide-up" style={{animationDelay: '0.2s'}}>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-1">
                {t.entityType}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ENTITY_TYPES[lang].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSetupData(prev => ({ ...prev, entityType: type.value }))}
                    className={`py-4 px-4 rounded-xl border-2 text-sm font-bold transition-all duration-300 active:scale-95 ${
                      setupData.entityType === type.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 shadow-md transform scale-[1.02]'
                        : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-500/50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="animate-slide-up" style={{animationDelay: '0.3s'}}>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                {t.entityName}
              </label>
              <input
                type="text"
                value={setupData.entityName}
                onChange={(e) => setSetupData(prev => ({ ...prev, entityName: e.target.value }))}
                placeholder={user.name}
                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-4 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white dark:focus:bg-black/40"
              />
            </div>

            <div className="animate-slide-up" style={{animationDelay: '0.4s'}}>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">
                {t.currency}
              </label>
              <div className="relative">
                <select
                  value={setupData.currency}
                  onChange={(e) => setSetupData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-4 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-all focus:bg-white dark:focus:bg-black/40 cursor-pointer"
                >
                  {CURRENCIES.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.symbol} - {curr.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition mt-4 active:scale-[0.98] animate-slide-up"
              style={{animationDelay: '0.5s'}}
            >
              {t.completeSetup}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Authenticated App
  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${theme === 'dark' ? 'mesh-bg' : 'light-mesh-bg'}`}>
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-cyber-panel/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5 animate-slide-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <button onClick={() => setShowLanding(true)} className="flex items-center gap-4 hover:opacity-80 transition-opacity text-left">
               <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform duration-300">
                 <Briefcase size={24} />
               </div>
               <div className="flex flex-col">
                 <span className="font-bold text-lg text-gray-800 dark:text-white leading-tight">
                   {user.settings?.entityName || user.name}
                 </span>
                 <span className="text-xs font-medium text-blue-500 dark:text-blue-400 uppercase tracking-wider">
                    {user.settings?.entityType || 'Accountant'}
                 </span>
               </div>
            </button>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowLanding(true)}
                className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition active:scale-90 hidden sm:block"
                title={lang === 'ar' ? 'الرئيسية' : 'Home'}
              >
                <Home size={20} />
              </button>

              <button 
                onClick={toggleTheme}
                className="p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition active:scale-90"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-yellow-400" />}
              </button>
              
              <button 
                onClick={toggleLang}
                className="flex items-center gap-1.5 p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition font-bold text-xs active:scale-90"
              >
                <Languages size={20} />
                <span className="text-xs font-bold">{lang.toUpperCase()}</span>
              </button>

              <div className="h-8 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>

              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-4 py-2.5 rounded-xl transition text-sm font-bold active:scale-95"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">{t.logout}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="flex-grow">
        <Dashboard 
          user={user} 
          lang={lang} 
          onLogout={handleLogout}
          currency={user.settings?.currency || 'USD'} 
          fileHandle={fileHandle}
        />
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-gray-500 dark:text-gray-400 mt-auto">
        <div className="glass-card inline-flex items-center gap-3 px-6 py-3 rounded-full mb-2">
          <span className="font-medium">{t.developedBy}</span>
          <a 
            href="https://www.facebook.com/Dark.Storm.X.Blak/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#1877F2] hover:scale-110 transition-transform duration-200"
          >
             <Facebook size={24} fill="#1877F2" className="drop-shadow-sm bg-white rounded-full p-0.5" />
          </a>
        </div>
        <p className="text-xs opacity-50 font-mono mt-2">v1.0.0</p>
      </footer>

    </div>
  );
};

export default App;
