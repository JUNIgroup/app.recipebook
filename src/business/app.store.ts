import { AnyAction, configureStore, ThunkAction } from '@reduxjs/toolkit'
import { RdbService } from '../infrastructure/database/rdb.service'
import { Logger } from '../utilities/logger'
import type { AuthService } from './auth/service/auth-service'
import { authReducer } from './auth/store/auth.slice'
import { dbReducer } from './db/store/db.slice'
import { Database } from './recipe-books/database/database'
import { recipeBooksReducer } from './recipe-books/store'
import { recipesReducer } from './recipes/store/recipe.slice'

export type Services = {
  storage: Storage
  authService: AuthService
  dbService: RdbService<'recipes'>
  database: Database
  logger: Logger<'business'>
}

export const createStore = (services: Services) => {
  const thunkLogs = {
    recipeBooks: services.logger('business:thunk:recipeBooks'),
  }
  const extraArgument = {
    ...services,
    thunkLogs,
  }
  return configureStore({
    reducer: {
      auth: authReducer,
      db: dbReducer,
      recipes: recipesReducer,
      recipeBooks: recipeBooksReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: { extraArgument }, // allows thunks to have access to services
      }),
  })
}

type Store = ReturnType<typeof createStore>

// All slice states combined.
export type RootState = ReturnType<Store['getState']>

// Dispatcher allows to dispatch app actions or thunk actions.
export type AppDispatch = Store['dispatch']

export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, Services, AnyAction>
