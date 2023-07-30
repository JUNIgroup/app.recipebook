import { useEffect } from 'react'
import { registerScrollEvent } from './scrolling'

import './landing-page.scss'

export const LandingPage = () => {
  useEffect(() => {
    console.log('LandingPage mounted')
    const unregister = registerScrollEvent()
    return () => {
      console.log('LandingPage unmounted')
      unregister()
    }
  }, [])

  const onSigninClick = () => {
    console.log('Login clicked')
  }

  const onSignupClick = () => {
    console.log('Signup clicked')
  }

  return (
    <>
      <div className="full-screen-section">
        <div className="splash title-bar">
          <div className="logo">
            <img className="simple" src="/logo-simple.svg" alt="" aria-hidden="true" />
            <img className="details" src="/logo-details.svg" alt="" aria-hidden="true" />
          </div>
          <div className="title">
            <h1 className="app-title--font">Flavor Vault</h1>
          </div>
          <div className="actions">
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <button type="button" className="prefer" autoFocus onClick={onSigninClick}>
              <span>Login</span>
            </button>
            <button type="button" onClick={onSignupClick}>
              <span>Signup</span>
            </button>
          </div>
        </div>
      </div>
      <div className="full-screen-section">Section 2</div>
      <div className="full-screen-section">Section 3</div>
    </>
  )
}
