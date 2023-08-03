import { useEffect } from 'react'
import { registerScrollEvent } from './scrolling'

import './landing-page.scss'

export const LandingPage = () => {
  useEffect(registerScrollEvent, [])

  const onSigninClick = () => {
    console.log('Login clicked')
  }

  const onSignupClick = () => {
    console.log('Signup clicked')
  }

  return (
    <>
      <section className="title-bar-offset" />
      <section className="title-bar">
        <div className="logo">
          <img className="simple" src="/logo-simple.svg" alt="" aria-hidden="true" />
          <img className="details" src="/logo-details.svg" alt="" aria-hidden="true" />
        </div>
        <div className="title">
          <h1 className="app-title--font">Flavor Vault</h1>
        </div>
        <div className="actions">
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <button type="button" className="sign-in prefer" autoFocus onClick={onSigninClick}>
            <span>Login</span>
          </button>
          <button type="button" className="sign-up" onClick={onSignupClick}>
            <span>Signup</span>
          </button>
        </div>
      </section>
      <section className="full-screen-section">
        <h2 style={{ margin: 0 }}>Section 2</h2>
        <p style={{ color: 'darkblue' }}>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatum. Quisquam, voluptatum. Quisquam,
        </p>
        <p style={{ color: 'darkgreen' }}>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatum. Quisquam, voluptatum. Quisquam,
        </p>
        <p style={{ color: 'darkred' }}>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatum. Quisquam, voluptatum. Quisquam,
        </p>
        <p style={{ color: 'darkorange' }}>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatum. Quisquam, voluptatum. Quisquam,
        </p>
        <p style={{ color: 'darkcyan' }}>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatum. Quisquam, voluptatum. Quisquam,
        </p>
      </section>
      <section className="full-screen-section">Section 3</section>
      <section className="full-screen-section">Section 4</section>
      <section className="full-screen-section">Section 5</section>
    </>
  )
}
