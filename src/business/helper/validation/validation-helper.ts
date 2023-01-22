import Ajv from 'Ajv'

export type { JSONSchemaType } from 'Ajv'

export const validation = new Ajv({ allErrors: true })
