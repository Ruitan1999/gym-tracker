import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App'
import { guardStylesheet } from './utils/ensureStylesheet'
import { healStaleBuildOnBoot } from './utils/buildVersion'
import { registerServiceWorker } from './utils/registerServiceWorker'

// Before anything renders: an app whose stylesheet 404'd after a deploy is
// unusable on every screen, and says nothing about why.
guardStylesheet()

// Not awaited: a launch must not wait on the network to paint. If this document
// came back from a cache and is behind what's deployed, the reload lands a
// moment later — before anything has been typed into it.
void healStaleBuildOnBoot()

// From here on the worker keeps documents fresh on its own. This stays as the
// answer for the launch before it is installed, and for anything it misses.
registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>,
)
