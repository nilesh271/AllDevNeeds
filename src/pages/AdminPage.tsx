import { useState } from 'react'
import {
  Typography, Button, Card, CardBody, Input, Textarea, Select, Option,
  Tabs, TabsHeader, Tab, TabsBody, TabPanel,
  Dialog, DialogHeader, DialogBody, DialogFooter,
  IconButton, Alert, Chip,
} from '@material-tailwind/react'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { addItem, updateItem, deleteItem, LearningItem } from '../store/learningSlice'
import { addFiles, deleteFile } from '../store/filesSlice'

const CATEGORIES = ['React', 'TypeScript', 'Redux', 'CSS', 'Tools', 'JavaScript', 'Node', 'Other']

// function LearningManager() {
//   const dispatch = useAppDispatch()
//   const { items } = useAppSelector(s => s.learning)
//   const [editItem, setEditItem] = useState<LearningItem | null>(null)
//   const [showAdd, setShowAdd] = useState(false)
//   const [form, setForm] = useState({ title: '', url: '', description: '', category: 'React', thumbnail: '' })
//   const [success, setSuccess] = useState('')

//   const resetForm = () => setForm({ title: '', url: '', description: '', category: 'React', thumbnail: '' })

//   const handleAdd = () => {
//     if (!form.title || !form.url) return
//     dispatch(addItem(form))
//     resetForm()
//     setShowAdd(false)
//     setSuccess('Resource added!')
//     setTimeout(() => setSuccess(''), 3000)
//   }

//   const handleEdit = (item: LearningItem) => {
//     setEditItem(item)
//     setForm({ title: item.title, url: item.url, description: item.description, category: item.category, thumbnail: item.thumbnail || '' })
//   }

//   const handleUpdate = () => {
//     if (!editItem) return
//     dispatch(updateItem({ ...editItem, ...form }))
//     setEditItem(null)
//     resetForm()
//     setSuccess('Resource updated!')
//     setTimeout(() => setSuccess(''), 3000)
//   }

//   const handleDelete = (id: string) => {
//     if (confirm('Delete this resource?')) dispatch(deleteItem(id))
//   }

//   const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
//     setForm(f => ({ ...f, [k]: e.target.value }))

//   const FormBody = () => (
//     <div className="space-y-3">
//       <Input label="Title *" value={form.title} onChange={setF('title')}
//         className="dark:text-white" labelProps={{ className: 'dark:text-gray-400' }} />
//       <Input label="URL *" value={form.url} onChange={setF('url')}
//         className="dark:text-white" labelProps={{ className: 'dark:text-gray-400' }} />
//       <Textarea label="Description" value={form.description} onChange={setF('description')}
//         className="dark:text-white" labelProps={{ className: 'dark:text-gray-400' }} />
//       <Select label="Category" value={form.category}
//         onChange={v => setForm(f => ({ ...f, category: v || 'React' }))}
//         className="dark:text-white" labelProps={{ className: 'dark:text-gray-400' }}>
//         {CATEGORIES.map(c => <Option key={c} value={c}>{c}</Option>)}
//       </Select>
//       <Input label="Thumbnail URL (optional)" value={form.thumbnail} onChange={setF('thumbnail')}
//         className="dark:text-white" labelProps={{ className: 'dark:text-gray-400' }} />
//     </div>
//   )

//   return (
//     <div>
//       {success && <Alert color="green" className="mb-4">{success}</Alert>}

//       <div className="flex justify-between items-center mb-4">
//         <Typography className="text-gray-600 dark:text-gray-300 text-sm">{items.length} resources</Typography>
//         <Button size="sm" onClick={() => { resetForm(); setShowAdd(true) }} className="bg-sky-500">
//           + Add Resource
//         </Button>
//       </div>

//       <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
//         {items.map(item => (
//           <div key={item.id}
//             className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
//             {item.thumbnail && (
//               <img src={item.thumbnail} alt="" className="w-14 h-9 object-cover rounded shrink-0"
//                 onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
//             )}
//             <div className="flex-1 min-w-0">
//               <p className="text-gray-900 dark:text-white text-sm font-medium truncate">{item.title}</p>
//               <p className="text-gray-400 text-xs truncate">{item.url}</p>
//             </div>
//             <Chip value={item.category} size="sm" className="bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 shrink-0" />
//             <div className="flex gap-1 shrink-0">
//               <IconButton size="sm" variant="text" onClick={() => handleEdit(item)}
//                 className="text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20">
//                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
//                 </svg>
//               </IconButton>
//               <IconButton size="sm" variant="text" onClick={() => handleDelete(item.id)}
//                 className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
//                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                 </svg>
//               </IconButton>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Add Dialog */}
//       <Dialog open={showAdd} handler={setShowAdd} className="dark:bg-gray-800 max-w-md">
//         <DialogHeader className="dark:text-white">Add Learning Resource</DialogHeader>
//         <DialogBody><FormBody /></DialogBody>
//         <DialogFooter className="gap-2">
//           <Button variant="outlined" onClick={() => setShowAdd(false)} className="dark:border-gray-600 dark:text-gray-300">Cancel</Button>
//           <Button onClick={handleAdd} className="bg-sky-500">Add</Button>
//         </DialogFooter>
//       </Dialog>

//       {/* Edit Dialog */}
//       <Dialog open={!!editItem} handler={() => setEditItem(null)} className="dark:bg-gray-800 max-w-md">
//         <DialogHeader className="dark:text-white">Edit Resource</DialogHeader>
//         <DialogBody><FormBody /></DialogBody>
//         <DialogFooter className="gap-2">
//           <Button variant="outlined" onClick={() => setEditItem(null)} className="dark:border-gray-600 dark:text-gray-300">Cancel</Button>
//           <Button onClick={handleUpdate} className="bg-sky-500">Update</Button>
//         </DialogFooter>
//       </Dialog>
//     </div>
//   )
// }

