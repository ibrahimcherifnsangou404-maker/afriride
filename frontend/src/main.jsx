import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initOptionalServices } from './services/optionalServices'

initOptionalServices()
window.addEventListener('cookie-consent-updated', () => {
  initOptionalServices()
})

createRoot(document.getElementById('root')).render(
  <App />,
)
