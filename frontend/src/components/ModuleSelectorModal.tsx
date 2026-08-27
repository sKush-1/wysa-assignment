import React, { useEffect, useState } from 'react'
import { flowApi } from '../api/flowApi'
import type { Module } from '../types'
import { X, Layers, ArrowRight, RefreshCw, CheckCircle2, Lock } from 'lucide-react'

interface ModuleSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectModule: (moduleId: string) => void
  currentModuleId?: string
}

export const ModuleSelectorModal: React.FC<ModuleSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectModule,
  currentModuleId,
}) => {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      const load = async () => {
        try {
          setLoading(true)
          setError(null)
          const data = await flowApi.getModules()
          setModules(data.modules)
        } catch (err: any) {
          setError(err.formattedMessage || 'Failed to load modules')
        } finally {
          setLoading(false)
        }
      }
      load()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Select Conversation Module</h3>
              <p className="text-xs text-slate-400">Choose an unvisited flow track to explore</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="text-xs">Loading available modules...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          ) : (
            modules.map((m) => {
              const isCurrent = m.id === currentModuleId
              const isVisited = m.visited && !isCurrent

              return (
                <div
                  key={m.id}
                  onClick={() => {
                    if (isVisited) return
                    onSelectModule(m.id)
                    onClose()
                  }}
                  className={`group p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                    isCurrent
                      ? 'bg-indigo-950/30 border-indigo-500/50 hover:border-indigo-400 shadow-sm cursor-pointer'
                      : isVisited
                      ? 'bg-slate-950/30 border-slate-900 opacity-60 cursor-not-allowed'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-950 cursor-pointer'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-sm ${isVisited ? 'text-slate-500' : 'text-white group-hover:text-indigo-300'} transition-colors`}>
                        {m.name}
                      </span>
                      {isCurrent ? (
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-teal-400 bg-teal-950/50 border border-teal-800 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : isVisited ? (
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 bg-slate-850 border border-slate-800 px-2 py-0.5 rounded-md">
                          <Lock className="w-3 h-3 text-slate-500" /> Completed
                        </span>
                      ) : null}
                    </div>
                    {m.description && (
                      <p className="text-xs text-slate-400 leading-relaxed">{m.description}</p>
                    )}
                  </div>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                      isVisited
                        ? 'bg-slate-900 text-slate-600'
                        : 'bg-slate-800 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white'
                    }`}
                  >
                    {isVisited ? <Lock className="w-3.5 h-3.5" /> : <ArrowRight className="w-4 h-4" />}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
