import { rootSelector, initialBreakfastState, Breakfast, Drink, Food } from './builder.samples'
import {
  createSelectAllBucketDocuments,
  createSelectAllBucketDocumentsSorted,
  createSelectAllCollectionDocuments,
  createSelectAllCollectionDocumentsSorted,
  createSelectBucketDocumentById,
  createSelectCollectionDocumentById,
} from './selectors'
import { reverseOrder, byString } from './orders'

describe('createSelectAllBucketDocuments', () => {
  it('should select each bucket document of all buckets', () => {
    // arrange
    const selectBreakfasts = createSelectAllBucketDocuments(rootSelector)

    // act
    const result = selectBreakfasts.resultFunc(initialBreakfastState)

    // assert
    // order: native order
    expect(result).toEqual([initialBreakfastState.buckets.b0001.entity, initialBreakfastState.buckets.b0002.entity])
  })
})

describe('createSelectAllBucketDocumentsSorted', () => {
  it('should select each bucket document of all documents sorted', () => {
    // arrange
    const order = reverseOrder(byString<Breakfast>((b) => b.time))
    const selectBreakfasts = createSelectAllBucketDocumentsSorted(rootSelector, order)
    const entities = [initialBreakfastState.buckets.b0001.entity, initialBreakfastState.buckets.b0002.entity]

    // act
    const result = selectBreakfasts.resultFunc(entities)

    // assert
    // order: b0002, b0001
    expect(result).toEqual([initialBreakfastState.buckets.b0002.entity, initialBreakfastState.buckets.b0001.entity])
  })
})

describe('createSelectBucketDocumentById', () => {
  it('should select the document of one bucket given by id', () => {
    // arrange
    const selectBreakfastById = createSelectBucketDocumentById(rootSelector)

    // act
    const result = selectBreakfastById.resultFunc(initialBreakfastState, 'b0001')

    // assert
    expect(result).toEqual(initialBreakfastState.buckets.b0001.entity)
  })

  it('should return null if select a bucket by an unknown id', () => {
    // arrange
    const selectBreakfastById = createSelectBucketDocumentById(rootSelector)

    // act
    const result = selectBreakfastById.resultFunc(initialBreakfastState, 'b-unknown')

    // assert
    expect(result).toBeNull()
  })
})

describe('createSelectAllCollectionDocuments', () => {
  it(`should select all documents of a collection 'drinks'`, () => {
    // arrange
    const selectAllDrinks = createSelectAllCollectionDocuments(rootSelector, 'drinks')

    // act
    const result = selectAllDrinks.resultFunc(initialBreakfastState.buckets.b0001.collections.drinks)

    // assert
    // order: native order
    expect(result).toEqual([
      initialBreakfastState.buckets.b0001.collections.drinks.entities.d0001,
      initialBreakfastState.buckets.b0001.collections.drinks.entities.d0002,
    ])
  })

  it(`should select all documents of a collection 'drinks'`, () => {
    // arrange
    const selectAllDrinks = createSelectAllCollectionDocuments(rootSelector, 'drinks')

    // act
    const result = selectAllDrinks.resultFunc(initialBreakfastState.buckets.b0001.collections.drinks)

    // assert
    // order: native order
    expect(result).toEqual([
      initialBreakfastState.buckets.b0001.collections.drinks.entities.d0001,
      initialBreakfastState.buckets.b0001.collections.drinks.entities.d0002,
    ])
  })

  it(`should select all documents of a collection 'foods' of bucket given by id (from app state)`, () => {
    // arrange
    const appState = { breakfasts: initialBreakfastState }
    const selectAllFoods = createSelectAllCollectionDocuments(rootSelector, 'foods')

    // act
    const result = selectAllFoods(appState, 'b0001')

    // assert
    // order: native order
    expect(result).toEqual([
      initialBreakfastState.buckets.b0001.collections.foods.entities.f0001,
      initialBreakfastState.buckets.b0001.collections.foods.entities.f0002,
    ])
  })

  it(`should select nothing for bucket of unknown id`, () => {
    // arrange
    const appState = { breakfasts: initialBreakfastState }
    const selectAllFoods = createSelectAllCollectionDocuments(rootSelector, 'foods')

    // act
    const result = selectAllFoods(appState, 'b-unknown')

    // assert
    expect(result).toEqual([])
  })
})

describe('createSelectAllCollectionDocumentsSorted', () => {
  it(`should select all documents of a collection 'drinks' sorted`, () => {
    // arrange
    const order = byString<Drink>((d) => d.name)
    const selectAllDrinks = createSelectAllCollectionDocumentsSorted(rootSelector, 'drinks', order)
    const entities = [
      initialBreakfastState.buckets.b0001.collections.drinks.entities.d0001,
      initialBreakfastState.buckets.b0001.collections.drinks.entities.d0002,
    ]

    // act
    const result = selectAllDrinks.resultFunc(entities)

    // assert
    // order: d0002, d0001
    expect(result).toEqual([
      initialBreakfastState.buckets.b0001.collections.drinks.entities.d0002,
      initialBreakfastState.buckets.b0001.collections.drinks.entities.d0001,
    ])
  })

  it(`should select all documents of a collection 'foods' of bucket given by id (from app state) sorted`, () => {
    // arrange
    const order = byString<Food>((f) => f.name)
    const appState = { breakfasts: initialBreakfastState }
    const selectAllFoods = createSelectAllCollectionDocumentsSorted(rootSelector, 'foods', order)

    // act
    const result = selectAllFoods(appState, 'b0001')

    // assert
    // order: f0001, f0002
    expect(result).toEqual([
      initialBreakfastState.buckets.b0001.collections.foods.entities.f0001,
      initialBreakfastState.buckets.b0001.collections.foods.entities.f0002,
    ])
  })

  it(`should select nothing for bucket of unknown id`, () => {
    // arrange
    const order = byString<Food>((f) => f.name)
    const appState = { breakfasts: initialBreakfastState }
    const selectAllFoods = createSelectAllCollectionDocumentsSorted(rootSelector, 'foods', order)

    // act
    const result = selectAllFoods(appState, 'b-unknown')

    // assert
    expect(result).toEqual([])
  })
})

describe('createSelectCollectionDocumentById', () => {
  it(`should select a document of a collection 'drinks' by id`, () => {
    // arrange
    const selectDrinkById = createSelectCollectionDocumentById(rootSelector, 'drinks')

    // act
    const result = selectDrinkById.resultFunc(initialBreakfastState, 'b0001', 'd0001')

    // assert
    expect(result).toEqual(initialBreakfastState.buckets.b0001.collections.drinks.entities.d0001)
  })

  it(`should return null of select with an unknown bucket id`, () => {
    // arrange
    const selectDrinkById = createSelectCollectionDocumentById(rootSelector, 'drinks')

    // act
    const result = selectDrinkById.resultFunc(initialBreakfastState, 'b-unknown', 'd0001')

    // assert
    expect(result).toBeNull()
  })

  it(`should return null of select with an unknown 'food' id in bucket 'b0001'`, () => {
    // arrange
    const selectDrinkById = createSelectCollectionDocumentById(rootSelector, 'drinks')

    // act
    const result = selectDrinkById.resultFunc(initialBreakfastState, 'b0001', 'd-unknown')

    // assert
    expect(result).toBeNull()
  })
})
