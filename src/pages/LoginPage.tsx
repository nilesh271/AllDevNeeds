import {
  Card,
  CardBody,
  Input,
  Button,
  Typography,
  Alert,
  CardFooter,
} from "@material-tailwind/react";
import { useState } from "react";
import { useAppDispatch } from "../hooks/redux";
import { useNavigate, useLocation } from 'react-router-dom'
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
    <div>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 relative overflow-hidden">

        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 dark:opacity-10"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1555066931-4365d14bab8c')",
          }}
        />

        {/* Container */}
        <div className="relative w-full max-w-6xl mx-auto flex rounded-2xl overflow-hidden shadow-xl">

          {/* LEFT PANEL */}
          <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-900 to-blue-700 text-white p-10 flex-col justify-between">

            <div>
              <Typography variant="h4" className="font-bold">
                AllDevNeeds
              </Typography>

              <Typography className="mt-6 text-sm opacity-80">
                YOUR PROFESSIONAL DEV HUB
              </Typography>

              <Typography className="mt-4 text-lg font-medium">
                "Code is like humor. When you have to explain it, it's bad."
              </Typography>

              <Typography className="mt-2 text-sm opacity-70">
                – Cory House
              </Typography>
            </div>

            {/* Illustration */}
            <img
              src="/dev-illustration.png" // 👉 replace with your asset
              alt="Developer Illustration"
              className="mt-10 w-full object-contain"
            />
          </div>

          {/* RIGHT PANEL */}
          <div className="w-full md:w-1/2 bg-white dark:bg-gray-800 p-8 flex flex-col justify-center">

            <Card shadow={false} className="bg-transparent">
              <CardBody className="flex flex-col gap-4">

                <div>
                  <Typography
                    variant="small"
                    className="text-gray-500 dark:text-gray-400"
                  >
                    Welcome back
                  </Typography>

                  <Typography
                    variant="h4"
                    className="font-bold text-gray-900 dark:text-white"
                  >
                    Sign In to Your Workspace
                  </Typography>
                </div>

                {/* <CardBody className="p-6">
                  {error && (
                    <Alert color="red" className="mb-4 text-sm py-2">
                      {error}
                    </Alert>
                  )} */}

                  <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  {/* Username */}
                    <Input
                      label="Username"
                      size="lg"
                      className="dark:text-white"
                      value={form.username}
                      onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                      required
                      labelProps={{ className: 'dark:text-gray-400' }}
                      containerProps={{ className: 'dark:text-white' }}
                    />

                    {/* Password */}
                    <Input
                      label="Password"
                      type="password"
                      size="lg"
                      className="dark:text-white"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      required
                      labelProps={{ className: 'dark:text-gray-400' }}
                      containerProps={{ className: 'dark:text-white' }}
                    />
                    
                    <Typography className="-mt-3 text-sm text-red-500 ">
                      {error}
                    </Typography>
                    {/* Sign In */}
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? 'Signing in...' : 'Sign in'}
                    </Button>

                  </form>
                </CardBody>

                {/* Links */}
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Don't have an account?</span>
                  <span className="cursor-pointer hover:underline">
                    Forgot Password?
                  </span>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-2 mt-4">
                  <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
                  <span className="text-xs text-gray-400">OR</span>
                  <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
                </div>

                {/* Social Buttons */}
                <div className="flex gap-6 mt-6">
                  <Button
                    variant="outlined"
                    className="flex items-center justify-center gap-2 dark:text-white dark:border-gray-600"
                    fullWidth
                  >
                    <img
                      src="https://www.svgrepo.com/show/475656/google-color.svg"
                      className="w-5 h-5"
                    />
                    Google
                  </Button>

                  <Button
                    variant="outlined"
                    className="flex items-center justify-center gap-2 dark:text-white dark:border-gray-600"
                    fullWidth
                  >
                    <img
                      src="https://www.svgrepo.com/show/512317/github-142.svg"
                      className="w-5 h-5"
                    />
                    GitHub
                  </Button>
                </div>
              {/* </CardBody> */}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}