// function FilesManager() {
//   const dispatch = useAppDispatch()
//   const { files } = useAppSelector(s => s.files)
//   const fileRef = useState<HTMLInputElement | null>(null)

//   return (
//     <div>
//       <div className="flex justify-between items-center mb-4">
//         <Typography className="text-gray-600 dark:text-gray-300 text-sm">{files.length} files</Typography>
//         <Button size="sm" className="bg-sky-500" onClick={() => {
//           const input = document.createElement('input')
//           input.type = 'file'
//           input.multiple = true
//           input.onchange = e => {
//             const f = (e.target as HTMLInputElement).files
//             if (!f) return
//             const records = Array.from(f).map(file => ({
//               id: Date.now().toString() + Math.random(),
//               name: file.name,
//               size: file.size,
//               type: file.type,
//               storage: 'supabase' as const,
//               timestamp: new Date().toISOString(),
//             }))
//             dispatch(addFiles(records))
//           }
//           input.click()
//         }}>
//           + Upload Files
//         </Button>
//       </div>

//       <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
//         {files.map(file => (
//           <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
//             <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/30 rounded flex items-center justify-center text-xs font-bold text-sky-600 shrink-0">
//               {file.name.split('.').pop()?.toUpperCase().slice(0, 3)}
//             </div>
//             <div className="flex-1 min-w-0">
//               <p className="text-gray-900 dark:text-white text-sm truncate">{file.name}</p>
//               <p className="text-gray-400 text-xs">{new Date(file.timestamp).toLocaleString()}</p>
//             </div>
//             <IconButton size="sm" variant="text" onClick={() => dispatch(deleteFile(file.id))}
//               className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0">
//               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//               </svg>
//             </IconButton>
//           </div>
//         ))}
//         {files.length === 0 && (
//           <div className="text-center py-8 text-gray-400 dark:text-gray-500">No files yet</div>
//         )}
//       </div>
//     </div>
//   )
// }

export default function AdminPage() {
  const { user } = useAppSelector(s => s.auth)

  return (
    <div className="page-container">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
          </div>
          <div>
            <Typography variant="h4" className="text-gray-900 dark:text-white font-bold">Admin Panel</Typography>
            <Typography className="text-gray-400 text-sm">Logged in as <span className="text-sky-500 font-medium">{user?.username}</span></Typography>
          </div>
        </div>

        <Tabs value="learning">
          <TabsHeader className="bg-gray-100 dark:bg-gray-800">
            {['learning', 'files', 'video', 'datetime'].map(tab => (
              <Tab key={tab} value={tab} className="dark:text-gray-400 capitalize">
                {tab === 'datetime' ? 'DateTime' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Tab>
            ))}
          </TabsHeader>

          <TabsBody>
            <TabPanel value="learning">
              <Card className="glass-card rounded-xl mt-4">
                <CardBody className="p-5">
                  <Typography variant="h6" className="text-gray-900 dark:text-white font-semibold mb-4">
                    🎓 Learning Resources (CRUD)
                  </Typography>
                  {/* <LearningManager /> */}
                </CardBody>
              </Card>
            </TabPanel>

            <TabPanel value="files">
              <Card className="glass-card rounded-xl mt-4">
                <CardBody className="p-5">
                  <Typography variant="h6" className="text-gray-900 dark:text-white font-semibold mb-4">
                    📁 File Manager
                  </Typography>
                  {/* <FilesManager /> */}
                </CardBody>
              </Card>
            </TabPanel>

            <TabPanel value="video">
              <Card className="glass-card rounded-xl mt-4">
                <CardBody className="p-5">
                  <Typography variant="h6" className="text-gray-900 dark:text-white font-semibold mb-4">
                    🎥 Video Downloader Settings
                  </Typography>
                  <div className="space-y-4">
                    {[
                      { label: 'Default Quality', value: '1080p HD', editable: true },
                      { label: 'Default Format', value: 'MP4', editable: true },
                      { label: 'Max Concurrent Downloads', value: '3', editable: true },
                      { label: 'Output Directory', value: '/downloads', editable: true },
                    ].map(setting => (
                      <div key={setting.label} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-300 text-sm">{setting.label}</span>
                        <code className="text-sky-500 text-sm font-mono">{setting.value}</code>
                      </div>
                    ))}
                  </div>
                  <Alert className="mt-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300">
                    Video downloader is in mock mode. No actual downloads occur.
                  </Alert>
                </CardBody>
              </Card>
            </TabPanel>

            <TabPanel value="datetime">
              <Card className="glass-card rounded-xl mt-4">
                <CardBody className="p-5">
                  <Typography variant="h6" className="text-gray-900 dark:text-white font-semibold mb-4">
                    🕐 DateTime Converter Settings
                  </Typography>
                  <div className="space-y-4">
                    {[
                      { label: 'Default Timezone', value: 'UTC' },
                      { label: 'Date Display Format', value: 'ISO 8601' },
                      { label: 'Clock Format', value: '24-hour' },
                      { label: 'Week Starts On', value: 'Monday' },
                    ].map(setting => (
                      <div key={setting.label} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-300 text-sm">{setting.label}</span>
                        <Chip value={setting.value} size="sm" className="bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400" />
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </TabPanel>
          </TabsBody>
        </Tabs>
      </div>
    </div>
  )
}
