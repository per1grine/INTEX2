import { Link } from 'react-router-dom'
import { useAuth } from '../state/auth'

export function WelcomePage() {
  const { user } = useAuth()

  return (
    <section className="card">
      <h1 className="title">Welcome{user ? `, ${user.firstName}` : ''}</h1>
      <p className="muted">You’re logged in.</p>
      <div className="row">
        <Link className="button secondary" to="/">
          Back home
        </Link>
      </div>
    </section>
  )
}

