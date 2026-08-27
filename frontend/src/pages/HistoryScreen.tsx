import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { flowApi } from '../api/flowApi'
import type { FlowHistoryEntry } from '../types'
import { Navbar } from '../components/Navbar'
import { History, Shield, CheckCircle2, RefreshCw, ArrowLeft, MessageSquare } from 'lucide-react'

export const HistoryScreen: React.FC = () => {
  const [history, setHistory] = useState<FlowHistoryEntry[]>([])
  const [loading, setLoading] = useState<boolean>(true)
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
    fetchHistory()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/flow"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Active Flow</span>
          </Link>

          <button
            onClick={fetchHistory}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>

        {/* Title Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Full Conversation Ledger</h1>
              <p className="text-xs text-slate-400">
                Immutable record from <code className="text-indigo-400">FlowHistory</code> database table
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-teal-400">{history.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Total Logs</div>
          </div>
        </div>

        {/* Timeline Container */}
        <div className="space-y-4">
          {loading && history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="text-xs">Loading immutable timeline...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 space-y-2">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-600 opacity-50" />
              <p className="text-sm font-medium">No history logged yet</p>
              <p className="text-xs text-slate-500">
                Answer questions in the flow to populate your history.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
              {history.map((entry, index) => {
                const date = new Date(entry.createdAt)
                const formatted = date.toLocaleString()

                return (
                  <div key={entry.id || index} className="relative group">
                    {/* Timeline Dot */}
                    <div className="absolute -left-6 top-2 w-5 h-5 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                    </div>

                    {/* Entry Card */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-700 transition-colors shadow-sm">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-mono text-slate-500">{formatted}</span>
                        {entry.question.isCheckpoint && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-semibold">
                            <Shield className="w-3 h-3" /> Checkpoint Gate
                          </span>
                        )}
                      </div>

                      {/* Question */}
                      <div className="text-sm font-semibold text-white leading-relaxed">
                        {entry.question.text}
                      </div>

                      {/* Answer */}
                      <div className="flex items-center gap-2 text-xs text-teal-300 bg-teal-950/40 border border-teal-800/40 px-3 py-2 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                        <span className="font-medium">Selected: {entry.option.text}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
