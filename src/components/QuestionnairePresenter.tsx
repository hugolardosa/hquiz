import { useState, useEffect, useRef } from 'react'
import { 
  Paper, 
  Title, 
  Button, 
  Group, 
  Stack, 
  Card,
  Text,
  Progress,
  Center,
  Image,
  SimpleGrid,
  Badge,
  Box,
  Switch
} from '@mantine/core'
import { IconRefresh, IconCheck, IconX, IconEye, IconEyeOff } from '@tabler/icons-react'
import { Question, SessionProgress } from '../types'
import { useQuestionnaireStorage } from '../hooks/useQuestionnaireStorage'
import { v4 as uuidv4 } from 'uuid'

interface QuestionnairePresenterProps {}

const QuestionnairePresenter: React.FC<QuestionnairePresenterProps> = () => {
  const {
    questionnaire,
    sessionProgress,
    setSessionProgress,
    saveSessionProgress,
    saveSessionToHistory,
    isLoaded
  } = useQuestionnaireStorage()
  
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [questionResult, setQuestionResult] = useState<'correct' | 'wrong' | 'timeout' | null>(null)
  const [showQuestionText, setShowQuestionText] = useState<boolean>(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Load show question text preference
  useEffect(() => {
    const savedPreference = localStorage.getItem('hquiz_show_question_text')
    if (savedPreference !== null) {
      setShowQuestionText(JSON.parse(savedPreference))
    }
  }, [])

  // Initialize session progress when questionnaire is loaded
  useEffect(() => {
    if (isLoaded && questionnaire && !sessionProgress) {
      const progress: SessionProgress = {
        questionnaireId: questionnaire.id,
        sessionId: uuidv4(),
        startedAt: new Date(),
        questions: questionnaire.questions.map((q: Question) => ({
          questionId: q.id,
          answered: false,
          timeSpent: 0
        })),
        currentQuestionIndex: -1,
        completed: false
      }
      setSessionProgress(progress)
      saveSessionProgress(progress)
    }
  }, [isLoaded, questionnaire, sessionProgress, setSessionProgress, saveSessionProgress])

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isTimerRunning) {
      handleTimeout()
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isTimerRunning, timeLeft])

  const startQuestion = (questionIndex: number) => {
    if (!questionnaire || !sessionProgress) return
    
    const question = questionnaire.questions[questionIndex]
    setCurrentQuestion(question)
    setTimeLeft(question.timeLimit)
    setIsTimerRunning(true)
    setShowAnswer(false)
    setQuestionResult(null)
    
    // Update session progress
    setSessionProgress(prev => prev ? {
      ...prev,
      currentQuestionIndex: questionIndex
    } : null)
  }

  const handleCorrectAnswer = () => {
    if (!currentQuestion || !sessionProgress) return
    
    setIsTimerRunning(false)
    setQuestionResult('correct')
    setShowAnswer(true)
    
    // Update progress
    updateQuestionProgress(true, sessionProgress.currentQuestionIndex)
  }

  const handleWrongAnswer = () => {
    if (!currentQuestion || !sessionProgress) return
    
    setIsTimerRunning(false)
    setQuestionResult('wrong')
    setShowAnswer(true)
    
    // Update progress
    updateQuestionProgress(false, sessionProgress.currentQuestionIndex)
  }

  const handleTimeout = () => {
    if (!currentQuestion || !sessionProgress) return
    
    setIsTimerRunning(false)
    setQuestionResult('timeout')
    setShowAnswer(true)
    
    // Update progress
    updateQuestionProgress(false, sessionProgress.currentQuestionIndex)
  }

  const updateQuestionProgress = (correct: boolean, questionIndex: number) => {
    if (!sessionProgress || !currentQuestion) return
    
    const timeSpent = currentQuestion.timeLimit - timeLeft
    
    const updatedQuestions = [...sessionProgress.questions]
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      answered: true,
      correct,
      timeSpent
    }
    
    const updatedProgress = {
      ...sessionProgress,
      questions: updatedQuestions
    }
    
    setSessionProgress(updatedProgress)
    saveSessionProgress(updatedProgress)
  }

  const goBackToGrid = () => {
    setCurrentQuestion(null)
    setIsTimerRunning(false)
    setTimeLeft(0)
    setShowAnswer(false)
    setQuestionResult(null)
  }

  const isQuestionAnswered = (questionIndex: number): boolean => {
    return sessionProgress?.questions[questionIndex]?.answered || false
  }

  const getQuestionResult = (questionIndex: number): 'correct' | 'wrong' | null => {
    const progress = sessionProgress?.questions[questionIndex]
    if (!progress?.answered) return null
    return progress.correct ? 'correct' : 'wrong'
  }

  const handleShowQuestionTextToggle = (value: boolean) => {
    setShowQuestionText(value)
    localStorage.setItem('hquiz_show_question_text', JSON.stringify(value))
  }

  if (!questionnaire) {
    return (
      <Center style={{ height: '60vh' }}>
        <Stack align="center">
          <Text size="lg" c="dimmed">Nenhum questionário carregado</Text>
          <Text size="sm" c="dimmed">Por favor, crie um questionário no Editor primeiro</Text>
        </Stack>
      </Center>
    )
  }

  if (currentQuestion) {
    return (
      <Stack gap="lg">
                <Paper p="md" withBorder>
          <Group justify="space-between">
            <Title order={3}>
              Pergunta {(sessionProgress?.currentQuestionIndex || 0) + 1} de {questionnaire.questions.length}
            </Title>
            <Group>
              <Text 
                size="lg" 
                fw={700} 
                c={timeLeft <= 10 ? 'red' : 'blue'}
                className={timeLeft <= 10 ? 'timer-warning' : ''}
              >
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </Text>
              <Button variant="outline" onClick={goBackToGrid}>
                Voltar ao Grid
              </Button>
            </Group>
          </Group>
          <Progress
            value={(currentQuestion.timeLimit - timeLeft) / currentQuestion.timeLimit * 100}
            color={timeLeft <= 10 ? 'red' : 'blue'}
            size="lg"
            mt="md"
          />
        </Paper>

        <Card withBorder p="xl">
          <Stack gap="lg" align="center">
            {currentQuestion.image && (
              <Image
                src={currentQuestion.image}
                alt="Question image"
                style={{ maxWidth: '400px', maxHeight: '300px' }}
              />
            )}
            
            <Title order={2} ta="center">
              {currentQuestion.question}
            </Title>

            {(currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'image-choice') && !showAnswer && (
              <SimpleGrid cols={2} spacing="md" style={{ width: '100%', maxWidth: '600px' }}>
                {currentQuestion.answers.map((answer, index) => {
                  const handleClick = () => {
                    if (index === currentQuestion.correctAnswer) handleCorrectAnswer(); else handleWrongAnswer()
                  }
                  if (currentQuestion.type === 'image-choice') {
                    return (
                      <Card key={index} withBorder p="sm" onClick={handleClick} style={{ cursor: 'pointer' }}>
                        <Stack align="center" gap="xs">
                          <Image src={answer} alt={`Opção ${index + 1}`} h={140} fit="contain" />
                          <Badge>{String.fromCharCode(65 + index)}</Badge>
                        </Stack>
                      </Card>
                    )
                  }
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      size="lg"
                      className="answer-button"
                      style={{ height: 'auto', padding: '16px' }}
                      onClick={handleClick}
                    >
                      {String.fromCharCode(65 + index)}: {answer}
                    </Button>
                  )
                })}
              </SimpleGrid>
            )}

                         {currentQuestion.type === 'true-false' && !showAnswer && (
               <Group>
                 <Button
                   size="xl"
                   color="green"
                   onClick={() => {
                     if (currentQuestion.correctAnswer === 0) {
                       handleCorrectAnswer()
                     } else {
                       handleWrongAnswer()
                     }
                   }}
                 >
                   VERDADEIRO
                 </Button>
                 <Button
                   size="xl"
                   color="red"
                   onClick={() => {
                     if (currentQuestion.correctAnswer === 1) {
                       handleCorrectAnswer()
                     } else {
                       handleWrongAnswer()
                     }
                   }}
                 >
                   FALSO
                 </Button>
               </Group>
             )}

            {showAnswer && (
              <Stack align="center" gap="lg">
                                 {questionResult === 'correct' && (
                   <Box style={{ textAlign: 'center' }} className="correct-animation slide-in-bottom">
                     <IconCheck size={64} color="green" />
                     <Title order={2} c="green">Correto!</Title>
                   </Box>
                 )}
                 
                 {questionResult === 'wrong' && (
                   <Box style={{ textAlign: 'center' }} className="wrong-animation slide-in-bottom">
                     <IconX size={64} color="red" />
                     <Title order={2} c="red">Errado!</Title>
                   </Box>
                 )}
                 
                 {questionResult === 'timeout' && (
                   <Box style={{ textAlign: 'center' }} className="timeout-animation slide-in-bottom">
                     <IconX size={64} color="orange" />
                     <Title order={2} c="orange">Tempo Esgotado!</Title>
                   </Box>
                 )}

                <Paper p="md" withBorder style={{ backgroundColor: '#f8f9fa' }}>
                  {currentQuestion.type === 'image-choice' ? (
                    <Stack align="center" gap="xs">
                      <Text size="lg" fw={500}>Resposta Correta:</Text>
                      <Image src={currentQuestion.answers[currentQuestion.correctAnswer]} alt="Correta" h={160} fit="contain" />
                    </Stack>
                  ) : (
                    <Text size="lg" fw={500}>
                      Resposta Correta: {currentQuestion.answers[currentQuestion.correctAnswer]}
                    </Text>
                  )}
                </Paper>

                <Button 
                  onClick={goBackToGrid} 
                  size="lg" 
                  variant="filled"
                  style={{ marginTop: '16px' }}
                >
                  Voltar ao Grid
                </Button>

                </Stack>
             )}

            {(questionResult === 'timeout' || !isTimerRunning) && !showAnswer && (
              <Group>
                <Button onClick={handleCorrectAnswer} color="green" size="lg">
                  Aluno Acertou
                </Button>
                <Button onClick={handleWrongAnswer} color="red" size="lg">
                  Aluno Errou
                </Button>
                <Button onClick={() => setShowAnswer(true)} variant="outline" size="lg">
                  Mostrar Resposta
                </Button>
              </Group>
            )}
          </Stack>
        </Card>
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
            <Paper p="md" withBorder>
        <Group justify="space-between">
          <div>
            <Title order={2}>{questionnaire.title}</Title>
            {questionnaire.description && (
              <Text c="dimmed">{questionnaire.description}</Text>
            )}
          </div>
          <Group>
            <Badge size="lg">
              {sessionProgress?.questions.filter(q => q.answered).length || 0} / {questionnaire.questions.length} Completas
            </Badge>
            <Button
              leftSection={<IconRefresh size={16} />}
              variant="outline"
              onClick={() => {
                if (!questionnaire) return
                
                // Save current session to history if it has progress
                if (sessionProgress && sessionProgress.questions.some(q => q.answered)) {
                  saveSessionToHistory(sessionProgress)
                }
                
                const progress: SessionProgress = {
                  questionnaireId: questionnaire.id,
                  sessionId: uuidv4(),
                  startedAt: new Date(),
                  questions: questionnaire.questions.map(q => ({
                    questionId: q.id,
                    answered: false,
                    timeSpent: 0
                  })),
                  currentQuestionIndex: -1,
                  completed: false
                }
                setSessionProgress(progress)
                saveSessionProgress(progress)
              }}
            >
              Reiniciar Sessão
            </Button>
          </Group>
        </Group>
      </Paper>

      <Group justify="space-between" align="center">
        <Title order={3}>Selecione uma Pergunta</Title>
        <Switch
          label="Mostrar texto das perguntas"
          checked={showQuestionText}
          onChange={(event) => handleShowQuestionTextToggle(event.currentTarget.checked)}
          thumbIcon={
            showQuestionText ? (
              <IconEye size={12} stroke={2.5} />
            ) : (
              <IconEyeOff size={12} stroke={2.5} />
            )
          }
        />
      </Group>
      
      <SimpleGrid cols={5} spacing="md">
        {questionnaire.questions.map((question, index) => {
          const answered = isQuestionAnswered(index)
          const result = getQuestionResult(index)
          
          return (
                         <Card
               key={question.id}
               withBorder
               className={`question-card ${answered ? 'disabled' : ''} fade-in`}
               style={{
                 cursor: answered ? 'not-allowed' : 'pointer',
                 opacity: answered ? 0.6 : 1,
                 backgroundColor: answered 
                   ? result === 'correct' ? '#e7f5e7' : '#ffe0e0'
                   : 'white'
               }}
               onClick={() => !answered && startQuestion(index)}
             >
              <Stack align="center" gap="xs">
                <Title order={2} c={answered ? 'dimmed' : 'blue'}>
                  {index + 1}
                </Title>
                {showQuestionText && (
                  <Text size="sm" ta="center" c="dimmed" truncate>
                    {question.question || 'Pergunta sem Título'}
                  </Text>
                )}
                {answered && (
                  <Badge color={result === 'correct' ? 'green' : 'red'} size="sm">
                    {result === 'correct' ? 'Correto' : 'Errado'}
                  </Badge>
                )}
                <Text size="xs" c="dimmed">
                  {question.timeLimit}s
                </Text>
              </Stack>
            </Card>
          )
        })}
      </SimpleGrid>

      {questionnaire.questions.length === 0 && (
        <Paper p="xl" withBorder style={{ textAlign: 'center' }}>
          <Stack align="center">
            <Text c="dimmed" size="lg">Nenhuma pergunta disponível</Text>
            <Text c="dimmed">Adicione algumas perguntas no Editor para começar a apresentar</Text>
          </Stack>
        </Paper>
      )}
    </Stack>
  )
}

export default QuestionnairePresenter 