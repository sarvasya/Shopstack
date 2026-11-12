import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, rupees } from '../api';

export default function Cart() {
  const nav = useNavigate();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const run = (p) => p.then(setCart).catch((e) => setError(e.message));
  useEffect(() => { run(api('/cart')); }, []);

  const checkout = async () => {
    setError('');
    try {
      await api('/orders', { method: 'POST', body: { shippingAddress: address } });
      nav('/orders');
    } catch (e) {
      setError(e.message);
    }
  };

  if (!cart.items.length) return <p className="muted">Your cart is empty. Add something from the shop.</p>;

  return (
    <div className="panel">
      <h2>Your cart</h2>
      {cart.items.map(({ product, quantity }) => (
        <div className="line" key={product._id}>
          <div><strong>{product.name}</strong><div className="muted">{rupees(product.price)} each</div></div>
          <div className="qty">
            <button className="ghost" disabled={quantity <= 1} onClick={() => run(api(`/cart/items/${product._id}`, { method: 'PUT', body: { quantity: quantity - 1 } }))}>−</button>
            <span>{quantity}</span>
            <button className="ghost" onClick={() => run(api(`/cart/items/${product._id}`, { method: 'PUT', body: { quantity: quantity + 1 } }))}>+</button>
          </div>
          <strong>{rupees(product.price * quantity)}</strong>
          <button className="ghost" onClick={() => run(api(`/cart/items/${product._id}`, { method: 'DELETE' }))}>Remove</button>
        </div>
      ))}
      <h3 className="total">Total {rupees(cart.total)}</h3>
      <textarea placeholder="Shipping address" value={address} onChange={(e) => setAddress(e.target.value)} />
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={!address.trim()} onClick={checkout}>Place order</button>
    </div>
  );
}
