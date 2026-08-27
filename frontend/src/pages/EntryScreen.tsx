import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MessageSquareHeart, ArrowRight, UserCheck, Sparkles, ShieldCheck } from 'lucide-react'

export const EntryScreen: React.FC = () => {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/flow'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Please enter a valid email address.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      // Save simulated auth header in localStorage & context
      login(trimmed)
      navigate('/flow')
    } catch (err: any) {
      setError(err.formattedMessage || 'Failed to start session. Please try again.')
      setLoading(false)
    }
  }

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* App Logo */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-teal-400 mx-auto flex items-center justify-center shadow-xl shadow-indigo-500/20">
            <MessageSquareHeart className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Wysa Flow Engine</h1>
            <p className="text-sm text-slate-400 mt-1">
              Modular Conversation Flow & Safety Triage System
            </p>
          </div>
        </div>

        {/* Card Form */}
        <div className="mt-8 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                User Email (Simulated Auth)
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="e.g. user@wysa.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Identifies your session & attaches the <code className="text-indigo-400">x-user-email</code> header.
              </p>
            </div>

            {/* Quick Demo Accounts */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-400" /> Quick Demo Profiles:
              </span>
              <div className="flex flex-wrap gap-2">
                {['alex@wysa.com', 'sarah@wysa.com', 'test@user.io'].map((demo) => (
                  <button
                    key={demo}
                    type="button"
                    onClick={() => handleQuickLogin(demo)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
                  >
                    {demo}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Initializing Flow...</span>
                </>
              ) : (
                <>
                  <span>Enter Conversation Flow</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Feature Pill Highlights */}
        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> Checkpoint Gates
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" /> State Isolation
          </span>
        </div>
      </div>
    </div>
  )
}

