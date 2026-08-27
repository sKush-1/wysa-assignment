import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { flowApi } from '../api/flowApi'
import type { Question, FlowState, Module } from '../types'
import { Navbar } from '../components/Navbar'
import { Toast } from '../components/Toast'
import type { ToastProps } from '../components/Toast'
import { HistoryDrawer } from '../components/HistoryDrawer'
import { FlowCompleteCard } from '../components/FlowCompleteCard'
import { ModuleSelectorModal } from '../components/ModuleSelectorModal'
import {
  ArrowLeft,
  Shield,
  Layers,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Footprints,
  Compass,
} from 'lucide-react'

export const FlowScreen: React.FC = () => {
  const { questionId: routeQuestionId } = useParams<{ questionId?: string }>()
  const navigate = useNavigate()
  const { logout } = useAuth()

  // ── State ───────────────────────────────────────────────────────────────────
  const [question, setQuestion] = useState<Question | null>(null)
  const [state, setState] = useState<FlowState | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [completed, setCompleted] = useState<boolean>(false)
  const [completionMessage, setCompletionMessage] = useState<string>('')

  // Loading & In-flight Locks (Defensive UI: prevents race conditions & double-clicks)
  const [loading, setLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isGoingBack, setIsGoingBack] = useState<boolean>(false)

  // Drawers & Modals
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false)
  const [isModuleModalOpen, setIsModuleModalOpen] = useState<boolean>(false)

  // Toast notification state
  const [toast, setToast] = useState<ToastProps | null>(null)

  const showToast = (message: string, type: ToastProps['type'] = 'info') => {
    setToast({ message, type, onClose: () => setToast(null) })
  }

  // ── Load available modules for headers/indicators ───────────────────────────
  useEffect(() => {
    flowApi.getModules().then((res) => setModules(res.modules)).catch(() => {})
  }, [])

  // ── 1. Fetch Current State (Standard Entry) ──────────────────────────────────
  const fetchCurrentFlow = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setLoading(true)
      const data = await flowApi.getCurrent()
      setQuestion(data.question)
      setState(data.state)
      setCompleted(false)
    } catch (err: any) {
      if (err.status === 404) {
        // No active flow session -> Start default Initial Assessment module
        const modRes = await flowApi.getModules().catch(() => ({ modules: [] }))
        if (modRes.modules.length > 0) {
          const initial = modRes.modules.find((m) => m.name.toLowerCase().includes('initial')) || modRes.modules[0]
          const startRes = await flowApi.startFlow(initial.id)
          setQuestion(startRes.question)
          const curr = await flowApi.getCurrent().catch(() => null)
          if (curr) {
            setState(curr.state)
          }
          setCompleted(false)
        } else {
          showToast('No active conversation flow found.', 'warning')
        }
      } else {
        showToast(err.formattedMessage || 'Error loading active flow session.', 'error')
      }
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [])

  // ── 2. Deep-Link Handler (Resolves /flow/:questionId) ────────────────────────
  const resolveDeepLink = useCallback(async (targetQuestionId: string) => {
    try {
      setLoading(true)
      const data = await flowApi.getQuestionById(targetQuestionId)

      if (data.redirected) {
        // Stale link: Backend defensively returned the user's actual active position
        showToast(
          data.message || 'Resuming at your current active step in the flow.',
          'info',
        )
        // Clean up URL route back to main flow view
        navigate('/flow', { replace: true })
      }

      setQuestion(data.question)
      setCompleted(false)

      // Sync active state in background
      flowApi.getCurrent().then((cur) => setState(cur.state)).catch(() => {})
    } catch (err: any) {
      showToast(err.formattedMessage || 'Unable to resolve deep link. Syncing with active state.', 'error')
      fetchCurrentFlow()
    } finally {
      setLoading(false)
    }
  }, [fetchCurrentFlow, navigate])

  // Router sync on mount or param change
  useEffect(() => {
    if (routeQuestionId) {
      resolveDeepLink(routeQuestionId)
    } else {
      fetchCurrentFlow()
    }
  }, [routeQuestionId, resolveDeepLink, fetchCurrentFlow])

  // ── 3. Submit Answer (Engine) ────────────────────────────────────────────────
  const handleSelectOption = async (optionId: string) => {
    if (!question || isSubmitting) return

    try {
      setIsSubmitting(true)
      const res = await flowApi.submitAnswer(question.id, optionId)

      if (res.completed) {
        setCompleted(true)
        setCompletionMessage(res.message || 'You have reached the end of this conversation flow.')
        setQuestion(null)
        // Refresh module completion status
        flowApi.getModules().then((modRes) => setModules(modRes.modules)).catch(() => {})
      } else if (res.question) {
        setQuestion(res.question)
        // Fetch updated state for breadcrumbs & module indicator
        const cur = await flowApi.getCurrent()
        setState(cur.state)

        if (res.moduleSwitched) {
          showToast('Transitioned into a new module based on your response.', 'info')
        }
      }
    } catch (err: any) {
      // Defensive UI handling:
      // If 409 (State mismatch) or 400 (Invalid option), notify user and auto-resync
      if (err.status === 409 || err.status === 400) {
        showToast(
          `${err.formattedMessage} Resynchronizing with active server state...`,
          'warning',
        )
        await fetchCurrentFlow(true)
      } else {
        showToast(err.formattedMessage || 'Failed to submit answer.', 'error')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── 4. Go Back Functionality (Bonus) ─────────────────────────────────────────
  const handleGoBack = async () => {
    if (isGoingBack || !canGoBack) return

    try {
      setIsGoingBack(true)
      const res = await flowApi.goBack()
      setQuestion(res.question)
      // Sync state for updated breadcrumb trail
      const cur = await flowApi.getCurrent()
      setState(cur.state)
    } catch (err: any) {
      showToast(err.formattedMessage || 'Cannot go back further in this context.', 'warning')
    } finally {
      setIsGoingBack(false)
    }
  }

  // ── 5. Start / Restart a Module ──────────────────────────────────────────────
  const handleStartModule = async (moduleId: string) => {
    try {
      setLoading(true)
      const res = await flowApi.startFlow(moduleId)
      setQuestion(res.question)
      setCompleted(false)
      const cur = await flowApi.getCurrent()
      setState(cur.state)
      showToast(`Started module: ${res.module.name}`, 'success')
      navigate('/flow', { replace: true })
    } catch (err: any) {
      showToast(err.formattedMessage || 'Failed to start module.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Compute Active Module metadata & Completion status
  const currentModule = modules.find((m) => m.id === state?.currentModuleId)
  const unvisitedModules = modules.filter((m) => !m.visited)
  const allModulesCompleted = modules.length > 0 && unvisitedModules.length === 0
  const breadcrumbCount = state?.breadcrumbTrail?.length || 0
  const canGoBack = breadcrumbCount > 0 && !loading && !isSubmitting && !isGoingBack

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Toast Notification */}
      {toast && <Toast {...toast} />}

      {/* Navigation Header */}
      <Navbar
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenModules={() => setIsModuleModalOpen(true)}
        activeModuleName={currentModule?.name}
      />

      {/* Main Flow Stage */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col justify-center items-center">
        {loading ? (
          /* Loading State */
          <div className="flex flex-col items-center justify-center space-y-4 py-20 text-slate-400 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <p className="text-sm font-medium">Syncing conversation state...</p>
          </div>
        ) : completed ? (
          /* Flow Complete Screen */
          <FlowCompleteCard
            message={completionMessage}
            allModulesCompleted={allModulesCompleted}
            unvisitedCount={unvisitedModules.length}
            onOpenModules={() => setIsModuleModalOpen(true)}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onSwitchUser={() => {
              logout()
              navigate('/login')
            }}
          />
        ) : question ? (
          /* Active Question Flow Card */
          <div className="w-full max-w-2xl space-y-6">
            {/* Context & Progress Header Bar */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              {/* Back Button */}
              <button
                onClick={handleGoBack}
                disabled={!canGoBack}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                  canGoBack
                    ? 'bg-slate-900 border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 hover:bg-slate-850 cursor-pointer shadow-sm'
                    : 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed opacity-60'
                }`}
                title={
                  breadcrumbCount === 0
                    ? 'At beginning of current flow/checkpoint'
                    : 'Step back to previous question'
                }
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isGoingBack ? 'Reverting...' : 'Go Back'}</span>
                {breadcrumbCount > 0 && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {breadcrumbCount}
                  </span>
                )}
              </button>

              {/* Status Pills */}
              <div className="flex items-center gap-2">
                {question.isCheckpoint && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold tracking-wide">
                    <Shield className="w-3 h-3 text-amber-400" />
                    <span>Safety Checkpoint</span>
                  </span>
                )}

                {currentModule && (
                  <button
                    onClick={() => setIsModuleModalOpen(true)}
                    className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-medium transition-colors"
                  >
                    <Layers className="w-3 h-3 text-teal-400" />
                    <span className="max-w-[120px] truncate">{currentModule.name}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Conversational Question Bubble */}
            <div className="bg-gradient-to-b from-slate-900/90 to-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6 relative overflow-hidden">
              {/* Background Accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

              {/* Question Header */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-indigo-400 flex items-center gap-1.5">
                    <span>Wysa Bot Prompt</span>
                    {question.isCheckpoint && (
                      <span className="text-[10px] text-amber-400 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.2 rounded">
                        Permanent gate
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-white leading-relaxed tracking-tight">
                    {question.text}
                  </h2>
                </div>
              </div>

              {/* Options Grid */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
                  <span>Select an option:</span>
                  {isSubmitting && (
                    <span className="text-indigo-400 flex items-center gap-1 text-[11px]">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Processing...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {question.options.map((option, idx) => (
                    <button
                      key={option.id}
                      onClick={() => handleSelectOption(option.id)}
                      disabled={isSubmitting || isGoingBack}
                      className="group w-full text-left p-4 rounded-2xl bg-slate-950/70 hover:bg-indigo-950/40 border border-slate-800/90 hover:border-indigo-500/60 transition-all duration-150 flex items-center justify-between gap-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:shadow-indigo-500/5 active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-indigo-500/40 text-slate-400 group-hover:text-indigo-300 text-xs font-mono flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-sm sm:text-base font-medium text-slate-200 group-hover:text-white transition-colors">
                          {option.text}
                        </span>
                      </div>

                      {/* Direction Icon or End Indicator */}
                      <div className="text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0 text-xs font-mono">
                        {option.nextQuestionId ? '➔' : '🏁 End'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Helpers & Deep-Link Copy */}
            <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 px-2 gap-2">
              <div className="flex items-center gap-1.5">
                <Footprints className="w-3.5 h-3.5 text-slate-400" />
                <span>Trail Depth: {breadcrumbCount} steps</span>
              </div>

              {/* Deep Link URL copy Helper */}
              <button
                onClick={() => {
                  const url = `${window.location.origin}/flow/${question.id}`
                  navigator.clipboard.writeText(url)
                  showToast('Deep-link URL copied to clipboard!', 'success')
                }}
                className="hover:text-slate-300 transition-colors inline-flex items-center gap-1"
                title="Copy direct deep-link to test defensive routing"
              >
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>Copy Deep-Link URL</span>
              </button>
            </div>
          </div>
        ) : (
          /* Fallback No Active Session */
          <div className="text-center space-y-4 py-16">
            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-semibold text-white">No active question</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Please choose a module to begin the conversation flow.
            </p>
            <button
              onClick={() => setIsModuleModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition-colors"
            >
              Choose Module
            </button>
          </div>
        )}
      </main>

      {/* Side-Drawer Conversation History */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      {/* Module Switcher Modal */}
      <ModuleSelectorModal
        isOpen={isModuleModalOpen}
        onClose={() => setIsModuleModalOpen(false)}
        onSelectModule={handleStartModule}
        currentModuleId={state?.currentModuleId}
      />
    </div>
  )
}
