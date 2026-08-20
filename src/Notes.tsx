import { useState, useEffect, useContext } from 'react'
import { supabase } from './supabaseClient'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { ImageIcon, Save, Trash2, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AppContext } from './App'

export default function Notes({ session }: { session: any }) {
  const { lang } = useContext(AppContext) as { lang: 'ru' | 'en' }
  const [notes, setNotes] = useState<any[]>([])
  const [activeNote, setActiveNote] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const t = {
    ru: { title: 'Блокнот', new: 'Новая заметка', empty: 'Нет заметок', save: 'Сохранить', insertImg: 'Вставить картинку', select: 'Выберите заметку слева или создайте новую', successSave: 'Сохранено', successDel: 'Удалено', loading: 'Загрузка...', imgTooBig: 'Файл слишком большой (макс. 5MB)' },
    en: { title: 'Notes', new: 'New note', empty: 'No notes', save: 'Save', insertImg: 'Insert Image', select: 'Select a note on the left or create a new one', successSave: 'Saved', successDel: 'Deleted', loading: 'Loading...', imgTooBig: 'File is too large (max 5MB)' }
  }[lang]

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: '',
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[500px] text-gray-900 dark:text-gray-100 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-4 [&_img]:shadow-sm [&_p]:mb-2 font-medium',
      },
    },
    onUpdate: ({ editor }) => {
      if (activeNote) setActiveNote({ ...activeNote, content: editor.getHTML() })
    },
  })

  useEffect(() => { fetchNotes() }, [])

  useEffect(() => {
    if (editor && activeNote && editor.getHTML() !== activeNote.content) {
      editor.commands.setContent(activeNote.content || '')
    }
  }, [activeNote?.id, editor])

  const fetchNotes = async () => {
    setIsLoading(true)
    const { data } = await supabase.from('notes').select('*').order('created_at', { ascending: false })
    if (data) setNotes(data)
    setIsLoading(false)
  }

  const createNote = async () => {
    const { data, error } = await supabase.from('notes').insert([{ user_id: session.user.id, content: '' }]).select()
    if (data && !error) {
      setNotes([data[0], ...notes])
      setActiveNote(data[0])
    }
  }

  const saveNote = async () => {
    if (!activeNote) return
    setIsSaving(true)
    const { error } = await supabase.from('notes').update({ content: activeNote.content }).eq('id', activeNote.id)
    if (!error) {
      setNotes(notes.map(n => n.id === activeNote.id ? activeNote : n))
      toast.success(t.successSave)
    }
    setIsSaving(false)
  }

  const deleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await supabase.from('notes').delete().eq('id', id)
    setNotes(notes.filter(n => n.id !== id))
    if (activeNote?.id === id) {
      setActiveNote(null)
      editor?.commands.setContent('')
    }
    toast.error(t.successDel)
  }

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t.imgTooBig)
      e.target.value = ''
      return
    }
    setIsUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${session.user.id}/${fileName}`
    const { error } = await supabase.storage.from('images').upload(filePath, file)
    if (!error) {
      const { data } = supabase.storage.from('images').getPublicUrl(filePath)
      editor.chain().focus().setImage({ src: data.publicUrl }).run()
    }
    setIsUploading(false)
  }

  return (
    <div className="flex h-full gap-8 max-w-6xl">
      <div className="w-80 border-r border-gray-200 dark:border-gray-800 pr-6 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{t.title}</h2>
          <button onClick={createNote} className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20">
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
        
        <div className="flex flex-col gap-3 overflow-y-auto pr-2">
          {notes.map(note => (
            <div 
              key={note.id} 
              onClick={() => setActiveNote(note)}
              className={`group p-4 flex items-center justify-between rounded-2xl cursor-pointer transition-all border ${activeNote?.id === note.id ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm' : 'bg-transparent border-transparent hover:bg-white/50 dark:hover:bg-gray-900 hover:border-gray-100 dark:hover:border-gray-800'}`}
            >
              <span className="truncate text-gray-800 dark:text-gray-200 font-medium text-sm flex-1 mr-4">
                {note.content ? note.content.replace(/<[^>]*>?/gm, '').substring(0, 25) || '...' : t.new}
              </span>
              <button onClick={(e) => deleteNote(note.id, e)} className="text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {isLoading ? (
            <p className="text-gray-400 text-sm font-medium text-center py-4">{t.loading}</p>
          ) : notes.length === 0 && (
            <p className="text-gray-400 text-sm font-medium text-center py-4">{t.empty}</p>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
        {activeNote ? (
          <>
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
              <button onClick={saveNote} disabled={isSaving} className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 font-semibold">
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {t.save}
              </button>
              
              <label className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-6 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50 font-semibold">
                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                {t.insertImg}
                <input type="file" accept="image/*" className="hidden" onChange={uploadImage} disabled={isUploading} />
              </label>
            </div>
            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
              <EditorContent editor={editor} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 font-medium text-lg">
            {t.select}
          </div>
        )}
      </div>
    </div>
  )
}
