import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { motion } from 'framer-motion'
import { toast, Toaster } from 'sonner'
import { Sparkles } from 'lucide-react'

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

  if (needsConfirmation) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
        <Toaster position="bottom-right" richColors />
        <div className="absolute w-[600px] h-[600px] bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col gap-6 w-96 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-10 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl text-center z-10"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-600/30">
            <Sparkles size={22} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Подтверждение</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">
            Письмо со ссылкой отправлено на почту.<br/>Обязательно проверьте папку «Спам».
          </p>
          
          <button
            onClick={resendEmail}
            disabled={loading || !canResend}
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all font-semibold text-xs shadow-lg shadow-blue-600/25 mt-2"
          >
            {canResend ? 'Отправить повторно' : `Повтор через ${timeLeft} с`}
          </button>
          
          <button
            onClick={() => setNeedsConfirmation(false)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors text-xs font-medium"
          >
            Вернуться ко входу
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      <Toaster position="bottom-right" richColors />
      <div className="absolute w-[600px] h-[600px] bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>
      
      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6 w-96 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-10 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl z-10"
      >
        <div className="flex items-center gap-3 justify-center mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Sparkles size={20} />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">Planner</span>
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl outline-none focus:border-blue-500 transition-all text-slate-900 dark:text-white font-medium text-sm"
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl outline-none focus:border-blue-500 transition-all text-slate-900 dark:text-white font-medium text-sm"
          />
        </div>

        <div className="flex gap-3 mt-2">
          <button 
            onClick={(e) => handleAuth(e, 'login')} 
            disabled={loading || !email || !password} 
            className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 transition-all font-semibold text-xs shadow-md"
          >
            Вход
          </button>
          <button 
            onClick={(e) => handleAuth(e, 'register')} 
            disabled={loading || !email || !password} 
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all font-semibold text-xs shadow-lg shadow-blue-600/25"
          >
            Создать
          </button>
        </div>
      </motion.form>
    </div>
  )
}
