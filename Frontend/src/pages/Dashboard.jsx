import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>🥐 Bakery Management</h1>
        </div>
        <div className="navbar-menu">
          <Link to="/" className="nav-link">Dashboard</Link>
          <Link to="/products" className="nav-link">Products</Link>
          <Link to="/cashier" className="nav-link">Cashier</Link>
          <Link to="/sales" className="nav-link">Sales</Link>
          {(user?.role === 'Admin' || user?.role === 'Manager') && (
            <Link to="/reports" className="nav-link">Reports</Link>
          )}
        </div>
        <div className="navbar-user">
          <span className="user-info">
            👤 {user?.fullName} ({user?.role})
          </span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;
