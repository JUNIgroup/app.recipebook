import { formatGeoPoint, parseGeoPoint, GeoPoint, isGeoPoint, createGeoPoint } from './geopoint'

const GeoPointTypeTag: Pick<GeoPoint, typeof Symbol.toStringTag> = { [Symbol.toStringTag]: 'GeoPoint' }

describe('parseGeoPoint', () => {
  it('should parse a GeoPoint', () => {
    // arrange
    const value = {
      latitude: 42.42,
      longitude: 42.42,
    }

    // act
    const geoPoint = parseGeoPoint(value)

    // assert
    expect(geoPoint).toEqual({ latitude: 42.42, longitude: 42.42, ...GeoPointTypeTag })
  })

  it.each`
    value                                                | error
    ${null}                                              | ${'Expected a record for GeoPoint but received null'}
    ${{ latitude: 42.42 }}                               | ${'Expected a number for longitude but received undefined'}
    ${{ longitude: 42.42 }}                              | ${'Expected a number for latitude but received undefined'}
    ${{ latitude: 42.42, longitude: 42.42, foo: 'bar' }} | ${'Expected no extra keys for GeoPoint but received foo'}
    ${{ latitude: 'foo', longitude: 42.42 }}             | ${'Expected a number for latitude but received foo'}
    ${{ latitude: 42.42, longitude: 'foo' }}             | ${'Expected a number for longitude but received foo'}
    ${{ latitude: -200, longitude: 42.42 }}              | ${'Expected latitude to be in range [-90,90] but received -200'}
    ${{ latitude: 200, longitude: 42.42 }}               | ${'Expected latitude to be in range [-90,90] but received 200'}
    ${{ latitude: 42.42, longitude: -200 }}              | ${'Expected longitude to be in range [-180,180] but received -200'}
    ${{ latitude: 42.42, longitude: 200 }}               | ${'Expected longitude to be in range [-180,180] but received 200'}
  `('should throw error for an non/invalid geo point $value', ({ value, error }) => {
    // act
    const act = () => parseGeoPoint(value)

    // assert
    expect(act).toThrow(error)
  })
})

describe('formatGeoPoint', () => {
  it('should format a GeoPoint', () => {
    // arrange
    const value = { latitude: 42.42, longitude: 42.42, ...GeoPointTypeTag }

    // act
    const geoPoint = formatGeoPoint(value)

    // assert
    expect(geoPoint).toEqual({ latitude: 42.42, longitude: 42.42 })
  })
})

describe('createGeoPoint', () => {
  it('should create a GeoPoint', () => {
    // arrange
    const latitude = 42.42
    const longitude = -123.45

    // act
    const geoPoint = createGeoPoint(latitude, longitude)

    // assert
    expect(geoPoint).toEqual({ latitude, longitude, ...GeoPointTypeTag })
  })
})

describe('isGeoPoint', () => {
  it('should return true for a GeoPoint', () => {
    // arrange
    const value = { latitude: 42.42, longitude: 42.42, ...GeoPointTypeTag }

    // act
    const result = isGeoPoint(value)

    // assert
    expect(result).toBe(true)
  })

  it('should return false for a "GeoPoint" without toStringTag symbol', () => {
    // arrange
    const value = { latitude: 42.42, longitude: 42.42 }

    // act
    const result = isGeoPoint(value)

    // assert
    expect(result).toBe(false)
  })

  it('should return false for a non GeoPoint', () => {
    // arrange
    const value = { foo: 42 }

    // act
    const result = isGeoPoint(value)

    // assert
    expect(result).toBe(false)
  })

  it('should return false for a non object', () => {
    // arrange
    const value = 'foo'

    // act
    const result = isGeoPoint(value)

    // assert
    expect(result).toBe(false)
  })

  it('should return false for null', () => {
    // arrange
    const value = null

    // act
    const result = isGeoPoint(value)

    // assert
    expect(result).toBe(false)
  })
})
