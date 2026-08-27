import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { EntryScreen } from '../pages/EntryScreen'
import { FlowScreen } from '../pages/FlowScreen'
import { HistoryScreen } from '../pages/HistoryScreen'
import { ProtectedRoute } from '../components/ProtectedRoute'

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Entry / Simulated Login Screen */}
      <Route path="/login" element={<EntryScreen />} />

      {/* Protected Conversation Flow Views */}
      <Route
        path="/flow"
        element={
          <ProtectedRoute>
            <FlowScreen />
          </ProtectedRoute>
        }
      />

      {/* Defensive Deep-Link Route */}
      <Route
        path="/flow/:questionId"
        element={
          <ProtectedRoute>
            <FlowScreen />
          </ProtectedRoute>
        }
      />

      {/* Full Conversation History View */}
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <HistoryScreen />
          </ProtectedRoute>
        }
      />

      {/* Root & Catch-all Fallbacks */}
      <Route path="/" element={<Navigate to="/flow" replace />} />
      <Route path="*" element={<Navigate to="/flow" replace />} />
    </Routes>
  )
}
