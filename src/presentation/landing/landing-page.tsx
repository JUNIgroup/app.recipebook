import { useEffect } from 'react'
import { registerScrollEvent } from './scrolling'

import './landing-page.scss'

export const LandingPage = () => {
  useEffect(registerScrollEvent, [])

  const onSignInClick = () => {
    console.log('Sign In clicked')
  }

  const onSignUpClick = () => {
    console.log('Sign Up clicked')
  }

  return (
    <>
      <section className="title-bar-offset" />
      <section className="title-bar">
        <div className="logo-bar">
          <div className="logo">
            <img className="simple" src="/logo-simple.svg" alt="" aria-hidden="true" />
            <img className="details" src="/logo-details.svg" alt="" aria-hidden="true" />
          </div>
        </div>
        <div className="title">
          <h1 className="app-title--font">Flavor Vault</h1>
        </div>
        <div className="actions">
          <button type="button" className="sign-in prefer" onClick={onSignInClick}>
            <span>Sign In</span>
          </button>
          <button type="button" className="sign-up" onClick={onSignUpClick}>
            <span>Sign Up</span>
          </button>
        </div>
      </section>
      <section className="full-screen-section">
        <h2>Welcome to Flavor&nbsp;Vault</h2>
        <h3>Your Personal Recipe Collection</h3>
        <p>Experience a new way to gather and treasure your cherished recipes with Flavor Vault!</p>
        <p>
          Whether you&apos;re an avid home chef or simply love cooking, our web app offers you the seamless ability to
          collect, curate, and share your favorite recipes.
        </p>
      </section>
      <section className="full-screen-section">
        <h2>Key Highlights</h2>
        <dl>
          <dt>Import Recipes</dt>
          <dd>Effortlessly bring in recipes from the internet and neatly organize them in one accessible place.</dd>
          <dt>Create Your Collections</dt>
          <dd>
            Group your recipes into collections based on cuisines, occasions, or any themes that resonate with you.
          </dd>
          <dt>Tag and Organize</dt>
          <dd>Apply tags to your recipes for quick categorization and easy retrieval.</dd>
          <dt>Collaborate and Share</dt>
          <dd>Collaborate with friends and family on recipe collections and keep them up-to-date together.</dd>
        </dl>
      </section>
      <section className="full-screen-section">
        <p>
          Embark on your culinary journey today with Flavor Vault and transform the way you save and enjoy your
          treasured recipes. Sign up now to unlock a world of flavors!
        </p>
        <button type="button" className="sign-up--standalone" onClick={onSignUpClick}>
          <span>Sign Up</span>
        </button>
      </section>
    </>
  )
}
