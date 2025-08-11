import { useEffect } from 'react'
import { 
  Paper, 
  Title, 
  Button, 
  Group, 
  Stack, 
  TextInput, 
  Textarea, 
  Select, 
  NumberInput,
  Card,
  Text,
  ActionIcon,
  FileInput,
  Badge,
  Divider,
  Tooltip
} from '@mantine/core'
import { IconPlus, IconTrash, IconUpload, IconFile, IconFolderOpen, IconDeviceFloppy } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { Question, Questionnaire } from '../types'
import { useQuestionnaireStorage } from '../hooks/useQuestionnaireStorage'
import { v4 as uuidv4 } from 'uuid'

interface QuestionnaireEditorProps {}

const QuestionnaireEditor: React.FC<QuestionnaireEditorProps> = () => {
  const {
    questionnaire,
    currentFilePath,
    setQuestionnaire,
    saveQuestionnaire,
    saveQuestionnaireAs,
    openQuestionnaireFromDisk,
    newQuestionnaire,
    isLoaded
  } = useQuestionnaireStorage()

  // Initialize new questionnaire if none exists
  useEffect(() => {
    if (isLoaded && !questionnaire) {
      const newQuestionnaire: Questionnaire = {
        id: uuidv4(),
        title: 'Novo Questionário',
        description: '',
        questions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      setQuestionnaire(newQuestionnaire)
    }
  }, [isLoaded, questionnaire, setQuestionnaire])

  const addQuestion = () => {
    if (!questionnaire) return
    
    const newQuestion: Question = {
      id: uuidv4(),
      type: 'multiple-choice',
      question: '',
      answers: ['', '', '', ''],
      correctAnswer: 0,
      timeLimit: 60,
    }
    
    const updatedQuestionnaire = {
      ...questionnaire,
      questions: [...questionnaire.questions, newQuestion],
      updatedAt: new Date()
    }
    
    setQuestionnaire(updatedQuestionnaire)
    saveQuestionnaire(updatedQuestionnaire)
  }

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    if (!questionnaire) return
    
    const updatedQuestionnaire = {
      ...questionnaire,
      questions: questionnaire.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      ),
      updatedAt: new Date()
    }
    
    setQuestionnaire(updatedQuestionnaire)
    saveQuestionnaire(updatedQuestionnaire)
  }

  const deleteQuestion = (questionId: string) => {
    if (!questionnaire) return
    
    const updatedQuestionnaire = {
      ...questionnaire,
      questions: questionnaire.questions.filter(q => q.id !== questionId),
      updatedAt: new Date()
    }
    
    setQuestionnaire(updatedQuestionnaire)
    saveQuestionnaire(updatedQuestionnaire)
  }

  const handleSave = async () => {
    if (!questionnaire) return
    
    if (!currentFilePath) {
      const result = await saveQuestionnaireAs(questionnaire)
      if (result.success) {
        notifications.show({ title: 'Salvo!', message: 'Questionário salvo', color: 'green' })
      }
      return
    }
    const success = await saveQuestionnaire(questionnaire)
    if (success) {
      notifications.show({ title: 'Salvo!', message: 'Questionário salvo', color: 'green' })
    } else {
      notifications.show({ title: 'Erro', message: 'Falha ao salvar questionário', color: 'red' })
    }
  }

  const handleNew = () => {
    newQuestionnaire(() => ({
      id: uuidv4(),
      title: 'Novo Questionário',
      description: '',
      questions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }))
    notifications.show({ title: 'Novo', message: 'Novo questionário iniciado', color: 'blue' })
  }

  const handleOpen = async () => {
    const result = await openQuestionnaireFromDisk()
    if (result.success) {
      notifications.show({ title: 'Aberto', message: 'Questionário aberto do arquivo', color: 'blue' })
    }
  }

  const handleSaveAs = async () => {
    if (!questionnaire) return
    const result = await saveQuestionnaireAs(questionnaire)
    if (result.success) {
      notifications.show({ title: 'Salvo', message: 'Questionário salvo como novo arquivo', color: 'green' })
    }
  }

  

  const updateQuestionnaireField = (field: keyof Questionnaire, value: any) => {
    if (!questionnaire) return
    
    const updatedQuestionnaire = {
      ...questionnaire,
      [field]: value,
      updatedAt: new Date()
    }
    
    setQuestionnaire(updatedQuestionnaire)
    saveQuestionnaire(updatedQuestionnaire)
  }

  // Hook into app menu actions to mirror classic File menu behavior
  useEffect(() => {
    if (!window.electronAPI?.onMenuAction) return
    const handler = async (payload: { type: 'new' | 'open' | 'save' | 'save-as' }) => {
      if (payload.type === 'new') handleNew()
      if (payload.type === 'open') await handleOpen()
      if (payload.type === 'save') await handleSave()
      if (payload.type === 'save-as') await handleSaveAs()
    }
    window.electronAPI.onMenuAction(handler)
    return () => {
      window.electronAPI.removeAllListeners?.('menu-action')
    }
  }, [questionnaire, currentFilePath])

  if (!questionnaire) {
    return (
      <Paper p="xl" withBorder style={{ textAlign: 'center' }}>
        <Text size="lg" c="dimmed">Carregando questionário...</Text>
      </Paper>
    )
  }

  return (
    <Stack gap="lg">
      <Paper p="sm" withBorder>
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Tooltip label="Novo">
              <Button variant="light" leftSection={<IconFile size={16} />} onClick={handleNew}>Novo</Button>
            </Tooltip>
            <Tooltip label="Abrir…">
              <Button variant="light" leftSection={<IconFolderOpen size={16} />} onClick={handleOpen}>Abrir…</Button>
            </Tooltip>
            <Divider orientation="vertical" mx="xs" />
            <Tooltip label="Salvar">
              <Button variant="filled" color="green" leftSection={<IconDeviceFloppy size={16} />} onClick={handleSave}>Salvar</Button>
            </Tooltip>
            <Tooltip label="Salvar como…">
              <Button variant="light" leftSection={<IconDeviceFloppy size={16} />} onClick={handleSaveAs}>Salvar como…</Button>
            </Tooltip>
            
          </Group>
          <Text size="sm" c="dimmed">{currentFilePath ? currentFilePath : 'Sem arquivo'}</Text>
        </Group>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="md">
          <Group grow>
            <TextInput
              label="Título"
              value={questionnaire.title}
              onChange={(e) => updateQuestionnaireField('title', e.target.value)}
            />
          </Group>
          <Textarea
            label="Descrição (Opcional)"
            value={questionnaire.description || ''}
            onChange={(e) => updateQuestionnaireField('description', e.target.value)}
          />
        </Stack>
      </Paper>

      <Group justify="space-between">
        <Title order={3}>Perguntas ({questionnaire.questions.length})</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={addQuestion}>
          Adicionar Pergunta
        </Button>
      </Group>

      <Stack gap="md">
        {questionnaire.questions.map((question, index) => (
          <QuestionEditor
            key={question.id}
            question={question}
            index={index}
            onUpdate={(updates) => updateQuestion(question.id, updates)}
            onDelete={() => deleteQuestion(question.id)}
          />
        ))}
      </Stack>

      {questionnaire.questions.length === 0 && (
        <Paper p="xl" withBorder style={{ textAlign: 'center' }}>
          <Text c="dimmed">Nenhuma pergunta ainda. Clique em "Adicionar Pergunta" para começar.</Text>
        </Paper>
      )}
    </Stack>
  )
}

