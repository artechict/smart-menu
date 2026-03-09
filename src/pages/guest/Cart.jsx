import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOrder } from '../../context/OrderContext';
import { useCurrency } from '../../context/CurrencyContext';
import { ArrowLeft, Trash2 } from 'lucide-react';

export default function Cart() {
  const { cart, removeFromCart, cartTotal, submitOrder } = useOrder();
  const { formatPrice } = useCurrency();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  const [guestName, setGuestName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!guestName || !roomNumber) return;
    
    setIsSubmitting(true);
    const id = await submitOrder({ name: guestName, roomNumber });
    setIsSubmitting(false);
    
    if (id) {
      setOrderId(id);
    }
  };

  // Helper to get localized text
  const getLocalized = (item, field) => {
    return item[`${field}_${i18n.language}`] || item[`${field}_en`];
  };

  if (orderId) {
    return (
      <div className="cart-page success-view">
        <div className="glass-card success-card">
          <h2>{t('orderConfirmed')}</h2>
          <p>{t('orderSuccessObj1')}{orderId}{t('orderSuccessObj2')}</p>
          <p>{t('orderSuccessMsg2')}</p>
          <button onClick={() => navigate('/')} className="primary-btn mt-4">
            {t('backToHome')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <header className="page-header">
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <ArrowLeft /> {t('back')}
        </button>
        <h2>{t('yourOrder')}</h2>
      </header>

      {cart.length === 0 ? (
        <div className="empty-cart glass-card">
          <p>{t('emptyCart')}</p>
          <button onClick={() => navigate('/')}>{t('browseMenus')}</button>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.id} className="glass-card cart-item">
                <div className="item-info">
                  <span className="item-qty">{item.quantity}x</span>
                  <div>
                    <h4>{getLocalized(item, 'name')}</h4>
                    <span className="item-dept">{t(item.department)}</span>
                  </div>
                </div>
                <div className="item-actions">
                  <span className="price">{formatPrice(item.price * item.quantity)}</span>
                  <button className="icon-btn delete-btn" onClick={() => removeFromCart(item.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            
            <div className="cart-total glass-card">
              <h3>{t('total')}:</h3>
              <h3>{formatPrice(cartTotal)}</h3>
            </div>
          </div>

          <div className="checkout-form glass-card">
            <h3>{t('guestDetails')}</h3>
            <form onSubmit={handleCheckout}>
              <div className="form-group">
                <label>{t('roomNumber')}</label>
                <input 
                  type="text" 
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. 402"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t('guestName')}</label>
                <input 
                  type="text" 
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Full Name"
                  required
                />
              </div>
              <button type="submit" className="primary-btn checkout-btn" disabled={isSubmitting}>
                {isSubmitting ? '...' : t('placeOrder')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
