import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { motion } from 'framer-motion'
import { toast, Toaster } from 'sonner'
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  const [timeLeft, setTimeLeft] = useState(60)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (needsConfirmation && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timerId)
    } else if (timeLeft === 0) {
      setCanResend(true)
    }
  }, [timeLeft, needsConfirmation])

  const handleAuth = async (e: React.FormEvent, type: 'login' | 'register') => {
    e.preventDefault()
    setLoading(true)

    if (type === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) toast.error(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        toast.error(error.message)
      } else {
        setNeedsConfirmation(true)
        setTimeLeft(60)
        setCanResend(false)
        toast.success('Письмо отправлено')
      }
    }
    setLoading(false)
  }

  const resendEmail = async () => {
    setLoading(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) {
      toast.error(error.message)
    } else {
      setTimeLeft(60)
      setCanResend(false)
      toast.success('Письмо отправлено повторно')
    }
    setLoading(false)
  }

  return (
    <div className="flex h-screen items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="ambient-glow" style={{ opacity: 0.3 }} />
      <div data-tauri-drag-region className="h-9 w-full fixed top-0 left-0 z-50 bg-transparent select-none cursor-default" />
      <Toaster position="bottom-right" richColors />

      {needsConfirmation ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="glass flex flex-col gap-6 w-96 p-10 rounded-3xl text-center relative z-10"
          style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-panel)' }}
        >
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
            <Mail size={24} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--text)' }}>Подтверждение</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
              Письмо со ссылкой отправлено на почту.<br />Проверьте папку «Спам».
            </p>
          </div>

          <button
            onClick={resendEmail}
            disabled={loading || !canResend}
            className="w-full py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-40 active:scale-[0.98]"
            style={{ background: 'var(--accent)' }}
          >
            {canResend ? 'Отправить повторно' : `Повтор через ${timeLeft} с`}
          </button>

          <button
            onClick={() => setNeedsConfirmation(false)}
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-faint)' }}
          >
            Вернуться ко входу
          </button>
        </motion.div>
      ) : (
        <motion.form
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="glass flex flex-col gap-7 w-96 p-10 rounded-3xl relative z-10"
          style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-panel)' }}
        >
          <div className="text-center">
            <div className="w-11 h-11 rounded-2xl mx-auto mb-4 flex items-center justify-center font-bold text-white text-lg" style={{ background: 'var(--accent)' }}>
              P
            </div>
            <h2 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>Вход в Planner</h2>
          </div>

          <div className="flex flex-col gap-3">
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl outline-none font-medium text-sm transition-all"
                style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-faint)' }} />
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl outline-none font-medium text-sm transition-all"
                style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={(e) => handleAuth(e, 'login')}
              disabled={loading || !email || !password}
              className="w-full py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-40 active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ background: 'var(--accent)' }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>Войти <ArrowRight size={15} /></>}
            </button>
            <button
              onClick={(e) => handleAuth(e, 'register')}
              disabled={loading || !email || !password}
              className="w-full py-3.5 rounded-xl font-semibold transition-all disabled:opacity-40 active:scale-[0.98]"
              style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              Создать аккаунт
            </button>
          </div>
        </motion.form>
      )}
    </div>
  )
}
