/* eslint-disable @typescript-eslint/no-use-before-define */
import { Link, Outlet, Route, Routes } from 'react-router-dom'
import { AuthStatus } from './auth/auth-status'
import { LoginDialog } from './auth/login-dialog'
import { RecipesPage } from './recipes/recipes'
import { RequireAuth } from './route/require-auth'

export const AppRoutes = () => (
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
              <RecipesPage />
            </Layout>
          </RequireAuth>
        }
      />
    </Route>
  </Routes>
)

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
