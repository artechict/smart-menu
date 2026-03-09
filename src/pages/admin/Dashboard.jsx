import { useNavigate, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import OrderList from './OrderList';
import MenuManager from './MenuManager';
import { Utensils, Coffee, Shirt, ArrowLeft, Settings } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar glass-card">
        <div className="sidebar-header">
          <h2>{t('adminPanel')}</h2>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/admin/restaurant" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <Utensils size={20} /> {t('restaurantOrders')}
          </NavLink>
          <NavLink to="/admin/cafe" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <Coffee size={20} /> {t('cafeOrders')}
          </NavLink>
          <NavLink to="/admin/laundry" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <Shirt size={20} /> {t('laundryRequests')}
          </NavLink>
          <hr style={{borderColor: 'var(--card-border)', margin: '1rem 0'}} />
          <NavLink to="/admin/menus" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <Settings size={20} /> {t('menuManager')}
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <button className="icon-btn logout-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={18} /> {t('backToEntry')}
          </button>
        </div>
      </aside>

      <main className="admin-content glass-card">
        <Routes>
          <Route path="/" element={<Navigate to="/admin/restaurant" replace />} />
          <Route path="/menus" element={<MenuManager />} />
          <Route path="/:department" element={<OrderList />} />
        </Routes>
      </main>
    </div>
  );
}
