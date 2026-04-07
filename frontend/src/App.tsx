import { Navigate, Route, Routes } from 'react-router-dom'
import { CookieConsent } from './components/CookieConsent'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
<<<<<<< HEAD
import { AboutUsPage } from './pages/AboutUsPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { CaseloadInventoryPage } from './pages/CaseloadInventoryPage'
import { DonorDashboardPage } from './pages/DonorDashboardPage'
import { DonorsContributionsPage } from './pages/DonorsContributionsPage'
import { HomePage } from './pages/HomePage'
import { HomeVisitationCaseConferencesPage } from './pages/HomeVisitationCaseConferencesPage'
import { ImpactPage } from './pages/ImpactPage'
import { LoginPage } from './pages/LoginPage'
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage'
import { ProcessRecordingPage } from './pages/ProcessRecordingPage'
=======
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { DonorsPage } from './pages/DonorsPage'
import { HomePage } from './pages/HomePage'
import { ImpactPage } from './pages/ImpactPage'
import { LoginPage } from './pages/LoginPage'
import { PrivacyPage } from './pages/PrivacyPage'
>>>>>>> 7dde4dd8470964e9f266560477a298d4c2101003
import { RegisterPage } from './pages/RegisterPage'
import { ReportsAnalyticsPage } from './pages/ReportsAnalyticsPage'
import { useAuth } from './state/auth'

function App() {
  const { user } = useAuth()

  return (
    <div className="siteShell">
      <Header />
      <main className="siteMain">
        <Routes>
          <Route path="/" element={<HomePage />} />
<<<<<<< HEAD
          <Route path="/impact" element={<ImpactPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/login" element={user ? <Navigate to="/donor" /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to="/donor" /> : <RegisterPage />} />
          <Route path="/donor" element={user ? <DonorDashboardPage /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user ? <AdminDashboardPage /> : <Navigate to="/login" />} />
          <Route path="/admin/donors" element={user ? <DonorsContributionsPage /> : <Navigate to="/login" />} />
          <Route path="/admin/caseload" element={user ? <CaseloadInventoryPage /> : <Navigate to="/login" />} />
          <Route
            path="/admin/process-recording"
            element={user ? <ProcessRecordingPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin/home-visitation"
            element={user ? <HomeVisitationCaseConferencesPage /> : <Navigate to="/login" />}
          />
          <Route path="/admin/reports" element={user ? <ReportsAnalyticsPage /> : <Navigate to="/login" />} />
=======
          <Route path="/donors" element={<DonorsPage />} />
          <Route path="/impact" element={<ImpactPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/login" element={user ? <Navigate to="/welcome" /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to="/welcome" /> : <RegisterPage />} />
          <Route path="/welcome" element={user ? <WelcomePage /> : <Navigate to="/login" />} />
>>>>>>> 7dde4dd8470964e9f266560477a298d4c2101003
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
      <CookieConsent />
    </div>
  )
}

export default App
