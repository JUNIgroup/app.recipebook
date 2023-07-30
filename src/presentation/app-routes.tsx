/* eslint-disable @typescript-eslint/no-use-before-define */
import { useLayoutEffect } from 'react'
import { Link, Outlet, Route, Routes } from 'react-router-dom'
import { AuthStatus } from './auth/auth-status'
import { LoginDialog } from './auth/login-dialog'
import { RecipesPage } from './recipes/recipes'
import { RequireAuth } from './route/require-auth'
import { LandingPage } from './landing/landing-page'

export const AppRoutes = () => {
  useLayoutEffect(() => {
    document.getElementById('splash-section')?.remove()
  }, [])
  return (
    <Routes>
      <Route element={<Outlet />}>
        <Route index element={<LandingPage />} />
        <Route path="login/*" element={<LoginDialog />} />
        <Route
          path="/protected"
          element={
            <RequireAuth>
              <Layout>
                <RecipesPage />
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
