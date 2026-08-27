import React from 'react'
import { CheckCircle, Sparkles, History, ArrowRight, Award, UserCheck } from 'lucide-react'

interface FlowCompleteCardProps {
  message?: string
  allModulesCompleted?: boolean
  unvisitedCount?: number
  onOpenModules: () => void
  onOpenHistory: () => void
  onSwitchUser?: () => void
}

export const FlowCompleteCard: React.FC<FlowCompleteCardProps> = ({
  message,
  allModulesCompleted = false,
  unvisitedCount = 0,
  onOpenModules,
  onOpenHistory,
  onSwitchUser,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden">
      {/* Background Subtle Glow */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 blur-3xl pointer-events-none ${
          allModulesCompleted ? 'bg-amber-500/10' : 'bg-teal-500/10'
        }`}
      />

      {/* Top Icon */}
      <div
        className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg text-slate-950 relative z-10 ${
          allModulesCompleted
            ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-amber-500/20'
            : 'bg-gradient-to-tr from-teal-500 to-emerald-400 shadow-teal-500/20'
        }`}
      >
        {allModulesCompleted ? <Award className="w-9 h-9" /> : <CheckCircle className="w-9 h-9" />}
      </div>

      {/* Headline & Description */}
      <div className="space-y-2 relative z-10">
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${
            allModulesCompleted
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
              : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
          }`}
        >
          {allModulesCompleted ? (
            <>
              <Award className="w-3.5 h-3.5" /> All Modules Completed
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" /> Flow Complete
            </>
          )}
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight">
          {allModulesCompleted ? 'Full Journey Completed 🎉' : 'Session Finished'}
        </h2>

        <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
          {allModulesCompleted
            ? 'You have completed all available clinical & triage modules! Your entire journey is recorded in the immutable conversation ledger.'
            : message || 'You have reached the end of this flow. Well done!'}
        </p>
      </div>

      {/* Actions */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
        {allModulesCompleted ? (
          /* When ALL modules are finished -> History is the primary action */
          <>
            <button
              onClick={onOpenHistory}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-[0.99]"
            >
              <History className="w-4 h-4" />
              <span>View Full Ledger Timeline</span>
            </button>

            {onSwitchUser && (
              <button
                onClick={onSwitchUser}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-sm border border-slate-700 transition-all"
              >
                <UserCheck className="w-4 h-4 text-teal-400" />
                <span>Simulate New User</span>
              </button>
            )}
          </>
        ) : (
          /* When there are still unvisited modules remaining */
          <>
            <button
              onClick={onOpenModules}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-[0.99]"
            >
              <span>Explore Remaining Modules ({unvisitedCount})</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenHistory}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-sm border border-slate-700 transition-all"
            >
              <History className="w-4 h-4 text-indigo-400" />
              <span>View History</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
