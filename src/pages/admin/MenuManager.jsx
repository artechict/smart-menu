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

  const menuGallery = [
    { name: 'Wagyu', url: '/assets/menu/wagyu.png' },
    { name: 'Lobster', url: '/assets/menu/lobster.png' },
    { name: 'Espresso', url: '/assets/menu/espresso.png' },
    { name: 'Suit', url: '/assets/menu/suit.png' }
  ];

  function initialFormState() {
    return {
      id: '',
      department: 'restaurant',
      name_en: '', name_ar: '', name_tr: '', name_ku: '',
      desc_en: '', desc_ar: '', desc_tr: '', desc_ku: '',
      price: '',
      image: menuGallery[0].url
    };
  }

  const handleTranslate = async () => {
    if (!currentForm.name_en && !currentForm.desc_en) {
      alert('Please enter English name or description first.');
      return;
    }

    try {
      const targets = ['ar', 'tr', 'ku'];
      
      // Translate Name
      if (currentForm.name_en) {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: currentForm.name_en, targetLangs: targets })
        });
        const data = await res.json();
        if (data.translations) {
          setCurrentForm(prev => ({
            ...prev,
            name_ar: data.translations.ar,
            name_tr: data.translations.tr,
            name_ku: data.translations.ku
          }));
        }
      }

      // Translate Description
      if (currentForm.desc_en) {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: currentForm.desc_en, targetLangs: targets })
        });
        const data = await res.json();
        if (data.translations) {
          setCurrentForm(prev => ({
            ...prev,
            desc_ar: data.translations.ar,
            desc_tr: data.translations.tr,
            desc_ku: data.translations.ku
          }));
        }
      }
    } catch (err) {
      console.error('Translation failed:', err);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/menu');
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
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

    // Ensure valid numerical price
    const priceNum = parseFloat(payload.price);
    if (isNaN(priceNum)) {
      alert('Invalid price format');
      return;
    }
    payload.price = priceNum;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('Item ' + (isNew ? 'Added' : 'Saved') + ' successfully!');
        setCurrentForm(initialFormState());
        setIsEditing(false);
        fetchItems();
      } else {
        const errData = await res.json();
        alert('Error: ' + errData.error);
      }
    } catch (err) {
      console.error(err);
      alert('Submission failed. Check console.');
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
            
            <div className="form-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Price (USD)</label>
                <input type="number" step="0.01" name="price" value={currentForm.price} onChange={handleInputChange} required />
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <label>Product Image</label>
                <div className="gallery-selector" style={{ display: 'flex', gap: '5px', overflowX: 'auto', padding: '5px', border: '1px solid var(--card-border)', borderRadius: '8px', background: 'var(--input-bg)' }}>
                  {menuGallery.map(img => (
                    <img 
                      key={img.url} 
                      src={img.url} 
                      alt={img.name}
                      onClick={() => setCurrentForm(prev => ({ ...prev, image: img.url }))}
                      style={{ 
                        width: '35px', height: '35px', borderRadius: '4px', cursor: 'pointer',
                        border: currentForm.image === img.url ? '2px solid var(--accent-primary)' : '2px solid transparent',
                        opacity: currentForm.image === img.url ? 1 : 0.6
                      }}
                      title={img.name}
                    />
                  ))}
                </div>
                <input 
                  type="text" 
                  name="image" 
                  value={currentForm.image} 
                  onChange={handleInputChange} 
                  placeholder="Or enter custom URL..."
                  style={{ marginTop: '5px', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            <fieldset style={{ border: '1px solid var(--card-border)', padding: '15px', borderRadius: '12px', marginBottom: '20px', background: 'rgba(255,255,255,0.02)' }}>
              <legend style={{ padding: '0 10px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>English (EN) - Primary</legend>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input type="text" name="name_en" placeholder="Item Name (English)" value={currentForm.name_en} onChange={handleInputChange} required style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'white' }} />
                <button type="button" onClick={handleTranslate} style={{ padding: '0 15px', background: 'var(--accent-glow)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  AUTO TRANSLATE
                </button>
              </div>
              <textarea name="desc_en" placeholder="Description (English)" value={currentForm.desc_en} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'white', minHeight: '80px' }} />
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
                    <img src={item.image} alt="" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
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
