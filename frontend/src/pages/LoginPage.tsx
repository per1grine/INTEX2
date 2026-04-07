import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/auth'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <section className="authShell">
      <div className="authCard">
        <p className="eyebrow">Staff access</p>
        <h1>Sign in to North Star</h1>
        <p className="lede">
          Use your staff credentials to review donor records, operational metrics, and reporting
          dashboards.
        </p>

<<<<<<< HEAD
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault()
          setError(null)
          setLoading(true)
          try {
            await login(username, password)
            navigate('/donor')
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed')
          } finally {
            setLoading(false)
          }
        }}
      >
        <label className="field">
          <span>Username</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
=======
        <form
          className="form"
          onSubmit={async (event) => {
            event.preventDefault()
            setError(null)
            setLoading(true)
            try {
              await login(username, password)
              navigate('/welcome')
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Login failed')
            } finally {
              setLoading(false)
            }
          }}
        >
          <label className="field">
            <span>Username</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} required />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
>>>>>>> 7dde4dd8470964e9f266560477a298d4c2101003

          {error ? <div className="error">{error}</div> : null}

          <div className="ctaRow">
            <button className="button" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <Link className="button buttonGhost" to="/register">
              Create account
            </Link>
          </div>
        </form>
      </div>
    </section>
  )
}
