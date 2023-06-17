import { Mock } from 'vitest'
import { BreakfastStructure } from './builder.samples'
import { BucketsSlice, CollectionActionCreator } from './slice.types'
import { OnActionError } from './types'
import { createBucketSlice } from './slice'

describe('createBucketSlice', () => {
  it('should create a bucket slice', () => {
    // act
    const onActionError = () => {}
    const slice = createBucketSlice<'breakfasts', BreakfastStructure>('breakfasts', { onActionError })

    // assert
    expect(slice).toContainKeys(['name', 'getInitialState', 'reducer', 'bucketActions', 'collectionActions'])
  })

  it('should create a bucket slice with the correct name', () => {
    // act
    const onActionError = () => {}
    const slice = createBucketSlice<'breakfasts', BreakfastStructure>('breakfasts', { onActionError })

    // assert
    expect(slice.name).toBe('breakfasts')
  })

  it('should create a bucket slice with the empty initial state', () => {
    // act
    const onActionError = () => {}
    const { getInitialState } = createBucketSlice<'breakfasts', BreakfastStructure>('breakfasts', { onActionError })

    // assert
    expect(getInitialState()).toEqual({
      ids: [],
      buckets: {},
    })
  })

  it('should create a bucket slice with the given initial state', () => {
    // act
    const onActionError = () => {}
    const initialState = {
      ids: ['b0001'],
      buckets: {
        b0001: {
          entity: { id: 'b0001', rev: 0, time: '08:00' },
          collections: {},
        },
      },
    }
    const { getInitialState } = createBucketSlice<'breakfasts', BreakfastStructure>('breakfasts', {
      onActionError,
      initialState,
    })

    // assert
    expect(getInitialState()).toEqual(initialState)
  })

  it('should create a bucket slice with the correct reducer', () => {
    // act
    const onActionError = () => {}
    const { reducer } = createBucketSlice<'breakfasts', BreakfastStructure>('breakfasts', { onActionError })

    // assert
    expect(reducer).toBeInstanceOf(Function)
  })

  describe('bucketActions', () => {
    let slice: BucketsSlice<'breakfasts', BreakfastStructure>
    let onActionError: Mock<Parameters<OnActionError>>

    beforeEach(() => {
      onActionError = vitest.fn()
      slice = createBucketSlice('breakfasts', { onActionError })
    })

    it.each`
      actionName
      ${'addBucket'}
      ${'updateBucketDocument'}
      ${'deleteBucket'}
      ${'clear'}
    `('should have action creator $actionName with matching type', ({ actionName }) => {
      // arrange
      const { bucketActions } = slice

      // act
      const actionCreator = bucketActions[actionName as keyof typeof bucketActions]

      // assert
      expect(actionCreator).toBeInstanceOf(Function)
      expect(actionCreator).toContainEntry(['type', `${slice.name}/${actionName}`])
    })

    describe('addBucket', () => {
      it('should add first bucket', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const document = { id: 'b0001', rev: 0, time: '08:00' }
        const action = bucketActions.addBucket({ document })

        const expectedState = {
          ids: ['b0001'],
          buckets: {
            b0001: {
              entity: { id: 'b0001', rev: 0, time: '08:00' },
              collections: {},
            },
          },
        }

        // act
        const state1 = reducer(state0, action)

        // assert
        expect(state1).toEqual(expectedState)
      })

      it('should add next bucket', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const document1 = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document: document1 })
        const state1 = reducer(state0, action1)

        const document2 = { id: 'b0002', rev: 0, time: '09:00' }
        const action2 = bucketActions.addBucket({ document: document2 })

        const expectedState = {
          ids: ['b0001', 'b0002'],
          buckets: {
            b0001: {
              entity: { id: 'b0001', rev: 0, time: '08:00' },
              collections: {},
            },
            b0002: {
              entity: { id: 'b0002', rev: 0, time: '09:00' },
              collections: {},
            },
          },
        }

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toEqual(expectedState)
      })

      it('should skip if document id is already used', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const document = { id: 'b0001', rev: 0, time: '08:00' }
        const action = bucketActions.addBucket({ document })
        const state1 = reducer(state0, action)

        // act
        const state2 = reducer(state1, action)

        // assert
        expect(state2).toBe(state1)
      })

      it('should log error if document id is already used', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const document = { id: 'b0001', rev: 0, time: '08:00' }
        const action = bucketActions.addBucket({ document })
        const state1 = reducer(state0, action)

        // act
        reducer(state1, action)

        // assert
        expect(onActionError).toHaveBeenCalledWith(action, "document id 'b0001' already used")
      })
    })

    describe('updateBucketDocument', () => {
      it('should update document of an existing bucket', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const document = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document })
        const state1 = reducer(state0, action1)

        const documentUpdate = { ...document, rev: 1, time: '08:10' }
        const action2 = bucketActions.updateBucketDocument({ document: documentUpdate })

        const expectedState = {
          ids: ['b0001'],
          buckets: {
            b0001: {
              entity: { id: 'b0001', rev: 1, time: '08:10' },
              collections: {},
            },
          },
        }

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toEqual(expectedState)
      })

      it('should skip if document id is unknown', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const document = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document })
        const state1 = reducer(state0, action1)

        const documentUpdate = { ...document, id: 'b-unknown', rev: 1, time: '08:10' }
        const action2 = bucketActions.updateBucketDocument({ document: documentUpdate })

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toBe(state1)
      })

      it('should log error if document id is unknown', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const document = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document })
        const state1 = reducer(state0, action1)

        const documentUpdate = { ...document, id: 'b-unknown', rev: 1, time: '08:10' }
        const action2 = bucketActions.updateBucketDocument({ document: documentUpdate })

        // act
        reducer(state1, action2)

        // assert
        expect(onActionError).toHaveBeenCalledWith(action2, "document id 'b-unknown' does not exist")
      })
    })

    describe('deleteBucket', () => {
      it('should delete last existing bucket', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const document = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document })
        const state1 = reducer(state0, action1)

        const action2 = bucketActions.deleteBucket({ bucketId: 'b0001' })

        const expectedState = {
          ids: [],
          buckets: {},
        }

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toEqual(expectedState)
      })

      it('should delete one of many existing buckets', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const document1 = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document: document1 })
        const state1 = reducer(state0, action1)

        const document2 = { id: 'b0002', rev: 0, time: '09:00' }
        const action2 = bucketActions.addBucket({ document: document2 })
        const state2 = reducer(state1, action2)

        const action3 = bucketActions.deleteBucket({ bucketId: 'b0001' })

        const expectedState = {
          ids: ['b0002'],
          buckets: {
            b0002: {
              entity: { id: 'b0002', rev: 0, time: '09:00' },
              collections: {},
            },
          },
        }

        // act
        const state3 = reducer(state2, action3)

        // assert
        expect(state3).toEqual(expectedState)
      })

      it('should skip if document id is unknown', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const document = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document })
        const state1 = reducer(state0, action1)

        const action2 = bucketActions.deleteBucket({ bucketId: 'b-unknown' })

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toBe(state1)
      })

      it('should log error if document id is unknown', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const document = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document })
        const state1 = reducer(state0, action1)

        const action2 = bucketActions.deleteBucket({ bucketId: 'b-unknown' })

        // act
        reducer(state1, action2)

        // assert
        expect(onActionError).toHaveBeenCalledWith(action2, "document id 'b-unknown' does not exist")
      })
    })

    describe('clear', () => {
      it('should remove all existing buckets', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument1 = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document: bucketDocument1 })
        const state1 = reducer(state0, action1)

        const bucketDocument2 = { id: 'b0002', rev: 0, time: '09:00' }
        const action2 = bucketActions.addBucket({ document: bucketDocument2 })
        const state2 = reducer(state1, action2)

        const drinkActions = slice.collectionActions('drinks')
        const collectionDocument1 = { id: 'd0001', rev: 0, name: 'coffee' }
        const action3 = drinkActions.addCollectionDocument({ bucketId: 'b0001', document: collectionDocument1 })
        const state3 = reducer(state2, action3)

        const action4 = bucketActions.clear()

        const expectedState = {
          ids: [],
          buckets: {},
        }

        // act
        const state4 = reducer(state3, action4)

        // assert
        expect(state4).toEqual(expectedState)
      })

      it('should not change the state if still empty', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const action = bucketActions.clear()

        // act
        const state1 = reducer(state0, action)

        // assert
        expect(state1).toBe(state0)
      })

      it('should not change the state if already empty', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument1 = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document: bucketDocument1 })
        const state1 = reducer(state0, action1)

        const action2 = bucketActions.deleteBucket({ bucketId: 'b0001' })
        const state2 = reducer(state1, action2)

        const action3 = bucketActions.clear()

        // act
        const state3 = reducer(state2, action3)

        // assert
        expect(state3).toBe(state2)
      })
    })
  })

  describe('collectionActions', () => {
    let slice: BucketsSlice<'breakfasts', BreakfastStructure>
    let onActionError: Mock<Parameters<OnActionError>>
    let drinksActions: CollectionActionCreator<'breakfasts', BreakfastStructure, 'drinks'>
    let foodsActions: CollectionActionCreator<'breakfasts', BreakfastStructure, 'foods'>

    beforeEach(() => {
      onActionError = vitest.fn()
      slice = createBucketSlice('breakfasts', { onActionError })
      drinksActions = slice.collectionActions('drinks')
      foodsActions = slice.collectionActions('foods')
    })

    it.each`
      actionName
      ${'addCollectionDocument'}
      ${'updateCollectionDocument'}
      ${'deleteCollectionDocument'}
    `('should have action creator $actionName with matching type', ({ actionName }) => {
      // act
      const actionCreator = drinksActions[actionName as keyof typeof drinksActions]

      // assert
      expect(actionCreator).toBeInstanceOf(Function)
      expect(actionCreator).toContainEntry(['type', `${slice.name}/${actionName}`])
    })

    describe('addCollectionDocument', () => {
      it('should add first collection document', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document: bucketDocument })
        const state1 = reducer(state0, action1)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = drinksActions.addCollectionDocument({ bucketId: 'b0001', document: collectionDocument })

        const expectedState = {
          ids: ['b0001'],
          buckets: {
            b0001: {
              entity: { id: 'b0001', rev: 0, time: '08:00' },
              collections: {
                drinks: {
                  ids: ['d0001'],
                  entities: {
                    d0001: { id: 'd0001', rev: 0, name: 'coffee' },
                  },
                },
              },
            },
          },
        }

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toEqual(expectedState)
      })

      it('should add next collection document', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document: bucketDocument })
        const state1 = reducer(state0, action1)

        const collectionDocument1 = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = drinksActions.addCollectionDocument({ bucketId: 'b0001', document: collectionDocument1 })
        const state2 = reducer(state1, action2)

        const collectionDocument2 = { id: 'd0002', rev: 0, name: 'tea' }
        const action3 = drinksActions.addCollectionDocument({ bucketId: 'b0001', document: collectionDocument2 })

        const expectedState = {
          ids: ['b0001'],
          buckets: {
            b0001: {
              entity: { id: 'b0001', rev: 0, time: '08:00' },
              collections: {
                drinks: {
                  ids: ['d0001', 'd0002'],
                  entities: {
                    d0001: { id: 'd0001', rev: 0, name: 'coffee' },
                    d0002: { id: 'd0002', rev: 0, name: 'tea' },
                  },
                },
              },
            },
          },
        }

        // act
        const state3 = reducer(state2, action3)

        // assert
        expect(state3).toEqual(expectedState)
      })

      it('should skip if bucket id is unknown', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document: bucketDocument })
        const state1 = reducer(state0, action1)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = drinksActions.addCollectionDocument({ bucketId: 'b-unknown', document: collectionDocument })

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toBe(state1)
      })

      it('should log error if bucket id is unknown', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document: bucketDocument })
        const state1 = reducer(state0, action1)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = drinksActions.addCollectionDocument({ bucketId: 'b-unknown', document: collectionDocument })

        // act
        reducer(state1, action2)

        // assert
        expect(onActionError).toHaveBeenCalledWith(action2, "bucket id 'b-unknown' does not exist")
      })

      it('should skip if document id is already used', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document: bucketDocument })
        const state1 = reducer(state0, action1)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = drinksActions.addCollectionDocument({ bucketId: 'b0001', document: collectionDocument })
        const state2 = reducer(state1, action2)

        // act
        const state3 = reducer(state2, action2)

        // assert
        expect(state3).toBe(state2)
      })

      it('should log error if document id is already used', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document: bucketDocument })
        const state1 = reducer(state0, action1)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = drinksActions.addCollectionDocument({ bucketId: 'b0001', document: collectionDocument })
        const state2 = reducer(state1, action2)

        // act
        reducer(state2, action2)

        // assert
        expect(onActionError).toHaveBeenCalledWith(action2, "document id 'd0001' already used")
      })

      it('should add documents in different collections', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document: bucketDocument })
        const state1 = reducer(state0, action1)

        const collectionDocument1 = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = drinksActions.addCollectionDocument({ bucketId: 'b0001', document: collectionDocument1 })
        const state2 = reducer(state1, action2)

        const collectionDocument2 = { id: 'f0001', rev: 0, name: 'bread' }
        const action3 = foodsActions.addCollectionDocument({ bucketId: 'b0001', document: collectionDocument2 })

        const expectedState = {
          ids: ['b0001'],
          buckets: {
            b0001: {
              entity: { id: 'b0001', rev: 0, time: '08:00' },
              collections: {
                drinks: {
                  ids: ['d0001'],
                  entities: {
                    d0001: { id: 'd0001', rev: 0, name: 'coffee' },
                  },
                },
                foods: {
                  ids: ['f0001'],
                  entities: {
                    f0001: { id: 'f0001', rev: 0, name: 'bread' },
                  },
                },
              },
            },
          },
        }

        // act
        const state3 = reducer(state2, action3)

        // assert
        expect(state3).toEqual(expectedState)
      })
    })

    describe('updateCollectionDocument', () => {
      it('should update an existing collection document', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document: bucketDocument })
        const state1 = reducer(state0, action1)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = drinksActions.addCollectionDocument({ bucketId: 'b0001', document: collectionDocument })
        const state2 = reducer(state1, action2)

        const collectionDocumentUpdate = { ...collectionDocument, rev: 1, name: 'espresso' }
        const action3 = drinksActions.updateCollectionDocument({
          bucketId: 'b0001',
          document: collectionDocumentUpdate,
        })

        const expectedState = {
          ids: ['b0001'],
          buckets: {
            b0001: {
              entity: { id: 'b0001', rev: 0, time: '08:00' },
              collections: {
                drinks: {
                  ids: ['d0001'],
                  entities: {
                    d0001: { id: 'd0001', rev: 1, name: 'espresso' },
                  },
                },
              },
            },
          },
        }

        // act
        const state3 = reducer(state2, action3)

        // assert
        expect(state3).toEqual(expectedState)
      })

      it('should skip if bucket id is unknown', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document: bucketDocument })
        const state1 = reducer(state0, action1)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = drinksActions.updateCollectionDocument({ bucketId: 'b-unknown', document: collectionDocument })

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toBe(state1)
      })

      it('should log error if bucket id is unknown', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document: bucketDocument })
        const state1 = reducer(state0, action1)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = drinksActions.updateCollectionDocument({ bucketId: 'b-unknown', document: collectionDocument })

        // act
        reducer(state1, action2)

        // assert
        expect(onActionError).toHaveBeenCalledWith(action2, "bucket id 'b-unknown' does not exist")
      })

      it('should skip if collection is empty', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document: bucketDocument })
        const state1 = reducer(state0, action1)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = drinksActions.updateCollectionDocument({ bucketId: 'b0001', document: collectionDocument })

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toBe(state1)
      })

      it('should log error if collection is empty', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document: bucketDocument })
        const state1 = reducer(state0, action1)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = drinksActions.updateCollectionDocument({ bucketId: 'b0001', document: collectionDocument })

        // act
        reducer(state1, action2)

        // assert
        expect(onActionError).toHaveBeenCalledWith(action2, "document id 'd0001' does not exist")
      })

      it('should skip if document id is unknown', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document: bucketDocument })
        const state1 = reducer(state0, action1)

        const collectionDocument2 = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = drinksActions.updateCollectionDocument({ bucketId: 'b0001', document: collectionDocument2 })
        const state2 = reducer(state1, action2)

        const collectionDocument3 = { id: 'd-unknown', rev: 0, name: 'espresso' }
        const action3 = drinksActions.updateCollectionDocument({ bucketId: 'b0001', document: collectionDocument3 })

        // act
        const state3 = reducer(state2, action3)

        // assert
        expect(state3).toBe(state2)
      })

      it('should log error if document id is unknown', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document: bucketDocument })
        const state1 = reducer(state0, action1)

        const collectionDocument2 = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = drinksActions.updateCollectionDocument({ bucketId: 'b0001', document: collectionDocument2 })
        const state2 = reducer(state1, action2)

        const collectionDocument3 = { id: 'd-unknown', rev: 0, name: 'espresso' }
        const action3 = drinksActions.updateCollectionDocument({ bucketId: 'b0001', document: collectionDocument3 })

        // act
        reducer(state2, action3)

        // assert
        expect(onActionError).toHaveBeenCalledWith(action3, "document id 'd-unknown' does not exist")
      })
    })

    describe('deleteCollectionDocument', () => {
      it('should delete last collection document of a collection with one document', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const bucketAction = bucketActions.addBucket({ document: bucketDocument })
        const state1 = reducer(state0, bucketAction)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const collectionAction = drinksActions.addCollectionDocument({
          bucketId: 'b0001',
          document: collectionDocument,
        })
        const state2 = reducer(state1, collectionAction)

        const action = drinksActions.deleteCollectionDocument({ bucketId: 'b0001', id: 'd0001' })

        const expectedState = {
          ids: ['b0001'],
          buckets: {
            b0001: {
              entity: { id: 'b0001', rev: 0, time: '08:00' },
              collections: {
                drinks: {
                  ids: [],
                  entities: {},
                },
              },
            },
          },
        }

        // act
        const state3 = reducer(state2, action)

        // assert
        expect(state3).toEqual(expectedState)
      })

      it('should delete one of many collection documents of a collection with many documents', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument1 = { id: 'b0001', rev: 0, time: '08:00' }
        const bucketAction1 = bucketActions.addBucket({ document: bucketDocument1 })
        const state1 = reducer(state0, bucketAction1)

        const collectionDocument1 = { id: 'd0001', rev: 0, name: 'coffee' }
        const collectionAction1 = drinksActions.addCollectionDocument({
          bucketId: 'b0001',
          document: collectionDocument1,
        })
        const state2 = reducer(state1, collectionAction1)

        const collectionDocument2 = { id: 'd0002', rev: 0, name: 'tea' }
        const collectionAction2 = drinksActions.addCollectionDocument({
          bucketId: 'b0001',
          document: collectionDocument2,
        })
        const state3 = reducer(state2, collectionAction2)

        const action4 = drinksActions.deleteCollectionDocument({ bucketId: 'b0001', id: 'd0001' })

        const expectedState = {
          ids: ['b0001'],
          buckets: {
            b0001: {
              entity: { id: 'b0001', rev: 0, time: '08:00' },
              collections: {
                drinks: {
                  ids: ['d0002'],
                  entities: {
                    d0002: { id: 'd0002', rev: 0, name: 'tea' },
                  },
                },
              },
            },
          },
        }

        // act
        const state4 = reducer(state3, action4)

        // assert
        expect(state4).toEqual(expectedState)
      })

      it('should skip if bucket id is unknown', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document: bucketDocument })
        const state1 = reducer(state0, action1)

        const action2 = drinksActions.deleteCollectionDocument({ bucketId: 'b-unknown', id: 'd0001' })

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toBe(state1)
      })

      it('should log error if bucket id is unknown', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = bucketActions.addBucket({ document: bucketDocument })
        const state1 = reducer(state0, action1)

        const action2 = drinksActions.deleteCollectionDocument({ bucketId: 'b-unknown', id: 'd0001' })

        // act
        reducer(state1, action2)

        // assert
        expect(onActionError).toHaveBeenCalledWith(action2, "bucket id 'b-unknown' does not exist")
      })

      it('should skip if collection is empty', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketAction = bucketActions.addBucket({ document: { id: 'b0001', rev: 0, time: '08:00' } })
        const state1 = reducer(state0, bucketAction)

        const action2 = drinksActions.deleteCollectionDocument({ bucketId: 'b0001', id: 'd0001' })

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toBe(state1)
      })

      it('should log error if collection is empty', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketAction = bucketActions.addBucket({ document: { id: 'b0001', rev: 0, time: '08:00' } })
        const state1 = reducer(state0, bucketAction)

        const action2 = drinksActions.deleteCollectionDocument({ bucketId: 'b0001', id: 'd0001' })

        // act
        reducer(state1, action2)

        // assert
        expect(onActionError).toHaveBeenCalledWith(action2, "document id 'd0001' does not exist")
      })

      it('should skip if document id is unknown', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const bucketAction = bucketActions.addBucket({ document: bucketDocument })
        const state1 = reducer(state0, bucketAction)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const collectionAction = drinksActions.addCollectionDocument({
          bucketId: 'b0001',
          document: collectionDocument,
        })
        const state2 = reducer(state1, collectionAction)

        const action3 = drinksActions.deleteCollectionDocument({ bucketId: 'b0001', id: 'd-unknown' })

        // act
        const state3 = reducer(state2, action3)

        // assert
        expect(state3).toBe(state2)
      })

      it('should log error if document id is unknown', () => {
        // arrange
        const { reducer, bucketActions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const bucketAction = bucketActions.addBucket({ document: bucketDocument })
        const state1 = reducer(state0, bucketAction)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const collectionAction = drinksActions.addCollectionDocument({
          bucketId: 'b0001',
          document: collectionDocument,
        })
        const state2 = reducer(state1, collectionAction)

        const action3 = drinksActions.deleteCollectionDocument({ bucketId: 'b0001', id: 'd-unknown' })

        // act
        reducer(state2, action3)

        // assert
        expect(onActionError).toHaveBeenCalledWith(action3, "document id 'd-unknown' does not exist")
      })
    })
  })
})
