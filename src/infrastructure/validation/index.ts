/**
 * Calling this function will throw an error if the data could not be validated.
 *
 * @param data the data to validate
 */
export type ValidateFunction<T> = (data: unknown) => asserts data is T
