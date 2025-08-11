import { useState, useEffect, useCallback } from 'react'
import { Questionnaire, SessionProgress } from '../types'

const STORAGE_KEYS = {
  QUESTIONNAIRE: 'hquiz_questionnaire',
  SESSION_PROGRESS: 'hquiz_session_progress',
  SESSIONS_HISTORY: 'hquiz_sessions_history'
}

export const useQuestionnaireStorage = () => {
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null)
  const [sessionProgress, setSessionProgress] = useState<SessionProgress | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load data on mount
  useEffect(() => {
    loadQuestionnaire()
    loadSessionProgress()
    setIsLoaded(true)
  }, [])

  const loadQuestionnaire = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUESTIONNAIRE)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Convert date strings back to Date objects
        parsed.createdAt = new Date(parsed.createdAt)
        parsed.updatedAt = new Date(parsed.updatedAt)
        setQuestionnaire(parsed)
        return parsed
      }
    } catch (error) {
      console.error('Erro ao carregar questionário:', error)
    }
    return null
  }, [])

  const saveQuestionnaire = useCallback(async (data: Questionnaire) => {
    try {
      // Always save to localStorage as backup
      localStorage.setItem(STORAGE_KEYS.QUESTIONNAIRE, JSON.stringify(data))
      setQuestionnaire(data)

      // If we have a file path, write directly; otherwise leave to Save As
      if (window.electronAPI && currentFilePath) {
        const content = JSON.stringify(data, null, 2)
        const result = await window.electronAPI.writeQuestionnaireToPath(currentFilePath, content)
        if (!result.success) throw new Error(result.error || 'Failed to save file')
      }

      // Always save to localStorage as backup
      return true
    } catch (error) {
      console.error('Erro ao salvar questionário:', error)
      return false
    }
  }, [currentFilePath])

  const saveQuestionnaireAs = useCallback(async (data: Questionnaire) => {
    try {
      const content = JSON.stringify(data, null, 2)
      const suggestedName = `${data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_questionnaire.json`
      if (window.electronAPI) {
        const result = await window.electronAPI.dialogSaveQuestionnaireAs(content, suggestedName)
        if (result.success && result.filePath) {
          setCurrentFilePath(result.filePath)
          // backup
          localStorage.setItem(STORAGE_KEYS.QUESTIONNAIRE, JSON.stringify(data))
          setQuestionnaire(data)
          return { success: true, filePath: result.filePath }
        }
        return { success: false, canceled: result.canceled }
      }
      return { success: false }
    } catch (error) {
      console.error('Erro no salvar como:', error)
      return { success: false }
    }
  }, [])

  const openQuestionnaireFromDisk = useCallback(async () => {
    try {
      if (!window.electronAPI) return { success: false }
      const result = await window.electronAPI.dialogOpenQuestionnaire()
      if (result.success && result.content && result.filePath) {
        const parsed = JSON.parse(result.content)
        // Convert dates
        parsed.createdAt = new Date(parsed.createdAt)
        parsed.updatedAt = new Date(parsed.updatedAt)
        setQuestionnaire(parsed)
        localStorage.setItem(STORAGE_KEYS.QUESTIONNAIRE, JSON.stringify(parsed))
        setCurrentFilePath(result.filePath)
        return { success: true }
      }
      return { success: false, canceled: result.canceled }
    } catch (error) {
      console.error('Erro ao abrir questionário:', error)
      return { success: false }
    }
  }, [])

  const newQuestionnaire = useCallback((factory: () => Questionnaire) => {
    const data = factory()
    setQuestionnaire(data)
    setCurrentFilePath(null)
    localStorage.setItem(STORAGE_KEYS.QUESTIONNAIRE, JSON.stringify(data))
    return data
  }, [])

  const loadSessionProgress = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSION_PROGRESS)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Convert date strings back to Date objects
        parsed.startedAt = new Date(parsed.startedAt)
        setSessionProgress(parsed)
        return parsed
      }
    } catch (error) {
      console.error('Erro ao carregar progresso da sessão:', error)
    }
    return null
  }, [])

  const saveSessionProgress = useCallback((progress: SessionProgress) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION_PROGRESS, JSON.stringify(progress))
      setSessionProgress(progress)
      return true
    } catch (error) {
      console.error('Erro ao salvar progresso da sessão:', error)
      return false
    }
  }, [])

  const clearSessionProgress = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION_PROGRESS)
      setSessionProgress(null)
      return true
    } catch (error) {
      console.error('Erro ao limpar progresso da sessão:', error)
      return false
    }
  }, [])

  const saveSessionToHistory = useCallback((progress: SessionProgress) => {
    try {
      const existing = localStorage.getItem(STORAGE_KEYS.SESSIONS_HISTORY)
      const history = existing ? JSON.parse(existing) : []
      
      // Add current session to history
      history.push({
        ...progress,
        completedAt: new Date()
      })
      
      // Keep only last 10 sessions
      const recentHistory = history.slice(-10)
      
      localStorage.setItem(STORAGE_KEYS.SESSIONS_HISTORY, JSON.stringify(recentHistory))
      return true
    } catch (error) {
      console.error('Erro ao salvar sessão no histórico:', error)
      return false
    }
  }, [])

  const getSessionsHistory = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS_HISTORY)
      if (saved) {
        const history = JSON.parse(saved)
        // Convert date strings back to Date objects
        return history.map((session: any) => ({
          ...session,
          startedAt: new Date(session.startedAt),
          completedAt: new Date(session.completedAt)
        }))
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de sessões:', error)
    }
    return []
  }, [])

  const exportQuestionnaire = useCallback(() => {
    if (!questionnaire) return null
    
    const dataStr = JSON.stringify(questionnaire, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `${questionnaire.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_questionnaire.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    return dataUri
  }, [questionnaire])

  const importQuestionnaire = useCallback((fileContent: string) => {
    try {
      const imported = JSON.parse(fileContent)
      // Validate basic structure
      if (imported.id && imported.title && Array.isArray(imported.questions)) {
        imported.createdAt = new Date(imported.createdAt)
        imported.updatedAt = new Date()
        saveQuestionnaire(imported)
        return true
      }
      return false
    } catch (error) {
      console.error('Erro ao importar questionário:', error)
      return false
    }
  }, [saveQuestionnaire])

  return {
    questionnaire,
    currentFilePath,
    sessionProgress,
    isLoaded,
    setQuestionnaire,
    setSessionProgress,
    saveQuestionnaire,
    saveQuestionnaireAs,
    loadQuestionnaire,
    openQuestionnaireFromDisk,
    newQuestionnaire,
    saveSessionProgress,
    loadSessionProgress,
    clearSessionProgress,
    saveSessionToHistory,
    getSessionsHistory,
    exportQuestionnaire,
    importQuestionnaire
  }
} 