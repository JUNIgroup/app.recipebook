import { Mock } from 'vitest'
import { BreakfastStructure } from './builder.samples'
import { BucketsSlice } from './slice.types'
import { OnActionError } from './types'
import { createBucketsSlice } from './slice'

describe('createBucketSlice', () => {
  it('should create a bucket slice', () => {
    // act
    const onActionError = () => {}
    const slice = createBucketsSlice<'breakfasts', BreakfastStructure>('breakfasts', { onActionError })

    // assert
    expect(slice).toContainKeys(['sliceName', 'getInitialState', 'reducer', 'actions'])
  })

  it('should create a bucket slice with the correct name', () => {
    // act
    const onActionError = () => {}
    const slice = createBucketsSlice<'breakfasts', BreakfastStructure>('breakfasts', { onActionError })

    // assert
    expect(slice.sliceName).toBe('breakfasts')
  })

  it('should create a bucket slice with the empty initial state', () => {
    // act
    const onActionError = () => {}
    const { getInitialState } = createBucketsSlice<'breakfasts', BreakfastStructure>('breakfasts', { onActionError })

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
    const { getInitialState } = createBucketsSlice<'breakfasts', BreakfastStructure>('breakfasts', {
      onActionError,
      initialState,
    })

    // assert
    expect(getInitialState()).toEqual(initialState)
  })

  it('should create a bucket slice with the correct reducer', () => {
    // act
    const onActionError = () => {}
    const { reducer } = createBucketsSlice<'breakfasts', BreakfastStructure>('breakfasts', { onActionError })

    // assert
    expect(reducer).toBeInstanceOf(Function)
  })

  describe('actions', () => {
    let slice: BucketsSlice<'breakfasts', BreakfastStructure>
    let onActionError: Mock<Parameters<OnActionError>>

    beforeEach(() => {
      onActionError = vitest.fn()
      slice = createBucketsSlice('breakfasts', { onActionError })
    })

    it.each`
      actionName
      ${'addBucket'}
      ${'updateBucketDocument'}
      ${'upsertBuckets'}
      ${'deleteBucket'}
      ${'addCollectionDocument'}
      ${'updateCollectionDocument'}
      ${'upsertCollection'}
      ${'deleteCollectionDocument'}
      ${'clear'}
    `('should have action creator $actionName with matching type', ({ actionName }) => {
      // arrange
      const { actions } = slice

      // act
      const actionCreator = actions[actionName as keyof typeof actions]

      // assert
      expect(actionCreator).toBeInstanceOf(Function)
      expect(actionCreator).toContainEntry(['type', `${slice.sliceName}/${actionName}`])
    })

    describe('addBucket', () => {
      it('should add first bucket', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const document = { id: 'b0001', rev: 0, time: '08:00' }
        const action = actions.addBucket({ document })

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
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const document1 = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.addBucket({ document: document1 })
        const state1 = reducer(state0, action1)

        const document2 = { id: 'b0002', rev: 0, time: '09:00' }
        const action2 = actions.addBucket({ document: document2 })

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
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const document = { id: 'b0001', rev: 0, time: '08:00' }
        const action = actions.addBucket({ document })
        const state1 = reducer(state0, action)

        // act
        const state2 = reducer(state1, action)

        // assert
        expect(state2).toBe(state1)
      })

      it('should log error if document id is already used', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const document = { id: 'b0001', rev: 0, time: '08:00' }
        const action = actions.addBucket({ document })
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
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const document = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [document] })
        const state1 = reducer(state0, action1)

        const documentUpdate = { ...document, rev: 1, time: '08:10' }
        const action2 = actions.updateBucketDocument({ document: documentUpdate })

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
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const document = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [document] })
        const state1 = reducer(state0, action1)

        const documentUpdate = { ...document, id: 'b-unknown', rev: 1, time: '08:10' }
        const action2 = actions.updateBucketDocument({ document: documentUpdate })

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toBe(state1)
      })

      it('should log error if document id is unknown', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const document = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [document] })
        const state1 = reducer(state0, action1)

        const documentUpdate = { ...document, id: 'b-unknown', rev: 1, time: '08:10' }
        const action2 = actions.updateBucketDocument({ document: documentUpdate })

        // act
        reducer(state1, action2)

        // assert
        expect(onActionError).toHaveBeenCalledWith(action2, "document id 'b-unknown' does not exist")
      })
    })

    describe('upsertBuckets', () => {
      it('should add first bucket', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const document = { id: 'b0001', rev: 0, time: '08:00' }
        const action = actions.upsertBuckets({ documents: [document] })

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
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const document1 = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [document1] })
        const state1 = reducer(state0, action1)

        const document2 = { id: 'b0002', rev: 0, time: '09:00' }
        const action2 = actions.upsertBuckets({ documents: [document2] })

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

      it('should add multiple buckets', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const document1 = { id: 'b0001', rev: 0, time: '08:00' }
        const document2 = { id: 'b0002', rev: 0, time: '09:00' }
        const action1 = actions.upsertBuckets({ documents: [document1, document2] })

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
        const state1 = reducer(state0, action1)

        // assert
        expect(state1).toEqual(expectedState)
      })

      it('should handle multiple documents with same ID', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const document1 = { id: 'b0001', rev: 0, time: '08:00' }
        const document2 = { id: 'b0001', rev: 1, time: '09:00' }
        const action1 = actions.upsertBuckets({ documents: [document1, document2] })

        const expectedState = {
          ids: ['b0001'],
          buckets: {
            b0001: {
              entity: { id: 'b0001', rev: 1, time: '09:00' },
              collections: {},
            },
          },
        }

        // act
        const state1 = reducer(state0, action1)

        // assert
        expect(state1).toEqual(expectedState)
      })
    })

    describe('deleteBucket', () => {
      it('should delete last existing bucket', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const document = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [document] })
        const state1 = reducer(state0, action1)

        const action2 = actions.deleteBucket({ bucketId: 'b0001' })

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
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const document1 = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.addBucket({ document: document1 })
        const state1 = reducer(state0, action1)

        const document2 = { id: 'b0002', rev: 0, time: '09:00' }
        const action2 = actions.addBucket({ document: document2 })
        const state2 = reducer(state1, action2)

        const action3 = actions.deleteBucket({ bucketId: 'b0001' })

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
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const document = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [document] })
        const state1 = reducer(state0, action1)

        const action2 = actions.deleteBucket({ bucketId: 'b-unknown' })

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toBe(state1)
      })

      it('should log error if document id is unknown', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const document = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [document] })
        const state1 = reducer(state0, action1)

        const action2 = actions.deleteBucket({ bucketId: 'b-unknown' })

        // act
        reducer(state1, action2)

        // assert
        expect(onActionError).toHaveBeenCalledWith(action2, "document id 'b-unknown' does not exist")
      })
    })

    describe('addCollectionDocument', () => {
      it('should add first collection document', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = actions.addCollectionDocument({
          bucketId: 'b0001',
          collectionName: 'drinks',
          document: collectionDocument,
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
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const collectionDocument1 = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = actions.addCollectionDocument({
          bucketId: 'b0001',
          collectionName: 'drinks',
          document: collectionDocument1,
        })
        const state2 = reducer(state1, action2)

        const collectionDocument2 = { id: 'd0002', rev: 0, name: 'tea' }
        const action3 = actions.addCollectionDocument({
          bucketId: 'b0001',
          collectionName: 'drinks',
          document: collectionDocument2,
        })

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
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = actions.addCollectionDocument({
          bucketId: 'b-unknown',
          collectionName: 'drinks',
          document: collectionDocument,
        })

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toBe(state1)
      })

      it('should log error if bucket id is unknown', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = actions.addCollectionDocument({
          bucketId: 'b-unknown',
          collectionName: 'drinks',
          document: collectionDocument,
        })

        // act
        reducer(state1, action2)

        // assert
        expect(onActionError).toHaveBeenCalledWith(action2, "bucket id 'b-unknown' does not exist")
      })

      it('should skip if document id is already used', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = actions.addCollectionDocument({
          bucketId: 'b0001',
          collectionName: 'drinks',
          document: collectionDocument,
        })
        const state2 = reducer(state1, action2)

        // act
        const state3 = reducer(state2, action2)

        // assert
        expect(state3).toBe(state2)
      })

      it('should log error if document id is already used', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = actions.addCollectionDocument({
          bucketId: 'b0001',
          collectionName: 'drinks',
          document: collectionDocument,
        })
        const state2 = reducer(state1, action2)

        // act
        reducer(state2, action2)

        // assert
        expect(onActionError).toHaveBeenCalledWith(action2, "document id 'd0001' already used")
      })

      it('should add documents in different collections', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const collectionDocument1 = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = actions.addCollectionDocument({
          bucketId: 'b0001',
          collectionName: 'drinks',
          document: collectionDocument1,
        })
        const state2 = reducer(state1, action2)

        const collectionDocument2 = { id: 'f0001', rev: 0, name: 'bread' }
        const action3 = actions.addCollectionDocument({
          bucketId: 'b0001',
          collectionName: 'foods',
          document: collectionDocument2,
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
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = actions.upsertCollection({
          bucketId: 'b0001',
          collectionName: 'drinks',
          documents: [collectionDocument],
        })
        const state2 = reducer(state1, action2)

        const collectionDocumentUpdate = { ...collectionDocument, rev: 1, name: 'espresso' }
        const action3 = actions.updateCollectionDocument({
          bucketId: 'b0001',
          collectionName: 'drinks',
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
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = actions.updateCollectionDocument({
          bucketId: 'b-unknown',
          collectionName: 'drinks',
          document: collectionDocument,
        })

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toBe(state1)
      })

      it('should log error if bucket id is unknown', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = actions.updateCollectionDocument({
          bucketId: 'b-unknown',
          collectionName: 'drinks',
          document: collectionDocument,
        })

        // act
        reducer(state1, action2)

        // assert
        expect(onActionError).toHaveBeenCalledWith(action2, "bucket id 'b-unknown' does not exist")
      })

      it('should skip if collection is empty', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = actions.updateCollectionDocument({
          bucketId: 'b0001',
          collectionName: 'drinks',
          document: collectionDocument,
        })

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toBe(state1)
      })

      it('should log error if collection is empty', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = actions.updateCollectionDocument({
          bucketId: 'b0001',
          collectionName: 'drinks',
          document: collectionDocument,
        })

        // act
        reducer(state1, action2)

        // assert
        expect(onActionError).toHaveBeenCalledWith(action2, "document id 'd0001' does not exist")
      })

      it('should skip if document id is unknown', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const collectionDocument2 = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = actions.updateCollectionDocument({
          bucketId: 'b0001',
          collectionName: 'drinks',
          document: collectionDocument2,
        })
        const state2 = reducer(state1, action2)

        const collectionDocument3 = { id: 'd-unknown', rev: 0, name: 'espresso' }
        const action3 = actions.updateCollectionDocument({
          bucketId: 'b0001',
          collectionName: 'drinks',
          document: collectionDocument3,
        })

        // act
        const state3 = reducer(state2, action3)

        // assert
        expect(state3).toBe(state2)
      })

      it('should log error if document id is unknown', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const collectionDocument2 = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = actions.updateCollectionDocument({
          bucketId: 'b0001',
          collectionName: 'drinks',
          document: collectionDocument2,
        })
        const state2 = reducer(state1, action2)

        const collectionDocument3 = { id: 'd-unknown', rev: 0, name: 'espresso' }
        const action3 = actions.updateCollectionDocument({
          bucketId: 'b0001',
          collectionName: 'drinks',
          document: collectionDocument3,
        })

        // act
        reducer(state2, action3)

        // assert
        expect(onActionError).toHaveBeenCalledWith(action3, "document id 'd-unknown' does not exist")
      })
    })

    describe('upsertCollection', () => {
      it('should add first collection document', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = actions.upsertCollection({
          bucketId: 'b0001',
          collectionName: 'drinks',
          documents: [collectionDocument],
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
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const collectionDocument1 = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = actions.upsertCollection({
          bucketId: 'b0001',
          collectionName: 'drinks',
          documents: [collectionDocument1],
        })
        const state2 = reducer(state1, action2)

        const collectionDocument2 = { id: 'd0002', rev: 0, name: 'tea' }
        const action3 = actions.upsertCollection({
          bucketId: 'b0001',
          collectionName: 'drinks',
          documents: [collectionDocument2],
        })

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

      it('should add multiple documents', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const collectionDocument1 = { id: 'd0001', rev: 0, name: 'coffee' }
        const collectionDocument2 = { id: 'd0002', rev: 0, name: 'tea' }
        const action2 = actions.upsertCollection({
          bucketId: 'b0001',
          collectionName: 'drinks',
          documents: [collectionDocument1, collectionDocument2],
        })

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
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toEqual(expectedState)
      })

      it('should handle multiple documents with same ID', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const collectionDocument1 = { id: 'd0001', rev: 0, name: 'coffee' }
        const collectionDocument2 = { id: 'd0001', rev: 1, name: 'tea' }
        const action2 = actions.upsertCollection({
          bucketId: 'b0001',
          collectionName: 'drinks',
          documents: [collectionDocument1, collectionDocument2],
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
                    d0001: { id: 'd0001', rev: 1, name: 'tea' },
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

      it('should skip if bucket id is unknown', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = actions.upsertCollection({
          bucketId: 'b-unknown',
          collectionName: 'drinks',
          documents: [collectionDocument],
        })

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toBe(state1)
      })

      it('should log error if bucket id is unknown', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = actions.upsertCollection({
          bucketId: 'b-unknown',
          collectionName: 'drinks',
          documents: [collectionDocument],
        })

        // act
        reducer(state1, action2)

        // assert
        expect(onActionError).toHaveBeenCalledWith(action2, "bucket id 'b-unknown' does not exist")
      })

      it('should log error if bucket id is unknown, even for zero documents', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const action2 = actions.upsertCollection({
          bucketId: 'b-unknown',
          collectionName: 'drinks',
          documents: [],
        })

        // act
        reducer(state1, action2)

        // assert
        expect(onActionError).toHaveBeenCalledWith(action2, "bucket id 'b-unknown' does not exist")
      })

      it('should add documents in different collections', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const collectionDocument1 = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = actions.upsertCollection({
          bucketId: 'b0001',
          collectionName: 'drinks',
          documents: [collectionDocument1],
        })
        const state2 = reducer(state1, action2)

        const collectionDocument2 = { id: 'f0001', rev: 0, name: 'bread' }
        const action3 = actions.upsertCollection({
          bucketId: 'b0001',
          collectionName: 'foods',
          documents: [collectionDocument2],
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

    describe('deleteCollectionDocument', () => {
      it('should delete last collection document of a collection with one document', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const bucketAction = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, bucketAction)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const collectionAction = actions.upsertCollection({
          bucketId: 'b0001',
          collectionName: 'drinks',
          documents: [collectionDocument],
        })
        const state2 = reducer(state1, collectionAction)

        const action = actions.deleteCollectionDocument({ bucketId: 'b0001', collectionName: 'drinks', id: 'd0001' })

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
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const bucketAction1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, bucketAction1)

        const collectionDocument1 = { id: 'd0001', rev: 0, name: 'coffee' }
        const collectionDocument2 = { id: 'd0002', rev: 0, name: 'tea' }
        const collectionAction2 = actions.upsertCollection({
          bucketId: 'b0001',
          collectionName: 'drinks',
          documents: [collectionDocument1, collectionDocument2],
        })
        const state2 = reducer(state1, collectionAction2)

        const action3 = actions.deleteCollectionDocument({ bucketId: 'b0001', collectionName: 'drinks', id: 'd0001' })

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
        const state3 = reducer(state2, action3)

        // assert
        expect(state3).toEqual(expectedState)
      })

      it('should skip if bucket id is unknown', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const action2 = actions.deleteCollectionDocument({
          bucketId: 'b-unknown',
          collectionName: 'drinks',
          id: 'd0001',
        })

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toBe(state1)
      })

      it('should log error if bucket id is unknown', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const action2 = actions.deleteCollectionDocument({
          bucketId: 'b-unknown',
          collectionName: 'drinks',
          id: 'd0001',
        })

        // act
        reducer(state1, action2)

        // assert
        expect(onActionError).toHaveBeenCalledWith(action2, "bucket id 'b-unknown' does not exist")
      })

      it('should skip if collection is empty', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const bucketAction = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, bucketAction)

        const action2 = actions.deleteCollectionDocument({ bucketId: 'b0001', collectionName: 'drinks', id: 'd0001' })

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toBe(state1)
      })

      it('should log error if collection is empty', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const bucketAction = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, bucketAction)

        const action2 = actions.deleteCollectionDocument({ bucketId: 'b0001', collectionName: 'drinks', id: 'd0001' })

        // act
        reducer(state1, action2)

        // assert
        expect(onActionError).toHaveBeenCalledWith(action2, "document id 'd0001' does not exist")
      })

      it('should skip if document id is unknown', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const bucketAction = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, bucketAction)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const collectionAction = actions.upsertCollection({
          bucketId: 'b0001',
          collectionName: 'drinks',
          documents: [collectionDocument],
        })
        const state2 = reducer(state1, collectionAction)

        const action3 = actions.deleteCollectionDocument({
          bucketId: 'b0001',
          collectionName: 'drinks',
          id: 'd-unknown',
        })

        // act
        const state3 = reducer(state2, action3)

        // assert
        expect(state3).toBe(state2)
      })

      it('should log error if document id is unknown', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const bucketAction = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, bucketAction)

        const collectionDocument = { id: 'd0001', rev: 0, name: 'coffee' }
        const collectionAction = actions.upsertCollection({
          bucketId: 'b0001',
          collectionName: 'drinks',
          documents: [collectionDocument],
        })
        const state2 = reducer(state1, collectionAction)

        const action3 = actions.deleteCollectionDocument({
          bucketId: 'b0001',
          collectionName: 'drinks',
          id: 'd-unknown',
        })

        // act
        reducer(state2, action3)

        // assert
        expect(onActionError).toHaveBeenCalledWith(action3, "document id 'd-unknown' does not exist")
      })
    })

    describe('clear', () => {
      it('should remove all existing buckets', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument1 = { id: 'b0001', rev: 0, time: '08:00' }
        const bucketDocument2 = { id: 'b0002', rev: 0, time: '09:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument1, bucketDocument2] })
        const state1 = reducer(state0, action1)

        const collectionDocument1 = { id: 'd0001', rev: 0, name: 'coffee' }
        const action2 = actions.upsertCollection({
          bucketId: 'b0001',
          collectionName: 'drinks',
          documents: [collectionDocument1],
        })
        const state2 = reducer(state1, action2)

        const action3 = actions.clear()

        const expectedState = {
          ids: [],
          buckets: {},
        }

        // act
        const state3 = reducer(state2, action3)

        // assert
        expect(state3).toEqual(expectedState)
      })

      it('should not change the state if still empty', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const action = actions.clear()

        // act
        const state1 = reducer(state0, action)

        // assert
        expect(state1).toBe(state0)
      })

      it('should not change the state if already empty', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument1 = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument1] })
        const state1 = reducer(state0, action1)

        const action2 = actions.deleteBucket({ bucketId: 'b0001' })
        const state2 = reducer(state1, action2)

        const action3 = actions.clear()

        // act
        const state3 = reducer(state2, action3)

        // assert
        expect(state3).toBe(state2)
      })
    })
  })
})
