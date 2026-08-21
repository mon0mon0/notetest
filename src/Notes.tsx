import { useState, useEffect, useContext } from 'react'
import { supabase } from './supabaseClient'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { ImageIcon, Save, Trash2, Plus, Loader2, FileText, BookOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
    ru: { title: 'Блокнот', new: 'Новая заметка', empty: 'Нет заметок', save: 'Сохранить', insertImg: 'Картинка', select: 'Выберите заметку слева или создайте новую', emptyHint: 'Нажмите «+», чтобы начать', successSave: 'Сохранено', successDel: 'Удалено', loading: 'Загрузка...', imgTooBig: 'Файл слишком большой (макс. 5MB)', untitled: 'Без названия' },
    en: { title: 'Notes', new: 'New note', empty: 'No notes', save: 'Save', insertImg: 'Image', select: 'Select a note on the left or create a new one', emptyHint: 'Press “+” to get started', successSave: 'Saved', successDel: 'Deleted', loading: 'Loading...', imgTooBig: 'File is too large (max 5MB)', untitled: 'Untitled' }
  }[lang]

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: '',
    editorProps: { attributes: { class: 'tiptap-content' } },
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
    e.target.value = ''
  }

  const previewText = (html: string) => {
    const div = document.createElement('div')
    div.innerHTML = html || ''
    return div.textContent?.trim() || ''
  }

  return (
    <div className="flex h-full gap-6 max-w-6xl mx-auto">
      <div className="w-[280px] shrink-0 flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[28px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>{t.title}</h2>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={createNote}
            className="text-white w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0"
            style={{ background: 'var(--accent)' }}
          >
            <Plus size={18} strokeWidth={2.5} />
          </motion.button>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1 pb-4">
          {isLoading ? (
            <div className="flex justify-center py-10 opacity-50">
              <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center animate-in">
              <FileText size={20} style={{ color: 'var(--text-faint)' }} />
              <p className="text-xs font-medium" style={{ color: 'var(--text-faint)' }}>{t.empty}</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {notes.map((note, i) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: Math.min(i, 8) * 0.03 } }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  onClick={() => setActiveNote(note)}
                  className="group p-3.5 rounded-2xl cursor-pointer transition-all relative"
                  style={{
                    background: activeNote?.id === note.id ? 'var(--surface)' : 'transparent',
                    border: activeNote?.id === note.id ? '1px solid var(--border)' : '1px solid transparent',
                    boxShadow: activeNote?.id === note.id ? 'var(--shadow-panel)' : 'none',
                  }}
                >
                  {activeNote?.id === note.id && (
                    <motion.div layoutId="note-indicator" className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full" style={{ background: 'var(--accent)' }} transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                  )}
                  <div className="flex items-start justify-between gap-2 pl-1.5">
                    <p className="text-sm font-medium truncate flex-1" style={{ color: 'var(--text)' }}>
                      {previewText(note.content).slice(0, 40) || t.untitled}
                    </p>
                    <button
                      onClick={(e) => deleteNote(note.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      style={{ color: 'var(--text-faint)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="text-xs mt-1 truncate pl-1.5" style={{ color: 'var(--text-faint)' }}>
                    {previewText(note.content).slice(0, 60) || '\u00A0'}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col rounded-3xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-panel)' }}>
        {activeNote ? (
          <motion.div key={activeNote.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
            <div className="flex items-center justify-between px-6 py-3.5 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
              <label className="flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl cursor-pointer transition-colors" style={{ color: 'var(--text-dim)', background: 'var(--surface-2)' }}>
                {isUploading ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
                {t.insertImg}
                <input type="file" accept="image/*" className="hidden" onChange={uploadImage} disabled={isUploading} />
              </label>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={saveNote}
                disabled={isSaving}
                className="flex items-center gap-2 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                style={{ background: 'var(--accent)' }}
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {t.save}
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6">
              <EditorContent editor={editor} />
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 animate-in">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
              <BookOpen size={22} style={{ color: 'var(--text-faint)' }} />
            </div>
            <p className="text-sm font-medium max-w-[220px] text-center" style={{ color: 'var(--text-faint)' }}>{t.select}</p>
          </div>
        )}
      </div>
    </div>
  )
}
