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
      ${'upsertBuckets'}
      ${'upsertCollection'}
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

    describe('upsertBuckets', () => {
      it('should change nothing', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const action = actions.upsertBuckets({})

        // act
        const state1 = reducer(state0, action)

        // assert
        expect(state1).toBe(state0)
      })

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

      it('should delete last bucket', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const document = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [document] })
        const state1 = reducer(state0, action1)

        const action2 = actions.upsertBuckets({ deleted: ['b0001'] })

        const expectedState = {
          ids: [],
          buckets: {},
        }

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toEqual(expectedState)
      })

      it('should delete one of many buckets', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const document1 = { id: 'b0001', rev: 0, time: '08:00' }
        const document2 = { id: 'b0002', rev: 0, time: '09:00' }
        const action1 = actions.upsertBuckets({ documents: [document1, document2] })
        const state1 = reducer(state0, action1)

        const action2 = actions.upsertBuckets({ deleted: ['b0001'] })

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
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toEqual(expectedState)
      })

      it('should delete all buckets', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const document1 = { id: 'b0001', rev: 0, time: '08:00' }
        const document2 = { id: 'b0002', rev: 0, time: '09:00' }
        const action1 = actions.upsertBuckets({ documents: [document1, document2] })
        const state1 = reducer(state0, action1)

        const action2 = actions.upsertBuckets({ deleted: ['b0001', 'b0002'] })

        const expectedState = {
          ids: [],
          buckets: {},
        }

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toEqual(expectedState)
      })

      it('should skip delete unknown bucket (no change)', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const document = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [document] })
        const state1 = reducer(state0, action1)

        const action2 = actions.upsertBuckets({ deleted: ['b-unknown'] })

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toBe(state1)
      })

      it('should skip delete unknown bucket', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const document1 = { id: 'b0001', rev: 0, time: '08:00' }
        const document2 = { id: 'b0002', rev: 0, time: '09:00' }
        const action1 = actions.upsertBuckets({ documents: [document1, document2] })
        const state1 = reducer(state0, action1)

        const action2 = actions.upsertBuckets({ deleted: ['b0001', 'b-unknown'] })

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
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toEqual(expectedState)
      })

      it('should delete added bucket', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const document1 = { id: 'b0001', rev: 0, time: '08:00' }
        const document2 = { id: 'b0002', rev: 0, time: '09:00' }
        const action1 = actions.upsertBuckets({ documents: [document1, document2], deleted: ['b0002'] })

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
        const state1 = reducer(state0, action1)

        // assert
        expect(state1).toEqual(expectedState)
      })
    })

    describe('upsertCollection', () => {
      it('should change nothing', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const action1 = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, action1)

        const action2 = actions.upsertCollection({
          bucketId: 'b0001',
          collectionName: 'drinks',
        })

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toBe(state1)
      })

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

      it('should skip if bucket id unknown', () => {
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
          deleted: ['d0002'],
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

      it('should delete last collection document', () => {
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

        const action = actions.upsertCollection({
          bucketId: 'b0001',
          collectionName: 'drinks',
          deleted: ['d0001'],
        })

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

      it('should delete one of many collection documents', () => {
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

        const action3 = actions.upsertCollection({
          bucketId: 'b0001',
          collectionName: 'drinks',
          deleted: ['d0001'],
        })

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

      it('should delete all collection documents', () => {
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

        const action3 = actions.upsertCollection({
          bucketId: 'b0001',
          collectionName: 'drinks',
          deleted: ['d0001', 'd0002'],
        })

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
        const state3 = reducer(state2, action3)

        // assert
        expect(state3).toEqual(expectedState)
      })

      it('should skip if collection is empty', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const bucketAction = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, bucketAction)

        const action2 = actions.upsertBuckets({
          bucketId: 'b0001',
          collectionName: 'drinks',
          documentIds: ['d0001'],
        })

        // act
        const state2 = reducer(state1, action2)

        // assert
        expect(state2).toBe(state1)
      })

      it('should skip delete unknown document (no change)', () => {
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

        const action3 = actions.upsertCollection({
          bucketId: 'b0001',
          collectionName: 'drinks',
          deleted: ['d-unknown'],
        })

        // act
        const state3 = reducer(state2, action3)

        // assert
        expect(state3).toBe(state2)
      })

      it('should skip delete unknown document', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const bucketAction = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, bucketAction)

        const collectionDocument1 = { id: 'd0001', rev: 0, name: 'coffee' }
        const collectionDocument2 = { id: 'd0002', rev: 0, name: 'tea' }
        const collectionAction = actions.upsertCollection({
          bucketId: 'b0001',
          collectionName: 'drinks',
          documents: [collectionDocument1, collectionDocument2],
        })
        const state2 = reducer(state1, collectionAction)

        const action3 = actions.upsertCollection({
          bucketId: 'b0001',
          collectionName: 'drinks',
          deleted: ['d-unknown', 'd0002'],
        })

        const expectedState = {
          ids: ['b0001'],
          buckets: {
            b0001: {
              entity: bucketDocument,
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
        const state3 = reducer(state2, action3)

        // assert
        expect(state3).toEqual(expectedState)
      })

      it('should delete added document', () => {
        // arrange
        const { reducer, actions, getInitialState } = slice
        const state0 = getInitialState()

        const bucketDocument = { id: 'b0001', rev: 0, time: '08:00' }
        const bucketAction = actions.upsertBuckets({ documents: [bucketDocument] })
        const state1 = reducer(state0, bucketAction)

        const collectionDocument1 = { id: 'd0001', rev: 0, name: 'coffee' }
        const collectionDocument2 = { id: 'd0002', rev: 0, name: 'tea' }

        const action2 = actions.upsertCollection({
          bucketId: 'b0001',
          collectionName: 'drinks',
          documents: [collectionDocument1, collectionDocument2],
          deleted: ['d0002'],
        })

        const expectedState = {
          ids: ['b0001'],
          buckets: {
            b0001: {
              entity: bucketDocument,
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
        const state3 = reducer(state1, action2)

        // assert
        expect(state3).toEqual(expectedState)
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

        const action2 = actions.upsertBuckets({ deleted: ['b0001'] })
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
