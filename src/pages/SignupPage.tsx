import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardBody, CardHeader, Typography, Input, Button, Alert } from '@material-tailwind/react'
import { useAppDispatch } from '../hooks/redux'
import { login } from '../store/authSlice'
import { authService } from '../services/authService'

export default function SignupPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 4) { setError('Password must be at least 4 characters'); return }
    setLoading(true)
    try {
      const user = await authService.signup(form)
      dispatch(login(user))
      navigate('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <div className="page-container flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in-up">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-t-xl shadow-none">
            <div className="text-center">
              <div className="text-3xl mb-2">🚀</div>
              <Typography variant="h4" className="text-white font-bold">Create account</Typography>
              <Typography className="text-emerald-100 text-sm mt-1">Join AllDevNeeds today</Typography>
            </div>
          </CardHeader>

          <CardBody className="p-6">
            {error && <Alert color="red" className="mb-4 text-sm py-2">{error}</Alert>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input label="Username" value={form.username} onChange={set('username')} required
                className="dark:text-white" labelProps={{ className: 'dark:text-gray-400' }} />
              <Input type="email" label="Email" value={form.email} onChange={set('email')} required
                className="dark:text-white" labelProps={{ className: 'dark:text-gray-400' }} />
              <Input type="password" label="Password" value={form.password} onChange={set('password')} required
                className="dark:text-white" labelProps={{ className: 'dark:text-gray-400' }} />
              <Input type="password" label="Confirm Password" value={form.confirm} onChange={set('confirm')} required
                className="dark:text-white" labelProps={{ className: 'dark:text-gray-400' }} />
              <Button type="submit" fullWidth disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 mt-2">
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <Typography className="text-center text-gray-500 dark:text-gray-400 text-sm mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-sky-500 hover:text-sky-600 font-medium">Sign in</Link>
            </Typography>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
