'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await signIn('credentials', {
      redirect: false,
      username,
      password
    })
    setLoading(false)
    if (res?.ok) router.push('/profile')
    else alert('Invalid credentials')
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 bg-white dark:bg-gray-800 border border-warm-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-charcoal-500 dark:text-white">Sign In</h1>
        <div>
          <label className="block text-sm mb-1 text-warm-700 dark:text-gray-300">Username</label>
          <input className="w-full border border-warm-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1 text-warm-700 dark:text-gray-300">Password</label>
          <input type="password" className="w-full border border-warm-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-2 rounded transition-all disabled:opacity-50">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
