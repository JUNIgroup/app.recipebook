/* eslint-disable jsx-a11y/label-has-associated-control */
import { Logo, Message, SignInButton, SignUpButton } from './elements'

export const WelcomeDialog = () => (
  <div className="welcome">
    <Logo />
    <Message>Welcome to Recipe-Book</Message>
    <Message>Log in with your account to continue</Message>
    <div className="button-block">
      <SignInButton />
      <hr />
      <SignUpButton />
    </div>
    <div />
  </div>
)
