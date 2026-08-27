import React, { useEffect, useState } from 'react'
import { flowApi } from '../api/flowApi'
import type { FlowHistoryEntry } from '../types'
import { X, RefreshCw, History, Shield, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react'

interface HistoryDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState<FlowHistoryEntry[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await flowApi.getHistory()
      setHistory(data.history)
    } catch (err: any) {
      setError(err.formattedMessage || 'Failed to load conversation history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchHistory()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="font-semibold text-white text-base">Conversation Ledger</h3>
                <p className="text-xs text-slate-400">Immutable FlowHistory record</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={fetchHistory}
                disabled={loading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                title="Refresh history"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading && history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                <span className="text-xs">Loading ledger...</span>
              </div>
            ) : error ? (
              <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <MessageSquare className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
                <p className="text-sm font-medium">No history recorded yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Start answering questions to build your immutable timeline.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {history.map((entry, index) => {
                  const date = new Date(entry.createdAt)
                  const timeFormatted = date.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })

                  return (
                    <div key={entry.id || index} className="relative group">
                      {/* Timeline Dot */}
                      <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      </div>

                      {/* Content Card */}
                      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2 hover:border-slate-700 transition-colors">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-mono text-slate-500">{timeFormatted}</span>
                          {entry.question.isCheckpoint && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium">
                              <Shield className="w-3 h-3" /> Checkpoint
                            </span>
                          )}
                        </div>

                        {/* Question */}
                        <div className="text-xs font-medium text-slate-200 leading-snug">
                          {entry.question.text}
                        </div>

                        {/* Answer Selected */}
                        <div className="flex items-center gap-1.5 text-xs text-teal-300 bg-teal-950/40 border border-teal-800/40 px-2.5 py-1.5 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span className="font-medium">{entry.option.text}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer stats */}
          <div className="p-3 border-t border-slate-800 bg-slate-950 text-center text-xs text-slate-400">
            Total Ledger Entries: <span className="text-white font-mono">{history.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
