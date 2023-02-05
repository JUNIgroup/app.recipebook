import { AppThunk, Services } from '../../app.store'
import { actions, DBOpenState } from './db.slice'

export function openDB(): AppThunk<void> {
  return async (dispatch, _getState, services: Services) => {
    const { dbService } = services
    dbService.openDB({
      onBlocked: () => {
        dispatch(actions.setOpenState({ open: DBOpenState.UPGRADE_BLOCKED }))
      },
      onError: () => {
        dispatch(actions.setOpenState({ open: DBOpenState.OPEN_FAILED }))
      },
      onOpen: () => {
        dispatch(actions.setOpenState({ open: DBOpenState.OPEN }))
      },
    })
  }
}

export function closeAndDeleteDB(): AppThunk<void> {
  return async (dispatch, _getState, services: Services) => {
    const { dbService } = services
    dbService.closeAndDeleteDB({
      onBlocked: () => {
        dispatch(actions.setOpenState({ open: DBOpenState.UPGRADE_BLOCKED }))
      },
      onError: () => {
        dispatch(actions.setOpenState({ open: DBOpenState.OPEN_FAILED }))
      },
      onDelete: () => {
        dispatch(actions.setOpenState({ open: DBOpenState.DELETED }))
      },
    })
  }
}
