import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Utensils, Coffee, Shirt } from 'lucide-react';
const restaurantBg = '/assets/menu/wagyu.png';
const cafeBg = '/assets/menu/espresso.png';
const laundryBg = '/assets/menu/suit.png';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const categories = [
    { id: 'restaurant', title: t('restaurant'), desc: t('restaurantDesc'), icon: <Utensils />, bg: restaurantBg },
    { id: 'cafe', title: t('cafe'), desc: t('cafeDesc'), icon: <Coffee />, bg: cafeBg },
    { id: 'laundry', title: t('laundry'), desc: t('laundryDesc'), icon: <Shirt />, bg: laundryBg },
  ];

  return (
    <div className="guest-home">
      <div className="hero">
        <h1>{t('appTitle')}</h1>
        <p>{t('appSubtitle')}</p>
      </div>

      <div className="categories-grid">
        {categories.map((cat) => (
          <div 
            key={cat.id}
            className="glass category-card" 
            onClick={() => navigate(`/menu/${cat.id}`)}
            style={{ backgroundImage: `url(${cat.bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            <div className="icon-wrapper">
              {cat.icon}
            </div>
            <h3>{cat.title}</h3>
            <p>{cat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
