export interface Question {
  id: string
  type: 'multiple-choice' | 'true-false' | 'text' | 'image-choice'
  question: string
  answers: string[] // For 'image-choice', answers contain data URLs of images
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
      dialogOpenQuestionnaire: () => Promise<{ success: boolean; canceled?: boolean; filePath?: string; fileName?: string; content?: string; error?: string }>
      dialogSaveQuestionnaireAs: (content: string, suggestedName?: string) => Promise<{ success: boolean; canceled?: boolean; filePath?: string; fileName?: string; error?: string }>
      writeQuestionnaireToPath: (filePath: string, content: string) => Promise<{ success: boolean; filePath?: string; fileName?: string; error?: string }>
      onMenuAction: (callback: (payload: { type: 'new' | 'open' | 'save' | 'save-as' }) => void) => void
      onMainProcessMessage: (callback: (message: string) => void) => void
      removeAllListeners: (channel: string) => void
    }
  }
} 