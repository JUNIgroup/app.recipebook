/* eslint-disable @typescript-eslint/no-use-before-define */
import { useEffect, useState } from 'react'
import { Link, Outlet, Route, Routes } from 'react-router-dom'
import * as fromAuth from './business/auth/auth.thunks'
import { AuthStatus } from './presentation/auth/auth-status'
import { LoginDialog } from './presentation/auth/login-dialog'
import { RequireAuth } from './presentation/route/require-auth'
import { useAppDispatch } from './presentation/store.hooks'

import './App.css'
import reactLogo from './assets/react.svg'

const Demo = () => {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button type="button" data-testid="counter" onClick={() => setCount((value) => value + 1)}>
          Count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
    </>
  )
}

const App = () => {
  const dispatch = useAppDispatch()
  useEffect(() => dispatch(fromAuth.fetchRememberedEmail()), [])
  useEffect(() => dispatch(fromAuth.observeUser()), [])

  return (
    <Routes>
      <Route element={<Outlet />}>
        <Route
          index
          element={
            <Layout>
              <PublicPage />
            </Layout>
          }
        />
        <Route path="login/*" element={<LoginDialog />} />
        <Route
          path="/protected"
          element={
            <RequireAuth>
              <Layout>
                <Demo />
              </Layout>
            </RequireAuth>
          }
        />
      </Route>
    </Routes>
  )
}

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div>
    <AuthStatus />
    <ul>
      <li>
        <Link to="/">Public Page</Link>
      </li>
      <li>
        <Link to="/protected">Protected Page</Link>
      </li>
    </ul>
    {children}
  </div>
)

const PublicPage = () => <h3>Public</h3>

export default App
