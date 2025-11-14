import React, { useState, useEffect } from 'react';
import { salesAPI } from '../services/api';
import './Sales.css';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await salesAPI.getAll(startDate, endDate);
      setSales(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load sales');
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setLoading(true);
    fetchSales();
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setLoading(true);
    setTimeout(() => fetchSales(), 100);
  };

  if (loading) return <div className="loading">Loading...</div>;

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalItems = sales.reduce(
    (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );

  return (
    <div className="sales-page">
      <h2>Sales History</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="filters-section">
        <div className="filter-group">
          <label>Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button onClick={handleFilter} className="btn-filter">
          Apply Filter
        </button>
        <button onClick={handleReset} className="btn-reset">
          Reset
        </button>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Sales</h3>
          <p className="summary-value">{sales.length}</p>
        </div>
        <div className="summary-card">
          <h3>Total Revenue</h3>
          <p className="summary-value">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="summary-card">
          <h3>Total Items</h3>
          <p className="summary-value">{totalItems}</p>
        </div>
        <div className="summary-card">
          <h3>Average Sale</h3>
          <p className="summary-value">
            ${sales.length > 0 ? (totalRevenue / sales.length).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      <div className="sales-table-container">
        <table className="sales-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Time</th>
              <th>Cashier</th>
              <th>Items</th>
              <th>Payment</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td>{sale.id}</td>
                <td>{new Date(sale.saleDate).toLocaleDateString()}</td>
                <td>{new Date(sale.saleDate).toLocaleTimeString()}</td>
                <td>{sale.cashierName}</td>
                <td>
                  <details>
                    <summary>{sale.items.length} items</summary>
                    <ul className="items-list">
                      {sale.items.map((item, idx) => (
                        <li key={idx}>
                          {item.productName} x{item.quantity} @ ${item.unitPrice.toFixed(2)}
                          = ${item.subtotal.toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </details>
                </td>
                <td>{sale.paymentMethod}</td>
                <td className="total-cell">${sale.totalAmount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sales;
