import { useEffect, useState } from 'react';
import { api, rupees } from '../api';

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const load = () => api('/orders/mine').then(setOrders).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const cancel = (id) => api(`/orders/${id}/cancel`, { method: 'PUT' }).then(load).catch((e) => setError(e.message));

  if (!orders) return <p className="muted">{error || 'Loading…'}</p>;
  if (!orders.length) return <p className="muted">No orders yet.</p>;

  return (
    <>
      {error && <p className="error">{error}</p>}
      {orders.map((o) => (
        <div className="panel" key={o._id}>
          <div className="row">
            <strong>{new Date(o.createdAt).toLocaleDateString()}</strong>
            <span className={`status ${o.status}`}>{o.status}</span>
          </div>
          {o.items.map((i) => <div key={i.product} className="muted">{i.quantity} × {i.name}</div>)}
          <div className="row">
            <strong>{rupees(o.total)}</strong>
            {o.status === 'pending' && <button className="ghost" onClick={() => cancel(o._id)}>Cancel order</button>}
          </div>
        </div>
      ))}
    </>
  );
}
