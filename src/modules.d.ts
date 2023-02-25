declare module '*.json-schema' {
  export interface ErrorObject {
    keyword: string
    instancePath: string
    schemaPath: string
    params: Record<string, unknown>
    propertyName?: string
    message?: string
    schema?: unknown
    parentSchema?: unknown
    data?: unknown
  }

  export const validate: {
    (data: unknown): boolean
    errors?: null | ErrorObject[]
  }
}
