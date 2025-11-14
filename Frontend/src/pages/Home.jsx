import React, { useState, useEffect } from 'react';
import { salesAPI, productsAPI } from '../services/api';
import { useAuth } from '../utils/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const [todaySales, setTodaySales] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [salesRes, productsRes] = await Promise.all([
        salesAPI.getTodaySales(),
        productsAPI.getAll(true),
      ]);
      
      setTodaySales(salesRes.data);
      setProducts(productsRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  const lowStockProducts = products.filter(p => p.stockQuantity < 10);

  return (
    <div className="home-page">
      <div className="welcome-section">
        <h2>Welcome back, {user?.fullName}! 👋</h2>
        <p className="date-display">{new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </div>

      {todaySales && (
        <div className="today-summary">
          <h3>Today's Performance</h3>
          <div className="summary-cards-grid">
            <div className="summary-card revenue">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <h4>Total Revenue</h4>
                <p className="card-value">${todaySales.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
            <div className="summary-card transactions">
              <div className="card-icon">🛒</div>
              <div className="card-content">
                <h4>Transactions</h4>
                <p className="card-value">{todaySales.totalTransactions}</p>
              </div>
            </div>
            <div className="summary-card items">
              <div className="card-icon">📦</div>
              <div className="card-content">
                <h4>Items Sold</h4>
                <p className="card-value">{todaySales.totalItems}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <a href="/cashier" className="action-card">
            <div className="action-icon">🛍️</div>
            <h4>New Sale</h4>
            <p>Process a new sale transaction</p>
          </a>
          <a href="/products" className="action-card">
            <div className="action-icon">📋</div>
            <h4>Manage Products</h4>
            <p>View and edit product catalog</p>
          </a>
          <a href="/sales" className="action-card">
            <div className="action-icon">📊</div>
            <h4>View Sales</h4>
            <p>Browse sales history</p>
          </a>
          {(user?.role === 'Admin' || user?.role === 'Manager') && (
            <a href="/reports" className="action-card">
              <div className="action-icon">📈</div>
              <h4>Reports</h4>
              <p>View analytics and reports</p>
            </a>
          )}
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="alerts-section">
          <h3>⚠️ Low Stock Alert</h3>
          <div className="alerts-list">
            {lowStockProducts.map(product => (
              <div key={product.id} className="alert-item">
                <span className="alert-product">{product.name}</span>
                <span className="alert-stock">Only {product.stockQuantity} left</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {todaySales && todaySales.sales && todaySales.sales.length > 0 && (
        <div className="recent-sales">
          <h3>Recent Sales Today</h3>
          <div className="sales-list">
            {todaySales.sales.slice(0, 5).map(sale => (
              <div key={sale.id} className="sale-item">
                <div className="sale-info">
                  <span className="sale-time">
                    {new Date(sale.saleDate).toLocaleTimeString()}
                  </span>
                  <span className="sale-cashier">{sale.cashierName}</span>
                </div>
                <div className="sale-amount">${sale.totalAmount.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
