import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { OrderProvider } from './context/OrderContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { CurrencyProvider } from './context/CurrencyContext.jsx'
import './i18n.js'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <CurrencyProvider>
          <OrderProvider>
            <App />
          </OrderProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
