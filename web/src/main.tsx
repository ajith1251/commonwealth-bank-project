import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import App from './App'
import SharedReportPage from './pages/SharedReportPage'
import './index.css'

// Public shared-report route: /shared/report/:token
// Rendered standalone (no app shell, no private controls).
const sharedMatch = window.location.pathname.match(/^\/shared\/report\/([^/]+)\/?$/)
const isSharedRoute = Boolean(sharedMatch)
const sharedToken = sharedMatch?.[1] ?? ''

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isSharedRoute ? (
      <SharedReportPage token={sharedToken} />
    ) : (
      <Provider store={store}>
        <App />
      </Provider>
    )}
  </React.StrictMode>,
)
