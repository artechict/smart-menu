import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOrder } from './context/OrderContext';
import { useTheme } from './context/ThemeContext';
import { useCurrency } from './context/CurrencyContext';
import Home from './pages/guest/Home';
import MenuBrowser from './pages/guest/MenuBrowser';
import Cart from './pages/guest/Cart';
import AdminDashboard from './pages/admin/Dashboard';
import { Moon, Sun, DollarSign, Coins } from 'lucide-react';
import './App.css';

function App() {
  const { cartTotal } = useOrder();
  const { theme, toggleTheme } = useTheme();
  const { currency, toggleCurrency, formatPrice } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  // Handle RTL for Arabic and Kurdish
  useEffect(() => {
    const isRtl = i18n.language === 'ar' || i18n.language === 'ku';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      <nav className="main-nav">
        <div className="nav-brand" onClick={() => navigate('/')}>{t('appTitle')}</div>
        
        <div className="nav-controls">
          <select value={i18n.language} onChange={changeLanguage} className="lang-select">
            <option value="en">English</option>
            <option value="ar">العربية (Arabic)</option>
            <option value="tr">Türkçe (Turkish)</option>
            <option value="ku">کوردی سۆرانی (Kurdish)</option>
          </select>
          
          <button className="icon-btn theme-btn" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {/* Only show currency toggle on Guest side */}
          {!isAdminRoute && (
            <button className="icon-btn currency-btn" onClick={toggleCurrency}>
              {currency === 'USD' ? <Coins size={20} /> : <DollarSign size={20} />} 
              <span className="currency-label">{currency}</span>
            </button>
          )}
        </div>

        <div className="nav-actions">
          {!isAdminRoute && (
            <button className="cart-btn" onClick={() => navigate('/cart')}>
              {t('cart')} ({formatPrice(cartTotal)})
            </button>
          )}
          {!isAdminRoute && (
            <button className="admin-btn" onClick={() => navigate('/admin')}>
              {t('adminLogin')}
            </button>
          )}
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          {/* Guest Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/menu/:department" element={<MenuBrowser />} />
          <Route path="/cart" element={<Cart />} />
          
          {/* Admin Routes */}
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
