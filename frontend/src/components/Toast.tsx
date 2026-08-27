import React from 'react'
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'

export interface ToastProps {
  type?: 'info' | 'success' | 'error' | 'warning'
  message: string
  onClose?: () => void
}

export const Toast: React.FC<ToastProps> = ({ type = 'info', message, onClose }) => {
  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-emerald-950/50'
      case 'error':
        return 'bg-rose-950/90 border-rose-500/50 text-rose-200 shadow-rose-950/50'
      case 'warning':
        return 'bg-amber-950/90 border-amber-500/50 text-amber-200 shadow-amber-950/50'
      case 'info':
      default:
        return 'bg-indigo-950/90 border-indigo-500/50 text-indigo-200 shadow-indigo-950/50'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
      case 'warning':
      case 'info':
      default:
        return <Info className="w-5 h-5 text-indigo-400 shrink-0" />
    }
  }

  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-xl max-w-md animate-in slide-in-from-top-3 duration-300 ${getStyles()}`}
    >
      {getIcon()}
      <div className="flex-1 text-sm leading-relaxed">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-0.5 rounded-lg hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
