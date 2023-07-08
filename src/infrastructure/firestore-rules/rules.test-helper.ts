import { RulesTestContext } from '@firebase/rules-unit-testing'
import { collection, deleteDoc, getDocs } from 'firebase/firestore'
import { createWriteStream, readFileSync } from 'node:fs'
import http from 'node:http'
import { isEmulatorAvailable } from '../../utilities/firebase/emulator-utils'

export type RulesTestOptions = {
  /* File containing the Firestore rules for the test. */
  rulesFile: string

  /* The ID of the project. */
  projectId: string

  /* The ID of the database. */
  databaseId: string
}

export type RulesTestConfig = {
  available: boolean
  rulesFile: string
  projectId: string
  databaseId: string
  firestore: {
    rules: string
    host: string
    port: number
  }
}

export async function getRulesTestConfig(options: RulesTestOptions): Promise<RulesTestConfig> {
  const emulatorAvailable = await isEmulatorAvailable()
  const firestoreEmulator = emulatorAvailable?.firestore
  return {
    available: !!firestoreEmulator,
    rulesFile: options.rulesFile,
    projectId: options.projectId,
    databaseId: options.databaseId,
    firestore: firestoreEmulator
      ? {
          rules: readFileSync(options.rulesFile, 'utf8'),
          host: firestoreEmulator.host,
          port: firestoreEmulator.port,
        }
      : {
          rules: '',
          host: '',
          port: 0,
        },
  }
}

export async function coverageReport(testEnv: RulesTestConfig, infix: string) {
  if (!testEnv.available) return

  // Write the coverage report to a file
  const coverageFile = `${testEnv.rulesFile}.${infix}.coverage.html`
  const fileStream = createWriteStream(coverageFile)
  const { host, port } = testEnv.firestore
  const coverageUri = `http://${host}:${port}/emulator/v1/projects/${testEnv.projectId}:ruleCoverage.html`
  await new Promise((resolve, reject) => {
    http.get(coverageUri, (res) => {
      res.pipe(fileStream, { end: true })
      res.on('end', resolve)
      res.on('error', reject)
    })
  })

  // eslint-disable-next-line no-console
  console.log(`Firestore rule coverage: ${coverageUri}`)
  // eslint-disable-next-line no-console
  console.log(`Firestore rule coverage: ${coverageFile}`)
}

export async function deleteAllDocs(
  firestore: ReturnType<RulesTestContext['firestore']>,
  path: string,
  ...segments: string[]
) {
  const docs = await getDocs(collection(firestore, path, ...segments))
  await Promise.all(docs.docs.map(({ ref }) => deleteDoc(ref)))
}
