import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOrder } from '../../context/OrderContext';
import { useCurrency } from '../../context/CurrencyContext';
import { ArrowLeft, Plus } from 'lucide-react';

export default function MenuBrowser() {
  const { department } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useOrder();
  const { formatPrice } = useCurrency();
  const { t, i18n } = useTranslation();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setItems(data.filter(i => i.department === department));
        } else {
          console.error('API error or unexpected data:', data);
          setItems([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setItems([]);
        setLoading(false);
      });
  }, [department]);

  const departmentTitles = {
    restaurant: t('restaurant'),
    cafe: t('cafe'),
    laundry: t('laundry')
  };

  const handleAdd = (item) => {
    addToCart(item, department);
  };

  const getLocalized = (item, field) => {
    // Check if the field exists for the current language, otherwise fallback to English
    const localizedValue = item[`${field}_${i18n.language}`];
    return (localizedValue && localizedValue.trim() !== '') ? localizedValue : item[`${field}_en`];
  };

  return (
    <div className="menu-browser">
      <header className="page-header">
        <button className="icon-btn glass" onClick={() => navigate(-1)} style={{ padding: '0.8rem 1.2rem', borderRadius: '12px' }}>
          <ArrowLeft size={20} /> <span style={{ marginLeft: '0.5rem' }}>{t('back')}</span>
        </button>
        <h2 style={{ fontSize: '2.5rem', margin: '1rem 0' }}>{departmentTitles[department] || t('menuTitle')}</h2>
      </header>

      {loading ? (
        <div className="loading-state">
           <p>{t('loading')}...</p>
        </div>
      ) : (
        <div className="menu-grid">
          {items.map(item => (
            <div key={item.id} className="glass menu-item">
              <div className="item-image-container">
                <img src={item.image} alt={getLocalized(item, 'name')} />
              </div>
              <div className="item-details">
                <h3>{getLocalized(item, 'name')}</h3>
                <p>{getLocalized(item, 'desc')}</p>
                <div className="item-footer">
                  <span className="price">{formatPrice(item.price)}</span>
                  <button className="add-btn primary" onClick={() => handleAdd(item)}>
                    <Plus size={18} /> {t('add')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
