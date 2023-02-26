import Ajv from 'ajv'
import standaloneCode from 'ajv/dist/standalone'

export default function VitePluginAjv() {
  const ending = '.json-schema'

  return {
    name: 'VitePluginAjv', // required, will show up in warnings and errors

    resolveId(id: string) {
      if (id.endsWith(ending)) {
        return id
      }
      return null
    },

    transform(src: string, id: string) {
      if (id.endsWith(ending)) {
        const schema = JSON.parse(src)
        if (!schema.$id) {
          throw new Error(`Schema ${id} must have an $id property.`)
        }
        const ajv = new Ajv({
          schemas: [schema],
          allErrors: true,
          code: { source: true, esm: true, lines: true, optimize: true },
        })
        const moduleCode = standaloneCode(ajv, {
          validate: schema.$id,
        })
        const moduleCodeWithImport = moduleCode.replace(
          /const (\w+) = require\("(.*?)"\).default;/g,
          (_match, p1, p2) => `import ${p1} from '${p2}';`,
        )
        return moduleCodeWithImport
      }
      return null
    },
  }
}
