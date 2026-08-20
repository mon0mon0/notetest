import { useState, useEffect, createContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutList, BookOpen, LogOut, Moon, Sun, Languages } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { Toaster } from 'sonner';
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
    <div className="w-64 border-r border-gray-200 dark:border-gray-800 p-6 flex flex-col justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-sm z-10 pt-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-8 text-blue-600 dark:text-blue-500 pl-2">Planner</h1>
        <nav className="flex flex-col gap-2">
          <Link to="/" className={`flex items-center gap-3 transition-all p-3 rounded-xl font-medium ${isActive('/') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            <LayoutList size={20} strokeWidth={2} />
            <span>{t.tasks}</span>
          </Link>
          <Link to="/notes" className={`flex items-center gap-3 transition-all p-3 rounded-xl font-medium ${isActive('/notes') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            <BookOpen size={20} strokeWidth={2} />
            <span>{t.notes}</span>
          </Link>
        </nav>
      </div>
      
      <div className="flex flex-col gap-2 border-t border-gray-200 dark:border-gray-800 pt-4">
        <div className="flex gap-2">
          <button onClick={toggleTheme} className="flex-1 flex justify-center items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 font-medium">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button onClick={toggleLang} className="flex-1 flex justify-center items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 font-medium">
            <Languages size={20} />
            <span className="text-sm">{t.lang}</span>
          </button>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="flex justify-center items-center gap-3 text-red-500 hover:text-red-600 transition-all p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 mt-2 font-medium">
          <LogOut size={20} strokeWidth={2} />
          <span>{t.logout}</span>
        </button>
      </div>
    </div>
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
        
        {/* Зона перетаскивания окна */}
        <div data-tauri-drag-region className="h-8 w-full fixed top-0 left-0 z-50 bg-transparent select-none cursor-default"></div>

        <div className="flex h-screen bg-gray-50/90 dark:bg-gray-950/90 text-gray-900 dark:text-gray-100 transition-colors">
          <Sidebar t={t} theme={theme} toggleTheme={toggleTheme} lang={lang} toggleLang={toggleLang} />
          
          <div className="flex-1 p-10 pt-14 overflow-y-auto custom-scrollbar">
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
