import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOrder } from '../../context/OrderContext';
import { CheckCircle, Clock } from 'lucide-react';

export default function OrderList() {
  const { department } = useParams();
  const { orders, updateOrderStatus } = useOrder();
  const { t, i18n } = useTranslation();

  // Filter orders where AT LEAST ONE item is from this department
  const departmentOrders = orders.filter(order => 
    order.items.some(item => item.department === department)
  );

  const StatusBadge = ({ status }) => {
    const badges = {
      pending: <span className="badge badge-warning"><Clock size={14}/> {t('pending')}</span>,
      preparing: <span className="badge badge-info">{t('preparing')}</span>,
      delivered: <span className="badge badge-success"><CheckCircle size={14}/> {t('delivered')}</span>,
      completed: <span className="badge badge-success"><CheckCircle size={14}/> {t('completed')}</span>
    };
    return badges[status] || <span className="badge">{status}</span>;
  };

  const departmentTitles = {
    restaurant: t('restaurantOrders'),
    cafe: t('cafeOrders'),
    laundry: t('laundryRequests')
  };

  // Helper to get localized text
  const getLocalized = (item, field) => {
    return item[`${field}_${i18n.language}`] || item[`${field}_en`];
  };

  if (departmentOrders.length === 0) {
    return (
      <div className="order-list empty">
        <h3>{departmentTitles[department]}</h3>
        <p>No active orders for this department.</p>
      </div>
    );
  }

  return (
    <div className="order-list">
      <header className="admin-header">
        <h2>{departmentTitles[department]}</h2>
        <span className="order-count">{departmentOrders.length} Total</span>
      </header>

      <div className="orders-grid">
        {departmentOrders.map(order => (
          <div key={order.id} className="glass-card order-card">
            <div className="order-header">
              <div>
                <h3>Room {order.roomNumber}</h3>
                <span className="guest-name">{order.guestName}</span>
              </div>
              <div className="order-meta">
                <span className="order-time">
                  {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <StatusBadge status={order.status} />
              </div>
            </div>

            <div className="order-items">
              <ul>
                {order.items
                  .filter(item => item.department === department)
                  .map((item, idx) => (
                  <li key={idx}>
                    <span className="qty">{item.quantity}x</span> {getLocalized(item, 'name')}
                  </li>
                ))}
              </ul>
            </div>

            <div className="order-actions">
              {order.status === 'pending' && (
                <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="btn-preparing">
                  {t('markPreparing')}
                </button>
              )}
              {order.status === 'preparing' && (
                <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="btn-completed">
                  {t('markDelivered')}
                </button>
              )}
              {order.status === 'delivered' && (
                <button onClick={() => updateOrderStatus(order.id, 'completed')} className="btn-completed">
                  {t('markCompleted')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
