import { ID } from '../../database/database-types'
import { BucketsState } from './types'

export type Breakfast = {
  id: ID
  rev: number
  time: string
}

export type Drink = {
  id: ID
  rev: number
  name: string
}

export type Food = {
  id: ID
  rev: number
  name: string
}

export type BreakfastStructure = {
  bucket: Breakfast
  collections: {
    drinks: Drink
    foods: Food
  }
}

export type BreakfastState = BucketsState<BreakfastStructure>

export const initialBreakfastState: BreakfastState = {
  ids: ['b0001', 'b0002'],
  buckets: {
    b0001: {
      entity: {
        id: 'b0001',
        rev: 0,
        time: '08:00',
      },
      collections: {
        drinks: {
          ids: ['d0001', 'd0002'],
          entities: {
            d0001: {
              id: 'd0001',
              rev: 0,
              name: 'Tea',
            },
            d0002: {
              id: 'd0002',
              rev: 0,
              name: 'Coffee',
            },
          },
        },
        foods: {
          ids: ['f0001', 'f0002'],
          entities: {
            f0001: {
              id: 'f0001',
              rev: 0,
              name: 'Bread',
            },
            f0002: {
              id: 'f0002',
              rev: 0,
              name: 'Butter',
            },
          },
        },
      },
    },
    b0002: {
      entity: {
        id: 'b0002',
        rev: 0,
        time: '09:00',
      },
      collections: {
        drinks: {
          ids: ['d0003'],
          entities: {
            d0003: {
              id: 'd0003',
              rev: 0,
              name: 'Water',
            },
          },
        },
        foods: {
          ids: ['f0003'],
          entities: {
            f0003: {
              id: 'f0003',
              rev: 0,
              name: 'Apple',
            },
          },
        },
      },
    },
  },
}

export type PartialRootState = { breakfasts: BreakfastState }

export const rootSelector = (state: PartialRootState) => state.breakfasts
