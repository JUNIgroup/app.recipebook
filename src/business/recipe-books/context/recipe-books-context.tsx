import { EffectOptions, ParentComponent, createContext, untrack } from 'solid-js'
import { Logger } from '../../../utilities/logger'
import { useExistingContext } from '../../helper/context/use-exiting-context'
import { RecipeBooksStore, createRecipeBooksStore } from './recipe-books-store'

const recipeBooksOptions: EffectOptions = { name: 'RecipeBooksContext' }
export const RecipeBooksContext = createContext<RecipeBooksStore>(undefined, recipeBooksOptions)

type AuthContextProps = {
  logger: Logger<'business'>
}

export const RecipeBooksContextProvider: ParentComponent<AuthContextProps> = (props) => {
  const logger = untrack(() => props.logger)
  const recipeBooksStore = createRecipeBooksStore(logger)
  return <RecipeBooksContext.Provider value={recipeBooksStore}>{props.children}</RecipeBooksContext.Provider>
}

export const useRecipeBooksContext = useExistingContext(RecipeBooksContext, recipeBooksOptions)