interface QuestionEditorProps {
  question: Question
  index: number
  onUpdate: (updates: Partial<Question>) => void
  onDelete: () => void
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ 
  question, 
  index, 
  onUpdate, 
  onDelete 
}) => {
  const updateAnswer = (answerIndex: number, value: string) => {
    const newAnswers = [...question.answers]
    newAnswers[answerIndex] = value
    onUpdate({ answers: newAnswers })
  }

  return (
    <Card withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Badge>Pergunta {index + 1}</Badge>
          <ActionIcon color="red" onClick={onDelete}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>

        <Group grow>
          <Select
            label="Tipo de Pergunta"
            value={question.type}
            onChange={(value) => onUpdate({ type: value as Question['type'] })}
            data={[
              { value: 'multiple-choice', label: 'Múltipla Escolha' },
              { value: 'image-choice', label: 'Escolha por Imagem' },
              { value: 'true-false', label: 'Verdadeiro/Falso' },
              { value: 'text', label: 'Resposta de Texto' }
            ]}
          />
          <NumberInput
            label="Limite de Tempo (segundos)"
            value={question.timeLimit}
            onChange={(value) => onUpdate({ timeLimit: Number(value) || 60 })}
            min={10}
            max={600}
          />
        </Group>

        <Textarea
          label="Pergunta"
          value={question.question}
          onChange={(e) => onUpdate({ question: e.target.value })}
          placeholder="Digite sua pergunta aqui..."
        />

        {(question.type === 'multiple-choice' || question.type === 'image-choice') && (
          <Stack gap="sm">
            <Text size="sm" fw={500}>Respostas</Text>
            {question.answers.map((answer, idx) => (
              <Group key={idx} align="flex-end">
                {question.type === 'image-choice' ? (
                  <FileInput
                    style={{ flex: 1 }}
                    placeholder={`Imagem ${idx + 1}`}
                    accept="image/*"
                    leftSection={<IconUpload size={16} />}
                    onChange={(file) => {
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = (e) => updateAnswer(idx, (e.target?.result as string) || '')
                      reader.readAsDataURL(file)
                    }}
                  />
                ) : (
                  <TextInput
                    style={{ flex: 1 }}
                    placeholder={`Resposta ${idx + 1}`}
                    value={answer}
                    onChange={(e) => updateAnswer(idx, e.target.value)}
                  />
                )}
                <Button
                  variant={question.correctAnswer === idx ? 'filled' : 'light'}
                  color={question.correctAnswer === idx ? 'green' : 'gray'}
                  onClick={() => onUpdate({ correctAnswer: idx })}
                >
                  {question.correctAnswer === idx ? 'Correto' : 'Marcar Correto'}
                </Button>
              </Group>
            ))}
          </Stack>
        )}

        {question.type === 'true-false' && (
          <Group>
            <Button
              variant={question.correctAnswer === 0 ? 'filled' : 'light'}
              color={question.correctAnswer === 0 ? 'green' : 'gray'}
              onClick={() => onUpdate({ correctAnswer: 0, answers: ['Verdadeiro', 'Falso'] })}
            >
              Verdadeiro é Correto
            </Button>
            <Button
              variant={question.correctAnswer === 1 ? 'filled' : 'light'}
              color={question.correctAnswer === 1 ? 'green' : 'gray'}
              onClick={() => onUpdate({ correctAnswer: 1, answers: ['Verdadeiro', 'Falso'] })}
            >
              Falso é Correto
            </Button>
          </Group>
        )}

        <FileInput
          label="Imagem da Pergunta (Opcional)"
          placeholder="Escolher arquivo de imagem"
          leftSection={<IconUpload size={16} />}
          accept="image/*"
          onChange={(file) => {
            if (file) {
              const reader = new FileReader()
              reader.onload = (e) => {
                onUpdate({ image: e.target?.result as string })
              }
              reader.readAsDataURL(file)
            }
          }}
        />
      </Stack>
    </Card>
  )
}

export default QuestionnaireEditor 