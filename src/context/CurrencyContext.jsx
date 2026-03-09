import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => useContext(CurrencyContext);

// Mock exchange rate: 1 USD = 1300 IQD as per user preference
const EXCHANGE_RATE_USD_TO_IQD = 1300;

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('hotel_currency') || 'USD';
  });

  useEffect(() => {
    localStorage.setItem('hotel_currency', currency);
  }, [currency]);

  const toggleCurrency = () => {
    setCurrency(prev => prev === 'USD' ? 'IQD' : 'USD');
  };

  const formatPrice = (priceInUSD) => {
    if (currency === 'IQD') {
      const priceInIQD = priceInUSD * EXCHANGE_RATE_USD_TO_IQD;
      return new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0 }).format(priceInIQD);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(priceInUSD);
  };

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};
