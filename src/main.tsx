import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

document
  .querySelector('meta[name="viewport"]')
  ?.setAttribute(
    'content',
    'width=device-width, initial-scale=1.0, viewport-fit=cover',
  )

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
