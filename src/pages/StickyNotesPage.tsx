import { useState } from 'react'
import { Typography, Button, IconButton, Textarea, Input } from '@material-tailwind/react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { addNote, updateNote, deleteNote, reorderNotes, Note } from '../store/notesSlice'

const COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa', '#a5f3fc']

function NoteCard({ note, index }: { note: Note; index: number }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const dispatch = useAppDispatch()

  const save = () => {
    dispatch(updateNote({ id: note.id, title, content }))
    setEditing(false)
  }

  return (
    <Draggable draggableId={note.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`sticky-note relative group ${snapshot.isDragging ? 'rotate-2 shadow-2xl z-50' : ''}`}
          style={{
            backgroundColor: note.color,
            ...provided.draggableProps.style,
          }}
        >
          {/* Delete button */}
          <IconButton
            size="sm"
            variant="text"
            onClick={() => dispatch(deleteNote(note.id))}
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-500 hover:bg-red-50 w-6 h-6 min-w-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </IconButton>

          {/* Color picker */}
          <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => dispatch(updateNote({ id: note.id, color: c }))}
                className="w-3 h-3 rounded-full border border-white/50 hover:scale-125 transition-transform"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {editing ? (
            <div className="flex flex-col gap-2" onClick={e => e.stopPropagation()}>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="bg-white/50 font-bold text-gray-800 text-sm border-gray-300"
                labelProps={{ className: 'hidden' }}
                containerProps={{ className: 'min-w-0' }}
                label=""
              />
              <Textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={4}
                className="bg-white/50 text-gray-700 text-sm border-gray-300 resize-none"
                labelProps={{ className: 'hidden' }}
                label=""
              />
              <Button size="sm" onClick={save} className="bg-gray-700 text-white text-xs py-1">
                Save
              </Button>
            </div>
          ) : (
            <div onDoubleClick={() => setEditing(true)}>
              <p className="font-bold text-gray-800 text-sm mb-2 pr-6 break-words">{note.title}</p>
              <p className="text-gray-700 text-sm whitespace-pre-wrap break-words">{note.content}</p>
              <p className="text-gray-500 text-xs mt-3 opacity-60">
                {new Date(note.updatedAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}

export default function StickyNotesPage() {
  const dispatch = useAppDispatch()
  const { notes } = useAppSelector(s => s.notes)

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const items = Array.from(notes)
    const [moved] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, moved)
    dispatch(reorderNotes(items))
  }

  return (
    <div className="page-container">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Typography variant="h4" className="text-gray-900 dark:text-white font-bold">
              Sticky Notes
            </Typography>
            <Typography className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              Drag to reorder · Double-click to edit · Hover for options
            </Typography>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
            <Button
              size="sm"
              onClick={() => dispatch(addNote())}
              className="bg-sky-500 hover:bg-sky-600 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Note
            </Button>
          </div>
        </div>

        {/* Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="notes-board" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex flex-wrap gap-4"
              >
                {notes.map((note, index) => (
                  <div key={note.id} className="w-full sm:w-56 md:w-52">
                    <NoteCard note={note} index={index} />
                  </div>
                ))}
                {provided.placeholder}

                {notes.length === 0 && (
                  <div className="w-full text-center py-20">
                    <div className="text-6xl mb-4">📝</div>
                    <Typography className="text-gray-400 dark:text-gray-500 text-lg mb-2">
                      No notes yet
                    </Typography>
                    <Typography className="text-gray-400 dark:text-gray-500 text-sm mb-4">
                      Create your first sticky note to get started
                    </Typography>
                    <Button onClick={() => dispatch(addNote())} className="bg-sky-500">
                      Add your first note
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  )
}
