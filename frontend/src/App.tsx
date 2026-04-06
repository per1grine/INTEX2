import { Navigate, Route, Routes } from 'react-router-dom'
import { Header } from './components/Header'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { WelcomePage } from './pages/WelcomePage'
import { useAuth } from './state/auth'

function App() {
  const { user } = useAuth()

  return (
    <div className="app">
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={user ? <Navigate to="/welcome" /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to="/welcome" /> : <RegisterPage />} />
          <Route path="/welcome" element={user ? <WelcomePage /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
