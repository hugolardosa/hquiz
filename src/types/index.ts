export interface Question {
  id: string
  type: 'multiple-choice' | 'true-false' | 'text'
  question: string
  answers: string[]
  correctAnswer: number // Index of correct answer
  timeLimit: number // Time in seconds, default 60
  image?: string // Base64 encoded image or file path
}

export interface Questionnaire {
  id: string
  title: string
  description?: string
  questions: Question[]
  createdAt: Date
  updatedAt: Date
}

export interface QuestionProgress {
  questionId: string
  answered: boolean
  correct?: boolean
  timeSpent: number
  selectedAnswer?: number
}

export interface SessionProgress {
  questionnaireId: string
  sessionId: string
  startedAt: Date
  questions: QuestionProgress[]
  currentQuestionIndex: number
  completed: boolean
}

export interface AppSettings {
  defaultTimeLimit: number
  enableAnimations: boolean
  autoSave: boolean
}

// Global electron API types
declare global {
  interface Window {
    electronAPI: {
      saveQuestionnaire: (data: any) => Promise<{ success: boolean }>
      loadQuestionnaire: () => Promise<{ success: boolean; data: any }>
      onMainProcessMessage: (callback: (message: string) => void) => void
      removeAllListeners: (channel: string) => void
    }
  }
} 