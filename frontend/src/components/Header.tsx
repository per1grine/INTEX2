import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/auth'

export function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="header">
      <div className="headerInner">
        <Link to="/" className="brand">
          Home
        </Link>
        <nav className="nav">
          {user ? (
            <>
              <Link to="/welcome" className="link">
                Welcome
              </Link>
              <button
                className="button secondary"
                onClick={() => {
                  logout()
                  navigate('/')
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="button">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

