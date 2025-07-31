import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell, Title, Group, Button, Container } from '@mantine/core'
import { IconEdit, IconPresentation } from '@tabler/icons-react'
import { useNavigate, useLocation } from 'react-router-dom'
import QuestionnaireEditor from './components/QuestionnaireEditor'
import QuestionnairePresenter from './components/QuestionnairePresenter'

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
    >
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group justify="space-between" h="100%">
            <Title order={2} c="blue">HQuiz</Title>
            <Group>
              <Button
                variant={location.pathname === '/editor' ? 'filled' : 'light'}
                leftSection={<IconEdit size={16} />}
                onClick={() => navigate('/editor')}
              >
                Editor
              </Button>
              <Button
                variant={location.pathname === '/presenter' ? 'filled' : 'light'}
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