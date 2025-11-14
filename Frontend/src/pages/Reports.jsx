import React, { useState, useEffect } from 'react';
import { reportsAPI, salesAPI } from '../services/api';
import './Reports.css';

const Reports = () => {
  const [dailySummary, setDailySummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchReports();
  }, [selectedDate]);

  const fetchReports = async () => {
    try {
      const [summaryRes, topProductsRes] = await Promise.all([
        reportsAPI.getDailySummary(selectedDate),
        reportsAPI.getTopProducts(null, null, 5),
      ]);
      
      setDailySummary(summaryRes.data);
      setTopProducts(topProductsRes.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load reports');
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="reports-page">
      <h2>Reports & Analytics</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="date-selector">
        <label>Select Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      {dailySummary && (
        <>
          <div className="summary-section">
            <h3>Daily Summary - {new Date(dailySummary.date).toLocaleDateString()}</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <h4>Total Revenue</h4>
                  <p className="stat-value">${dailySummary.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🛒</div>
                <div className="stat-content">
                  <h4>Transactions</h4>
                  <p className="stat-value">{dailySummary.totalTransactions}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <h4>Items Sold</h4>
                  <p className="stat-value">{dailySummary.totalItemsSold}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h4>Avg Transaction</h4>
                  <p className="stat-value">${dailySummary.averageTransactionValue.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="charts-section">
            <div className="chart-card">
              <h3>Top Selling Product</h3>
              <div className="top-product">
                <div className="product-icon">🏆</div>
                <div className="product-name">{dailySummary.topSellingProduct || 'None'}</div>
              </div>
            </div>

            {dailySummary.productSales && dailySummary.productSales.length > 0 && (
              <div className="chart-card">
                <h3>Product Sales Today</h3>
                <table className="product-sales-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailySummary.productSales.map((product, idx) => (
                      <tr key={idx}>
                        <td>{product.productName}</td>
                        <td>{product.quantitySold}</td>
                        <td>${product.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {dailySummary.salesByPaymentMethod && dailySummary.salesByPaymentMethod.length > 0 && (
              <div className="chart-card">
                <h3>Sales by Payment Method</h3>
                <table className="payment-method-table">
                  <thead>
                    <tr>
                      <th>Payment Method</th>
                      <th>Count</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailySummary.salesByPaymentMethod.map((method, idx) => (
                      <tr key={idx}>
                        <td>{method.paymentMethod}</td>
                        <td>{method.count}</td>
                        <td>${method.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {topProducts.length > 0 && (
        <div className="top-products-section">
          <h3>Top Products (All Time)</h3>
          <div className="top-products-grid">
            {topProducts.map((product, idx) => (
              <div key={idx} className="top-product-card">
                <div className="rank">#{idx + 1}</div>
                <div className="product-details">
                  <h4>{product.productName}</h4>
                  <p>Quantity Sold: <strong>{product.quantitySold}</strong></p>
                  <p>Revenue: <strong>${product.revenue.toFixed(2)}</strong></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
