import supabase from './supabase'
import { Note } from '../store/notesSlice'

export interface DbNote {
  id: string
  user_id?: string
  title: string
  content: string
  color: string
  pinned: boolean
  created_at?: string
  updated_at?: string
}

export const notesService = {
  async fetchNotes(): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) throw error

    return (data || []).map((row: DbNote) => ({
      id: row.id,
      title: row.title || '',
      content: row.content || '',
      color: row.color || '#fef08a',
      pinned: !!row.pinned,
      updatedAt: row.updated_at || new Date().toISOString()
    }))
  },

  async createNote(note: Partial<Note>): Promise<Note> {
    const payload = {
      title: note.title || 'New Note',
      content: note.content || 'Double click to edit content',
      color: note.color || '#fef08a',
      pinned: !!note.pinned
    }

    const { data, error } = await supabase
      .from('notes')
      .insert([payload])
      .select('*')
      .single()

    if (error) throw error

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      color: data.color,
      pinned: data.pinned,
      updatedAt: data.updated_at || new Date().toISOString()
    }
  },

  async updateNote(id: string, updates: Partial<Note>): Promise<Note | null> {
    const dbPayload: Partial<DbNote> = {}
    if (updates.title !== undefined) dbPayload.title = updates.title
    if (updates.content !== undefined) dbPayload.content = updates.content
    if (updates.color !== undefined) dbPayload.color = updates.color
    if (updates.pinned !== undefined) dbPayload.pinned = updates.pinned
    dbPayload.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('notes')
      .update(dbPayload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      color: data.color,
      pinned: data.pinned,
      updatedAt: data.updated_at || new Date().toISOString()
    }
  },

  async deleteNote(id: string): Promise<void> {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
