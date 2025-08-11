import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell, Title, Group, Button, Container, Image } from '@mantine/core'
import { IconEdit, IconPresentation } from '@tabler/icons-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import QuestionnaireEditor from './components/QuestionnaireEditor'
import QuestionnairePresenter from './components/QuestionnairePresenter'

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname || '/'
  const effectivePath = path === '/' ? '/editor' : path

  // Ensure we land on /editor immediately when path is root
  useEffect(() => {
    if (path === '/') {
      navigate('/editor', { replace: true })
    }
  }, [path, navigate])

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group justify="space-between" h="100%">
            <Group gap="sm">
              <Image src="/hquiz-logo.svg" alt="HQuiz" h={28} fit="contain"/>
              <Title order={2} c="blue">HQuiz</Title>
            </Group>
            <Group>
              <Button
                variant={effectivePath === '/editor' ? 'filled' : 'light'}
                leftSection={<IconEdit size={16} />}
                onClick={() => navigate('/editor')}
              >
                Editor
              </Button>
              <Button
                variant={effectivePath === '/presenter' ? 'filled' : 'light'}
                leftSection={<IconPresentation size={16} />}
                onClick={() => navigate('/presenter')}
              >
                Apresentador
              </Button>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl">
          <Routes>
            <Route path="/editor" element={<QuestionnaireEditor />} />
            <Route path="/presenter" element={<QuestionnairePresenter />} />
            <Route path="/" element={<Navigate to="/editor" replace />} />
          </Routes>
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}

export default App 