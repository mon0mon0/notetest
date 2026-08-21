import { useState, useEffect, useRef, createContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutList, BookOpen, LogOut, Moon, Sun, Settings, X, Check } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Auth from './Auth';
import Tasks from './Tasks';
import Notes from './Notes';

export const AppContext = createContext<any>(null);

const translations = {
  ru: { tasks: 'Задачи', notes: 'Блокнот', logout: 'Выйти', settings: 'Настройки', theme: 'Тема', accent: 'Цвет акцента', lang: 'Язык' },
  en: { tasks: 'Tasks', notes: 'Notes', logout: 'Log out', settings: 'Settings', theme: 'Theme', accent: 'Accent color', lang: 'Language' }
};

export const ACCENTS: Record<string, { accent: string; strong: string }> = {
  blue:     { accent: '#0A84FF', strong: '#0071E3' },
  purple:   { accent: '#BF5AF2', strong: '#A64DD4' },
  pink:     { accent: '#FF375F', strong: '#E62E52' },
  red:      { accent: '#FF3B30', strong: '#E6352B' },
  orange:   { accent: '#FF9F0A', strong: '#E68F09' },
  yellow:   { accent: '#FFD60A', strong: '#D6B609' },
  green:    { accent: '#30D158', strong: '#2BBC4E' },
  graphite: { accent: '#8E8E93', strong: '#79797D' },
};

function applyAccent(key: string) {
  const p = ACCENTS[key] || ACCENTS.blue;
  const root = document.documentElement.style;
  root.setProperty('--accent', p.accent);
  root.setProperty('--accent-strong', p.strong);
  root.setProperty('--accent-soft', p.accent + '22');
}

