import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Admin from './pages/Admin';

// Route guard: redirects to /login (or home for non-admins).
function Guard({ children, admin }) {
  const { user, ready } = useAuth();
  if (!ready) return <p className="muted">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, logout } = useAuth();
  return (
    <>
      <header className="bar">
        <Link to="/" className="brand">ShopStack</Link>
        <nav>
          <NavLink to="/">Shop</NavLink>
          {user && <NavLink to="/cart">Cart</NavLink>}
          {user && <NavLink to="/orders">My orders</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <div className="who">
          {user ? (
            <>
              <span>{user.name}</span>
              <button className="ghost" onClick={logout}>Log out</button>
            </>
          ) : (
            <Link to="/login" className="btn">Log in</Link>
          )}
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Shop />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cart" element={<Guard><Cart /></Guard>} />
          <Route path="/orders" element={<Guard><Orders /></Guard>} />
          <Route path="/admin" element={<Guard admin><Admin /></Guard>} />
          <Route path="*" element={<p className="muted">Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}
