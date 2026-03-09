import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Utensils, Coffee, Shirt } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="guest-home">
      <div className="hero">
        <h1>{t('appTitle')}</h1>
        <p>{t('appSubtitle')}</p>
      </div>

      <div className="categories-grid">
        <div className="glass-card category-card" onClick={() => navigate('/menu/restaurant')}>
          <div className="icon-wrapper">
            <Utensils size={40} />
          </div>
          <h3>{t('restaurant')}</h3>
          <p>{t('restaurantDesc')}</p>
          <button>{t('viewMenu')}</button>
        </div>
        
        <div className="glass-card category-card" onClick={() => navigate('/menu/cafe')}>
          <div className="icon-wrapper">
            <Coffee size={40} />
          </div>
          <h3>{t('cafe')}</h3>
          <p>{t('cafeDesc')}</p>
          <button>{t('viewCafe')}</button>
        </div>

        <div className="glass-card category-card" onClick={() => navigate('/menu/laundry')}>
          <div className="icon-wrapper">
            <Shirt size={40} />
          </div>
          <h3>{t('laundry')}</h3>
          <p>{t('laundryDesc')}</p>
          <button>{t('requestService')}</button>
        </div>
      </div>
    </div>
  );
}
