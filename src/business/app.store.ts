import { AnyAction, configureStore, ThunkAction } from '@reduxjs/toolkit'
import type { AuthService } from './auth/service/auth-service'
import { authReducer } from './auth/store/auth.slice'
import { recipesReducer } from './recipes/store/recipe.slice'
import { IdbService } from './db/store/idb.service'

export type Services = {
  storage: Storage
  authService: AuthService
  dbService: IdbService
}

export const createStore = (services: Services) =>
  configureStore({
    reducer: {
      auth: authReducer,
      recipes: recipesReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: { extraArgument: services }, // allows thunks to have access to services
      }),
  })

type Store = ReturnType<typeof createStore>

// All slice states combined.
export type RootState = ReturnType<Store['getState']>

// Dispatcher allows to dispatch app actions or thunk actions.
export type AppDispatch = Store['dispatch']

export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, Services, AnyAction>
