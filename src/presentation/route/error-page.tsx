import { Link, useRouteError } from 'react-router-dom'

const ErrorPage = () => {
  const error = useRouteError() as { statusText?: string; message?: string }

  return (
    <div id="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{error.statusText ?? error.message ?? 'Unknown error.'}</i>
      </p>
      <Link to="/">Start at home.</Link>
    </div>
  )
}

export default ErrorPage
