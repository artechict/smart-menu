import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit2, X, Save } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export default function MenuManager() {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentForm, setCurrentForm] = useState(initialFormState());

  function initialFormState() {
    return {
      id: '',
      department: 'restaurant',
      name_en: '', name_ar: '', name_tr: '', name_ku: '',
      desc_en: '', desc_ar: '', desc_tr: '', desc_ku: '',
      price: '',
      image: '🍽️'
    };
  }

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/menu');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (item) => {
    setCurrentForm(item);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchItems();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isNew = !isEditing;
    const url = isNew ? '/api/menu' : `/api/menu/${currentForm.id}`;
    const method = isNew ? 'POST' : 'PUT';

    // Auto-generate ID if new
    const payload = { ...currentForm };
    if (isNew && !payload.id) {
      payload.id = `item_${Date.now()}`;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setCurrentForm(initialFormState());
        setIsEditing(false);
        fetchItems();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="menu-manager">
      <header className="admin-header">
        <h2>{t('menuManager')}</h2>
      </header>

      <div className="menu-manager-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
        
        {/* Form Container */}
        <div className="glass-card form-card">
          <h3>{isEditing ? 'Edit Item' : 'Add New Item'}</h3>
          <form onSubmit={handleSubmit} className="menu-form">
            <div className="form-group">
              <label>Department</label>
              <select name="department" value={currentForm.department} onChange={handleInputChange}>
                <option value="restaurant">Restaurant</option>
                <option value="cafe">Cafe & Bar</option>
                <option value="laundry">Laundry</option>
              </select>
            </div>
            
            <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group">
                <label>Price (USD)</label>
                <input type="number" step="0.01" name="price" value={currentForm.price} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Emoji/Icon</label>
                <input type="text" name="image" value={currentForm.image} onChange={handleInputChange} required />
              </div>
            </div>

            <fieldset style={{ border: '1px solid var(--card-border)', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
              <legend style={{ padding: '0 5px' }}>English (EN)</legend>
              <input type="text" name="name_en" placeholder="Name" value={currentForm.name_en} onChange={handleInputChange} required className="full-width-input" />
              <textarea name="desc_en" placeholder="Description" value={currentForm.desc_en} onChange={handleInputChange} className="full-width-input" />
            </fieldset>

            <fieldset style={{ border: '1px solid var(--card-border)', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
              <legend style={{ padding: '0 5px' }}>Arabic (AR)</legend>
              <input type="text" name="name_ar" placeholder="الاسم" value={currentForm.name_ar} onChange={handleInputChange} className="full-width-input" dir="rtl" />
              <textarea name="desc_ar" placeholder="الوصف" value={currentForm.desc_ar} onChange={handleInputChange} className="full-width-input" dir="rtl" />
            </fieldset>

            <fieldset style={{ border: '1px solid var(--card-border)', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
              <legend style={{ padding: '0 5px' }}>Turkish (TR)</legend>
              <input type="text" name="name_tr" placeholder="İsim" value={currentForm.name_tr} onChange={handleInputChange} className="full-width-input" />
            </fieldset>

            <fieldset style={{ border: '1px solid var(--card-border)', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
              <legend style={{ padding: '0 5px' }}>Kurdish (KU)</legend>
              <input type="text" name="name_ku" placeholder="ناو" value={currentForm.name_ku} onChange={handleInputChange} className="full-width-input" dir="rtl" />
            </fieldset>

            <div className="form-actions" style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="primary-btn">
                {isEditing ? <><Save size={16}/> Save</> : <><Plus size={16}/> Add</>}
              </button>
              {isEditing && (
                <button type="button" className="btn-completed" style={{ background: 'var(--card-border)' }} onClick={() => { setIsEditing(false); setCurrentForm(initialFormState()); }}>
                  <X size={16}/> Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List Container */}
        <div className="glass-card list-card" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <h3>Menu Items ({items.length})</h3>
          {loading ? <p>Loading...</p> : (
            <div className="admin-menu-list">
              {items.map(item => (
                <div key={item.id} className="admin-list-item glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0', padding: '15px' }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ fontSize: '2rem' }}>{item.image}</div>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0' }}>{item.name_en}</h4>
                      <small style={{ color: 'var(--text-secondary)' }}>{item.department.toUpperCase()} • {formatPrice(item.price)}</small>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="icon-btn" onClick={() => handleEdit(item)} style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <Edit2 size={16} />
                    </button>
                    <button className="icon-btn delete-btn" onClick={() => handleDelete(item.id)} style={{ background: 'rgba(255,0,0,0.1)' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
