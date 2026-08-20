import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { motion } from 'framer-motion'
import { toast, Toaster } from 'sonner'

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
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Toaster position="bottom-right" richColors />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col gap-6 w-96 bg-white dark:bg-gray-900 p-10 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-xl text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Подтверждение</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
            Письмо со ссылкой отправлено на почту.<br/>Обязательно проверьте папку «Спам».
          </p>
          
          <button
            onClick={resendEmail}
            disabled={loading || !canResend}
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors mt-4 font-semibold shadow-md shadow-blue-500/20"
          >
            {canResend ? 'Отправить повторно' : `Повтор через ${timeLeft} с`}
          </button>
          
          <button
            onClick={() => setNeedsConfirmation(false)}
            className="text-gray-400 dark:text-gray-500 font-medium hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Вернуться ко входу
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <Toaster position="bottom-right" richColors />
      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-8 w-96 bg-white dark:bg-gray-900 p-10 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-xl"
      >
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">Вход в Planner</h2>

        <div className="flex flex-col gap-5">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-4 rounded-xl outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors text-gray-900 dark:text-white font-medium"
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-4 rounded-xl outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors text-gray-900 dark:text-white font-medium"
          />
        </div>

        <div className="flex gap-4 mt-2">
          <button 
            onClick={(e) => handleAuth(e, 'login')} 
            disabled={loading || !email || !password} 
            className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3.5 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors font-semibold"
          >
            Вход
          </button>
          <button 
            onClick={(e) => handleAuth(e, 'register')} 
            disabled={loading || !email || !password} 
            className="flex-1 bg-blue-50 dark:bg-gray-800 text-blue-600 dark:text-white py-3.5 rounded-xl hover:bg-blue-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors font-semibold"
          >
            Создать
          </button>
        </div>
      </motion.form>
    </div>
  )
}
