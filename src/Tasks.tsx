import { useState, useEffect, useContext } from 'react'
import { supabase } from './supabaseClient'
import { CheckCircle2, Circle, Trash2, Plus, Search } from 'lucide-react'
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
    ru: { title: 'Задачи', placeholder: 'Новая задача...', search: 'Поиск задач...', add: 'Добавить', empty: 'Ничего не найдено', successAdd: 'Задача создана', successDel: 'Удалено', all: 'Все', active: 'Активные', completed: 'Завершенные', loading: 'Загрузка...' },
    en: { title: 'Tasks', placeholder: 'New task...', search: 'Search tasks...', add: 'Add', empty: 'No tasks found', successAdd: 'Task created', successDel: 'Deleted', all: 'All', active: 'Active', completed: 'Completed', loading: 'Loading...' }
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
    const { error } = await supabase.from('tasks').update({ is_completed: !currentStatus }).eq('id', id)
    if (!error) setTasks(tasks.map(task => task.id === id ? { ...task, is_completed: !currentStatus } : task))
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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{t.title}</h2>
        
        <div className="flex bg-gray-200/50 dark:bg-gray-800/50 p-1 rounded-xl">
          {(['all', 'active', 'completed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${filter === f ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              {t[f]}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex gap-4 mb-8">
        <form onSubmit={addTask} className="flex-1 flex gap-3 bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all focus-within:ring-2 ring-blue-500/20">
          <input type="text" placeholder={t.placeholder} value={newTask} onChange={(e) => setNewTask(e.target.value)} className="flex-1 p-3 px-4 outline-none bg-transparent text-gray-900 dark:text-white font-medium" />
          <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="p-3 outline-none bg-transparent text-gray-500 dark:text-gray-400 font-medium" />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl transition-colors flex items-center gap-2 font-semibold shadow-md shadow-blue-500/20">
            <Plus size={20} />
            <span className="hidden sm:inline">{t.add}</span>
          </button>
        </form>

        <div className="relative w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder={t.search} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-full pl-11 pr-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 outline-none focus:ring-2 ring-blue-500/20 text-gray-900 dark:text-white font-medium transition-all" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {filteredTasks.map(task => (
            <motion.div 
              key={task.id}
              layout
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              className={`flex items-center justify-between p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border transition-all group ${task.is_completed ? 'border-transparent opacity-50' : 'border-gray-100 dark:border-gray-800'}`}
            >
              <div className="flex items-center gap-4">
                <button onClick={() => toggleTask(task.id, task.is_completed)} className="text-gray-400 hover:text-blue-500 transition-colors">
                  {task.is_completed ? <CheckCircle2 className="text-blue-500" size={26} strokeWidth={2.5} /> : <Circle size={26} strokeWidth={2} />}
                </button>
                <span className={`text-lg font-medium transition-all ${task.is_completed ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-100'}`}>
                  {task.title}
                </span>
                {task.task_time && (
                  <span className="text-sm font-semibold text-gray-500 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-lg border border-gray-100 dark:border-gray-700">
                    {task.task_time}
                  </span>
                )}
              </div>
              <button onClick={() => deleteTask(task.id)} className="text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 hover:text-red-500 dark:hover:text-red-500 transition-all p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30">
                <Trash2 size={20} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading ? (
          <p className="text-gray-400 text-center py-10 font-medium">{t.loading}</p>
        ) : filteredTasks.length === 0 && (
          <p className="text-gray-400 text-center py-10 font-medium">{t.empty}</p>
        )}
      </div>
    </div>
  )
}
