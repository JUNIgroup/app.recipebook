import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app'
import { Auth, connectAuthEmulator, debugErrorMap, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth'

const firebaseOptions: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE__API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE__AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE__PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE__MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE__APP_ID,
}

const serviceName = 'FirebaseService'

function trace(message: string, ...more: unknown[]) {
  // eslint-disable-next-line no-console
  console.log(`[${serviceName}] ${message}`, ...more)
}

export class FirebaseService {
  /** app instance */
  private readonly app: FirebaseApp

  /** auth instance */
  private readonly auth: Auth

  /**
   * Start the service to provide access to firebase.
   */
  constructor() {
    trace('start app with options: %O', firebaseOptions)
    this.app = initializeApp(firebaseOptions, {
      automaticDataCollectionEnabled: false,
    })

    this.auth = initializeAuth(this.app, {
      persistence: indexedDBLocalPersistence,
      errorMap: import.meta.env.VITE_FIREBASE__DEBUG_ERRORS ? debugErrorMap : undefined,
    })
    if (import.meta.env.VITE_FIREBASE__USE_EMULATOR) {
      trace('connect app with emulator')
      connectAuthEmulator(this.auth, import.meta.env.VITE_FIREBASE__USE_EMULATOR)
    }
  }

  getAuth(): Auth {
    return this.auth
  }
}
