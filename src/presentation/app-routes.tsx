import { Navigate, Route, Routes } from '@solidjs/router'
import { Show, onMount } from 'solid-js'
import { useAuthContext } from '../business/auth'
import { AuthStatus } from './auth/auth-status'
import { hideSplash } from './landing/hide-splash'
import { RecipesPage } from './recipes/recipes'
import { logMount } from './utils/log-mount'

const AppRoutes = () => {
  logMount('AppRoutes')
  const { authState } = useAuthContext()

  onMount(hideSplash)
  return (
    <Show when={authState.authUser} fallback={<AuthStatus />}>
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <AuthStatus />
              <RecipesPage />
            </div>
          }
        />
        <Route path="/*" element={<Navigate href="/" />} />
        {/* <Route element={<Outlet />}>
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
        </Route> */}
      </Routes>
    </Show>
  )
}

// const Layout = ({ children }: { children: React.ReactNode }) => (
//   <div>
//     <AuthStatus />
//     <ul>
//       <li>
//         <Link to="/">Public Page</Link>
//       </li>
//       <li>
//         <Link to="/protected">Protected Page</Link>
//       </li>
//     </ul>
//     {children}
//   </div>
// )

// for lazy loading, export as default
export default AppRoutes
