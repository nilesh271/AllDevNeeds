import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Card, CardBody, CardHeader, Typography, Input, Button, Alert,
} from '@material-tailwind/react'
import { useAppDispatch } from '../hooks/redux'
import { login } from '../store/authSlice'
import { authService } from '../services/authService'


export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await authService.login(form)
      dispatch(login(user))
      navigate(from, { replace: true })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in-up">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
          {/* <CardHeader className="bg-gradient-to-r from-blue-400 to-blue-600 text-white p-8 rounded-t-xl shadow-none"> */}
            <div className="text-center">
              {/* <div className="text-3xl mb-2">⌨️</div> */}
              <Typography variant="h4" className="text-black font-bold">
                Welcome back
              </Typography>
              <Typography className="text-sky-100 text-black text-sm mt-1">
                Sign in to AllDevNeeds
              </Typography>
            </div>
          {/* </CardHeader> */}

          <CardBody className="p-6">
            {error && (
              <Alert color="red" className="mb-4 text-sm py-2">
                {error}
              </Alert>
            )}

            {/* <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
              <p className="text-amber-700 dark:text-amber-300 text-xs font-medium">Demo credentials:</p>
              <p className="text-amber-600 dark:text-amber-400 text-xs font-mono mt-0.5">
                admin / admin &nbsp;|&nbsp; user / user123
              </p>
            </div> */}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <Input
                label="Username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
                className="dark:text-white"
                labelProps={{ className: 'dark:text-gray-400' }}
                containerProps={{ className: 'dark:text-white' }}
              />
              <Input
                type="password"
                label="Password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                className="dark:text-white"
                labelProps={{ className: 'dark:text-gray-400' }}
                containerProps={{ className: 'dark:text-white' }}
              />
              <Button
                type="submit"
                fullWidth
                disabled={loading}
                className="bg-blue-gray-500 hover:bg-sky-600 mt-2 "
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <Typography className="text-center text-gray-500 dark:text-gray-400 text-sm mt-4">
              Don't have an account?{' '}
              
            </Typography>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
