/* eslint-disable @typescript-eslint/no-use-before-define */
import { Route, Routes } from '@solidjs/router'
import { Show, onMount } from 'solid-js'
import { AuthStatus } from './auth/auth-status'
// import { RecipesPage } from './recipes/recipes'
import { useAuthContext } from '../business/auth/reactives/auth-context'
import { hideSplash } from './landing/hide-splash'
import { logMount } from './utils/log-mount'

const AppRoutes = () => {
  logMount('AppRoutes')
  const [authState] = useAuthContext()

  onMount(hideSplash)
  return (
    <Show when={authState.authUser} fallback={<AuthStatus />}>
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <AuthStatus />
              <div>Home</div>
            </div>
          }
        />
        <Route
          path="/recipes"
          element={
            <div>
              <AuthStatus />
              <div>Recipes</div>
            </div>
          }
        />
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
