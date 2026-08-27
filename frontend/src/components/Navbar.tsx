import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { History, LogOut, MessageSquareHeart, Layers } from 'lucide-react'

interface NavbarProps {
  onOpenHistory?: () => void
  onOpenModules?: () => void
  activeModuleName?: string
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenHistory,
  onOpenModules,
  activeModuleName,
}) => {
  const { userEmail, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/flow" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-teal-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <MessageSquareHeart className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              <span>Wysa Flow</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v1.0
              </span>
            </div>
            <div className="text-xs text-slate-400">Mental Health Conversation Engine</div>
          </div>
        </Link>

        {/* Right Actions */}
        {isAuthenticated && (
          <div className="flex items-center gap-2 md:gap-3">
            {/* Active Module Indicator & Switcher */}
            {onOpenModules && (
              <button
                onClick={onOpenModules}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                title="Switch Module"
              >
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                <span className="max-w-[140px] truncate">
                  {activeModuleName || 'Select Module'}
                </span>
              </button>
            )}

            {/* History Toggle */}
            {onOpenHistory && (
              <button
                onClick={onOpenHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 hover:text-white hover:border-indigo-500/50 hover:bg-slate-850 transition-all shadow-sm"
              >
                <History className="w-4 h-4 text-indigo-400" />
                <span className="hidden md:inline">History</span>
              </button>
            )}

            {/* User Chip */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-medium text-slate-200 max-w-[150px] truncate">
                  {userEmail}
                </span>
                <span className="text-[10px] text-teal-400 font-mono">Active Session</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                title="Sign out (simulate new user)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
