import { useEffect, useState } from 'react';
import { api, rupees } from '../api';

const empty = { name: '', description: '', price: '', stock: '', category: 'electronics' };
const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    api('/products?limit=50').then((d) => setProducts(d.items));
    api('/orders').then(setOrders);
  };
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const body = { ...form, price: Number(form.price), stock: Number(form.stock) };
      await api(editing ? `/products/${editing}` : '/products', { method: editing ? 'PUT' : 'POST', body });
      setForm(empty);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <form className="panel" onSubmit={save}>
        <h2>{editing ? 'Edit product' : 'Add product'}</h2>
        <input placeholder="Name" value={form.name} onChange={set('name')} required />
        <input placeholder="Description" value={form.description} onChange={set('description')} />
        <div className="row3">
          <input type="number" min="0" placeholder="Price" value={form.price} onChange={set('price')} required />
          <input type="number" min="0" placeholder="Stock" value={form.stock} onChange={set('stock')} required />
          <input placeholder="Category" value={form.category} onChange={set('category')} />
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn">{editing ? 'Save changes' : 'Add product'}</button>
      </form>

      <div className="panel">
        <h2>Products</h2>
        {products.map((p) => (
          <div className="line" key={p._id}>
            <div><strong>{p.name}</strong><div className="muted">{rupees(p.price)} · {p.stock} in stock</div></div>
            <button className="ghost" onClick={() => { setEditing(p._id); setForm({ ...p }); }}>Edit</button>
            <button className="ghost" onClick={() => api(`/products/${p._id}`, { method: 'DELETE' }).then(load)}>Delete</button>
          </div>
        ))}
      </div>

      <div className="panel">
        <h2>Orders</h2>
        {orders.map((o) => (
          <div className="line" key={o._id}>
            <div><strong>{o.user?.name}</strong><div className="muted">{o.items.length} item(s) · {rupees(o.total)}</div></div>
            <select value={o.status} onChange={(e) => api(`/orders/${o._id}/status`, { method: 'PUT', body: { status: e.target.value } }).then(load)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        ))}
      </div>
    </>
  );
}
