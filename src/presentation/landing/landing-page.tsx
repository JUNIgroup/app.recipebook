import { onMount } from 'solid-js'
import { registerScrollEvent } from './scrolling'

import './landing-page.scss'

export const LandingPage = () => {
  onMount(registerScrollEvent)

  const onSignInClick = () => {
    console.log('Sign In clicked')
  }

  const onSignUpClick = () => {
    console.log('Sign Up clicked')
  }

  return (
    <>
      <section class="title-bar-offset" />
      <section class="title-bar">
        <div class="logo-bar">
          <div class="logo">
            <img class="simple" src="/logo-simple.svg" alt="" aria-hidden="true" />
            <img class="details" src="/logo-details.svg" alt="" aria-hidden="true" />
          </div>
        </div>
        <div class="title">
          <h1 class="app-title--font">Flavor Vault</h1>
        </div>
        <div class="actions">
          <button type="button" class="sign-in prefer" onClick={onSignInClick}>
            <span>Sign In</span>
          </button>
          <button type="button" class="sign-up" onClick={onSignUpClick}>
            <span>Sign Up</span>
          </button>
        </div>
      </section>
      <section class="full-screen-section">
        <h2>Welcome to Flavor&nbsp;Vault</h2>
        <h3>Your Personal Recipe Collection</h3>
        <p>Experience a new way to gather and treasure your cherished recipes with Flavor Vault!</p>
        <p>
          Whether you&apos;re an avid home chef or simply love cooking, our web app offers you the seamless ability to
          collect, curate, and share your favorite recipes.
        </p>
      </section>
      <section class="full-screen-section">
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
      <section class="full-screen-section">
        <p>
          Embark on your culinary journey today with Flavor Vault and transform the way you save and enjoy your
          treasured recipes. Sign up now to unlock a world of flavors!
        </p>
        <button type="button" class="sign-up--standalone" onClick={onSignUpClick}>
          <span>Sign Up</span>
        </button>
      </section>
    </>
  )
}
