import { useState, useEffect, createContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutList, BookOpen, LogOut, Moon, Sun, Languages, Sparkles } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { Toaster } from 'sonner';
import { motion } from 'framer-motion';
import Auth from './Auth';
import Tasks from './Tasks';
import Notes from './Notes';

export const AppContext = createContext<any>(null);

const translations = {
  ru: { tasks: 'Задачи', notes: 'Блокнот', logout: 'Выйти', theme: 'Тема', lang: 'EN' },
  en: { tasks: 'Tasks', notes: 'Notes', logout: 'Logout', theme: 'Theme', lang: 'RU' }
};

function Sidebar({ t, theme, toggleTheme, lang, toggleLang }: any) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-72 border-r border-slate-200/60 dark:border-slate-800/60 p-6 flex flex-col justify-between bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl z-10 pt-12 shadow-[1px_0_20px_rgba(0,0,0,0.02)]"
    >
      <div>
        <div className="flex items-center gap-3 mb-10 px-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Sparkles size={18} />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Planner
          </span>
        </div>

        <nav className="flex flex-col gap-2">
          <Link 
            to="/" 
            className={`flex items-center gap-3.5 transition-all p-3.5 rounded-2xl font-medium text-sm ${
              isActive('/') 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-900/60'
            }`}
          >
            <LayoutList size={20} strokeWidth={2.2} />
            <span>{t.tasks}</span>
          </Link>

          <Link 
            to="/notes" 
            className={`flex items-center gap-3.5 transition-all p-3.5 rounded-2xl font-medium text-sm ${
              isActive('/notes') 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-900/60'
            }`}
          >
            <BookOpen size={20} strokeWidth={2.2} />
            <span>{t.notes}</span>
          </Link>
        </nav>
      </div>
      
      <div className="flex flex-col gap-3 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="flex gap-2">
          <button 
            onClick={toggleTheme} 
            className="flex-1 flex justify-center items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all p-3 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 hover:bg-slate-200/60 dark:hover:bg-slate-800 font-medium text-xs"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            <span>{t.theme}</span>
          </button>
          <button 
            onClick={toggleLang} 
            className="flex-1 flex justify-center items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all p-3 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 hover:bg-slate-200/60 dark:hover:bg-slate-800 font-semibold text-xs"
          >
            <Languages size={16} />
            <span>{t.lang}</span>
          </button>
        </div>

        <button 
          onClick={() => supabase.auth.signOut()} 
          className="flex items-center justify-center gap-2 text-rose-500 hover:text-rose-600 transition-all p-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium text-xs w-full"
        >
          <LogOut size={16} strokeWidth={2.2} />
          <span>{t.logout}</span>
        </button>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<'ru' | 'en'>('ru');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');

    const savedLang = localStorage.getItem('lang') as 'ru' | 'en' || 'ru';
    setLang(savedLang);
    
    return () => subscription.unsubscribe();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const toggleLang = () => {
    const newLang = lang === 'ru' ? 'en' : 'ru';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  if (!session) return <Auth />;

  const t = translations[lang];

  return (
    <AppContext.Provider value={{ lang, t }}>
      <BrowserRouter>
        <Toaster position="bottom-right" theme={theme} richColors />
        
        <div data-tauri-drag-region className="h-10 w-full fixed top-0 left-0 z-50 bg-transparent select-none cursor-default flex items-center justify-between px-4">
          <div className="flex items-center gap-2 pl-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          </div>
        </div>

        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors overflow-hidden">
          <Sidebar t={t} theme={theme} toggleTheme={toggleTheme} lang={lang} toggleLang={toggleLang} />
          
          <div className="flex-1 p-12 pt-16 overflow-y-auto custom-scrollbar relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
            <Routes>
              <Route path="/" element={<Tasks session={session} />} />
              <Route path="/notes" element={<Notes session={session} />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AppContext.Provider>
  );
}
