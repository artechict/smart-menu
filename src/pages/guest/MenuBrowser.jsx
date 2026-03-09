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
        setItems(data.filter(i => i.department === department));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
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

  // Helper to get localized text
  const getLocalized = (item, field) => {
    return item[`${field}_${i18n.language}`] || item[`${field}_en`];
  };

  return (
    <div className="menu-browser">
      <header className="page-header">
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <ArrowLeft /> {t('back')}
        </button>
        <h2>{departmentTitles[department] || t('menuTitle')}</h2>
      </header>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="menu-grid">
          {items.map(item => (
            <div key={item.id} className="glass-card menu-item">
              <div className="item-image">{item.image}</div>
              <div className="item-details">
                <h3>{getLocalized(item, 'name')}</h3>
                <p>{getLocalized(item, 'desc')}</p>
                <div className="item-footer">
                  <span className="price">{formatPrice(item.price)}</span>
                  <button className="add-btn" onClick={() => handleAdd(item)}>
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
