import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, rupees } from '../api';
import { useAuth } from '../auth';

export default function Shop() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [q, setQ] = useState({ search: '', category: '', sort: '-createdAt', page: 1 });
  const [data, setData] = useState({ items: [], pages: 1 });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(Object.entries(q).filter(([, v]) => v));
    api(`/products?${params}`).then(setData).catch((e) => setMsg(e.message));
  }, [q]);

  const add = async (id) => {
    if (!user) return nav('/login');
    try {
      await api('/cart/items', { method: 'POST', body: { productId: id, quantity: 1 } });
      setMsg('Added to cart');
    } catch (e) {
      setMsg(e.message);
    }
  };

  return (
    <>
      <div className="filters">
        <input placeholder="Search products" value={q.search} onChange={(e) => setQ({ ...q, search: e.target.value, page: 1 })} />
        <select value={q.category} onChange={(e) => setQ({ ...q, category: e.target.value, page: 1 })}>
          <option value="">All categories</option>
          {['electronics', 'stationery', 'home', 'accessories'].map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={q.sort} onChange={(e) => setQ({ ...q, sort: e.target.value })}>
          <option value="-createdAt">Newest</option>
          <option value="price">Price: low to high</option>
          <option value="-price">Price: high to low</option>
        </select>
      </div>
      {msg && <p className="notice" onClick={() => setMsg('')}>{msg}</p>}
      {!data.items.length && <p className="muted">No products match your search.</p>}
      <div className="grid">
        {data.items.map((p) => (
          <article key={p._id} className="card">
            <h3>{p.name}</h3>
            <p className="muted">{p.description}</p>
            <div className="row">
              <strong>{rupees(p.price)}</strong>
              <span className={p.stock < 10 ? 'low' : 'muted'}>{p.stock ? `${p.stock} left` : 'Out of stock'}</span>
            </div>
            <button className="btn" disabled={!p.stock} onClick={() => add(p._id)}>Add to cart</button>
          </article>
        ))}
      </div>
      <div className="pager">
        <button className="ghost" disabled={q.page <= 1} onClick={() => setQ({ ...q, page: q.page - 1 })}>Previous</button>
        <span>Page {data.page || 1} of {data.pages || 1}</span>
        <button className="ghost" disabled={q.page >= data.pages} onClick={() => setQ({ ...q, page: q.page + 1 })}>Next</button>
      </div>
    </>
  );
}
