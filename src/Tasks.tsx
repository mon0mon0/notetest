import { useState, useEffect, useContext } from 'react'
import { supabase } from './supabaseClient'
import { Check, Trash2, Plus, Search, ClipboardList } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { AppContext } from './App'

export default function Tasks({ session }: { session: any }) {
  const { lang } = useContext(AppContext) as { lang: 'ru' | 'en' }
  const [tasks, setTasks] = useState<any[]>([])
  const [newTask, setNewTask] = useState('')
  const [newTime, setNewTime] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [isLoading, setIsLoading] = useState(true)

  const t = {
    ru: { title: 'Задачи', placeholder: 'Новая задача...', search: 'Поиск задач...', add: 'Добавить', empty: 'Ничего не найдено', emptyHint: 'Добавьте первую задачу выше', successAdd: 'Задача создана', successDel: 'Удалено', all: 'Все', active: 'Активные', completed: 'Завершены', loading: 'Загрузка...' },
    en: { title: 'Tasks', placeholder: 'New task...', search: 'Search tasks...', add: 'Add', empty: 'No tasks found', emptyHint: 'Add your first task above', successAdd: 'Task created', successDel: 'Deleted', all: 'All', active: 'Active', completed: 'Completed', loading: 'Loading...' }
  }[lang]

  useEffect(() => { fetchTasks() }, [])

  const fetchTasks = async () => {
    setIsLoading(true)
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    if (data) setTasks(data)
    setIsLoading(false)
  }

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.trim()) return
    const { data, error } = await supabase.from('tasks').insert([{ title: newTask, task_time: newTime || null, user_id: session.user.id }]).select()
    if (!error && data) {
      setTasks([data[0], ...tasks])
      setNewTask('')
      setNewTime('')
      toast.success(t.successAdd)
    }
  }

  const toggleTask = async (id: string, currentStatus: boolean) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, is_completed: !currentStatus } : task))
    const { error } = await supabase.from('tasks').update({ is_completed: !currentStatus }).eq('id', id)
    if (error) setTasks(tasks.map(task => task.id === id ? { ...task, is_completed: currentStatus } : task))
  }

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (!error) {
      setTasks(tasks.filter(task => task.id !== id))
      toast.error(t.successDel)
    }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === 'all' || (filter === 'active' && !task.is_completed) || (filter === 'completed' && task.is_completed)
    return matchesSearch && matchesFilter
  })

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <h2 className="text-[28px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>{t.title}</h2>

        <div className="relative flex rounded-xl p-1" style={{ background: 'var(--surface-2)' }}>
          {(['all', 'active', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="relative px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors"
              style={{ color: filter === f ? '#fff' : 'var(--text-dim)' }}
            >
              {filter === f && (
                <motion.div layoutId="task-filter-pill" className="absolute inset-0 rounded-lg" style={{ background: 'var(--accent)' }} transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
              )}
              <span className="relative z-10">{t[f]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mb-7">
        <form
          onSubmit={addTask}
          className="flex-1 flex items-center gap-2 rounded-2xl p-1.5 pl-4 transition-all"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-panel)' }}
        >
          <input
            type="text"
            placeholder={t.placeholder}
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="flex-1 py-2.5 outline-none bg-transparent text-[15px] font-medium"
            style={{ color: 'var(--text)' }}
          />
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="py-2.5 outline-none bg-transparent text-sm font-medium"
            style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}
          />
          <motion.button
            type="submit"
            whileTap={{ scale: 0.94 }}
            className="text-white px-5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 font-semibold text-sm shrink-0"
            style={{ background: 'var(--accent)' }}
          >
            <Plus size={17} />
            <span className="hidden sm:inline">{t.add}</span>
          </motion.button>
        </form>

        <div className="relative w-56 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-faint)' }} />
          <input
            type="text"
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-full pl-11 pr-4 py-2 rounded-2xl outline-none text-sm font-medium transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', boxShadow: 'var(--shadow-panel)' }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-16 opacity-60">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-faint)' }}>{t.loading}</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredTasks.map((task, i) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: Math.min(i, 8) * 0.03 } }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                className="flex items-center justify-between px-4 py-3.5 rounded-2xl group transition-colors"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  opacity: task.is_completed ? 0.55 : 1,
                }}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <button onClick={() => toggleTask(task.id, task.is_completed)} className="shrink-0">
                    <motion.div
                      whileTap={{ scale: 0.85 }}
                      className="w-[22px] h-[22px] rounded-full flex items-center justify-center transition-colors"
                      style={{
                        background: task.is_completed ? 'var(--accent)' : 'transparent',
                        border: task.is_completed ? 'none' : '2px solid var(--border-strong)',
                      }}
                    >
                      <AnimatePresence>
                        {task.is_completed && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
                            <Check size={13} strokeWidth={3} color="#fff" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </button>
                  <span
                    className="text-[15px] font-medium truncate transition-all"
                    style={{
                      color: task.is_completed ? 'var(--text-faint)' : 'var(--text)',
                      textDecoration: task.is_completed ? 'line-through' : 'none',
                    }}
                  >
                    {task.title}
                  </span>
                  {task.task_time && (
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded-lg shrink-0"
                      style={{ background: 'var(--surface-2)', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}
                    >
                      {task.task_time}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-all p-2 rounded-lg shrink-0 ml-2"
                  style={{ color: 'var(--text-faint)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-faint)')}
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {!isLoading && filteredTasks.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 animate-in">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
              <ClipboardList size={20} style={{ color: 'var(--text-faint)' }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-dim)' }}>{t.empty}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{t.emptyHint}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