function NavIcon({ to, icon: Icon, label, active }: any) {
  return (
    <Link to={to} className="relative flex items-center justify-center w-11 h-11 rounded-2xl group">
      {active && (
        <motion.div
          layoutId="nav-pill"
          className="absolute inset-0 rounded-2xl"
          style={{ background: 'var(--surface-hover)' }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        />
      )}
      <Icon
        size={19}
        strokeWidth={2}
        className="relative z-10 transition-colors"
        style={{ color: active ? 'var(--accent)' : 'var(--text-dim)' }}
      />
      <span
        className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-20 shadow-lg glass"
        style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
      >
        {label}
      </span>
    </Link>
  );
}

function SettingsPanel({ open, onClose, t, theme, toggleTheme, lang, toggleLang, accent, setAccent }: any) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.92, x: -8, y: 8 }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, x: -8, y: 4 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className="glass absolute left-full bottom-0 ml-3 w-72 rounded-2xl p-2.5 z-30"
          style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-panel)' }}
        >
          <div className="flex items-center justify-between px-2 py-1.5 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>{t.settings}</span>
            <button onClick={onClose} className="p-1 rounded-md hover:opacity-70 transition-opacity">
              <X size={14} style={{ color: 'var(--text-faint)' }} />
            </button>
          </div>

          <div className="flex items-center justify-between px-2 py-2.5 rounded-xl" style={{ color: 'var(--text)' }}>
            <span className="text-sm font-medium">{t.theme}</span>
            <button
              onClick={toggleTheme}
              className="relative w-12 h-7 rounded-full flex items-center px-0.5 transition-colors"
              style={{ background: theme === 'dark' ? 'var(--accent)' : 'var(--border-strong)' }}
            >
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm"
                style={{ marginLeft: theme === 'dark' ? 20 : 0 }}
              >
                {theme === 'dark' ? <Moon size={12} style={{ color: 'var(--accent)' }} /> : <Sun size={12} style={{ color: 'var(--text-dim)' }} />}
              </motion.div>
            </button>
          </div>

          <div className="px-2 py-2.5 rounded-xl" style={{ color: 'var(--text)' }}>
            <span className="text-sm font-medium">{t.accent}</span>
            <div className="flex flex-wrap gap-2.5 mt-2.5 px-0.5">
              {Object.entries(ACCENTS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setAccent(key)}
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                  style={{ background: val.accent }}
                >
                  {accent === key && <Check size={12} strokeWidth={3} color="#fff" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between px-2 py-2.5 rounded-xl" style={{ color: 'var(--text)' }}>
            <span className="text-sm font-medium">{t.lang}</span>
            <div className="flex rounded-lg p-0.5" style={{ background: 'var(--surface-2)' }}>
              {(['ru', 'en'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => l !== lang && toggleLang()}
                  className="relative px-3 py-1 text-xs font-semibold rounded-md uppercase transition-colors"
                  style={{ color: lang === l ? '#fff' : 'var(--text-dim)' }}
                >
                  {lang === l && (
                    <motion.div layoutId="lang-pill" className="absolute inset-0 rounded-md" style={{ background: 'var(--accent)' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                  )}
                  <span className="relative z-10">{l}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px my-1.5" style={{ background: 'var(--border)' }} />

          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center gap-2.5 px-2 py-2.5 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--danger)' }}
          >
            <LogOut size={16} strokeWidth={2} />
            {t.logout}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Sidebar({ t, theme, toggleTheme, lang, toggleLang, accent, setAccent }: any) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div
      className="glass w-[68px] flex flex-col items-center justify-between py-5 pt-12 relative z-20"
      style={{ borderRight: '1px solid var(--border)' }}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm text-white" style={{ background: 'var(--accent)' }}>
          P
        </div>
        <nav className="flex flex-col gap-1.5">
          <NavIcon to="/" icon={LayoutList} label={t.tasks} active={isActive('/')} />
          <NavIcon to="/notes" icon={BookOpen} label={t.notes} active={isActive('/notes')} />
        </nav>
      </div>

      <div className="relative">
        <button
          onClick={() => setSettingsOpen(v => !v)}
          className="w-11 h-11 rounded-2xl flex items-center justify-center transition-colors"
          style={{ background: settingsOpen ? 'var(--surface-hover)' : 'transparent' }}
        >
          <motion.div animate={{ rotate: settingsOpen ? 45 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
            <Settings size={19} strokeWidth={2} style={{ color: settingsOpen ? 'var(--accent)' : 'var(--text-dim)' }} />
          </motion.div>
        </button>
        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} t={t} theme={theme} toggleTheme={toggleTheme} lang={lang} toggleLang={toggleLang} accent={accent} setAccent={setAccent} />
      </div>
    </div>
  );
}

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<'ru' | 'en'>('ru');
  const [accent, setAccentState] = useState('blue');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));

    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');

    const savedLang = localStorage.getItem('lang') as 'ru' | 'en' || 'ru';
    setLang(savedLang);

    const savedAccent = localStorage.getItem('accent') || 'blue';
    setAccentState(savedAccent);
    applyAccent(savedAccent);

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

  const setAccent = (key: string) => {
    setAccentState(key);
    localStorage.setItem('accent', key);
    applyAccent(key);
  };

  if (!session) return <Auth />;

  const t = translations[lang];

  return (
    <AppContext.Provider value={{ lang, t }}>
      <BrowserRouter>
        <Toaster position="bottom-right" theme={theme} richColors />

        <div data-tauri-drag-region className="h-9 w-full fixed top-0 left-0 z-50 bg-transparent select-none cursor-default"></div>

        <div className="flex h-screen relative overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
          <div className="ambient-glow" />
          <Sidebar t={t} theme={theme} toggleTheme={toggleTheme} lang={lang} toggleLang={toggleLang} accent={accent} setAccent={setAccent} />

          <div className="flex-1 p-10 pt-16 overflow-y-auto custom-scrollbar relative z-10">
            <PageTransition>
              <Routes>
                <Route path="/" element={<Tasks session={session} />} />
                <Route path="/notes" element={<Notes session={session} />} />
              </Routes>
            </PageTransition>
          </div>
        </div>
      </BrowserRouter>
    </AppContext.Provider>
  );
}
