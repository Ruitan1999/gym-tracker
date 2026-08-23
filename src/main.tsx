import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App'
import { guardStylesheet } from './utils/ensureStylesheet'

// Before anything renders: an app whose stylesheet 404'd after a deploy is
// unusable on every screen, and says nothing about why.
guardStylesheet()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>,
)
