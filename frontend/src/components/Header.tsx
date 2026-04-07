import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/auth'

<<<<<<< HEAD
function Pipe() {
  return <span className="navPipe">|</span>
}
=======
const primaryNav = [
  { to: '/', label: 'Home' },
  { to: '/donors', label: 'Donors & Contributions' },
  { to: '/impact', label: 'Impact' },
  { to: '/admin', label: 'Admin' },
]
>>>>>>> 7dde4dd8470964e9f266560477a298d4c2101003

export function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
<<<<<<< HEAD
    <header className="header">
      <div className="headerInner">
        <Link to="/" className="brand">
          Home
        </Link>
        <nav className="navLinks" aria-label="Primary navigation">
          {user ? (
            <>
              <Link to="/donor" className="link">
                Donor Dashboard
              </Link>
              <Link to="/admin/donors" className="link">
                Donor Information
              </Link>
              <Pipe />
              <Link to="/admin" className="link">
                Admin Dashboard
              </Link>
              <Link to="/admin/caseload" className="link">
                Caseloads
              </Link>
              <Link to="/admin/process-recording" className="link">
                Process Recording
              </Link>
              <Link to="/admin/home-visitation" className="link">
                Visits
              </Link>
              <Link to="/admin/reports" className="link">
                Reports
              </Link>
              <Pipe />
=======
    <header className="siteHeader">
      <div className="headerWrap">
        <NavLink to="/" className="brandMark" aria-label="North Star home">
          <img src="/kid_stars.svg" alt="" className="brandIcon" />
          <div>
            <strong>North Star</strong>
            <span>Refuge, restoration, and long-term care</span>
          </div>
        </NavLink>

        <nav className="primaryNav" aria-label="Primary">
          {primaryNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `navLink${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="headerActions">
          {user ? (
            <>
              <NavLink to="/welcome" className="actionLink">
                {user.firstName}
              </NavLink>
              <button
                className="button buttonGhost"
                onClick={() => {
                  logout()
                  navigate('/')
                }}
              >
                Log Out
              </button>
>>>>>>> 7dde4dd8470964e9f266560477a298d4c2101003
            </>
          ) : null}
          <Link to="/impact" className="link">
            Impact
          </Link>
          <Link to="/privacy" className="link">
            Privacy
          </Link>
          <Link to="/about" className="link">
            About Us
          </Link>
        </nav>
        <div className="navAuth">
          {user ? (
            <button
              className="button secondary"
              onClick={() => {
                logout()
                navigate('/')
              }}
            >
              Logout
            </button>
          ) : (
            <>
              <NavLink to="/login" className="actionLink">
                Staff Login
              </NavLink>
              <NavLink to="/impact" className="button">
                See the work
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
