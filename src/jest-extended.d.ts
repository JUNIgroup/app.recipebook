/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-unused-vars */

/// <reference types="jest-extended" />

import type { Assertion, AsymmetricMatchersContaining } from 'vitest'

// jest-extended overrides the entire vitest module, so we need to re-extend it here
// see https://github.com/jest-community/jest-extended/issues/610

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers<any> {}
}
