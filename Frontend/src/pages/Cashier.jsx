import React, { useState, useEffect } from 'react';
import { productsAPI, salesAPI } from '../services/api';
import { useAuth } from '../utils/AuthContext';
import './Cashier.css';

const Cashier = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll(true);
      setProducts(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load products');
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.productId === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stockQuantity) {
        setError(`Cannot add more. Only ${product.stockQuantity} in stock.`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          stockQuantity: product.stockQuantity,
        },
      ]);
    }
    setError('');
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const product = products.find(p => p.id === productId);
    if (newQuantity > product.stockQuantity) {
      setError(`Cannot add more. Only ${product.stockQuantity} in stock.`);
      return;
    }

    setCart(
      cart.map((item) =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }

    try {
      const saleData = {
        cashierName: user?.fullName || 'Unknown',
        paymentMethod,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      await salesAPI.create(saleData);
      setSuccess('Sale completed successfully!');
      setCart([]);
      fetchProducts(); // Refresh to update stock
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete sale');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="cashier-page">
      <h2>Cashier Point of Sale</h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="cashier-layout">
        <div className="products-section">
          <h3>Available Products</h3>
          <div className="products-list">
            {products.map((product) => (
              <div
                key={product.id}
                className="product-item"
                onClick={() => addToCart(product)}
              >
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <p className="product-category">{product.category}</p>
                </div>
                <div className="product-pricing">
                  <div className="price">${product.price.toFixed(2)}</div>
                  <div className="stock">Stock: {product.stockQuantity}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cart-section">
          <h3>Current Sale</h3>
          
          {cart.length === 0 ? (
            <div className="empty-cart">
              <p>No items in cart</p>
              <p>Click on products to add them</p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item) => (
                  <div key={item.productId} className="cart-item">
                    <div className="cart-item-info">
                      <h4>{item.name}</h4>
                      <p>${item.price.toFixed(2)} each</p>
                    </div>
                    <div className="cart-item-controls">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="qty-btn"
                      >
                        -
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="qty-btn"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="remove-btn"
                      >
                        ×
                      </button>
                    </div>
                    <div className="cart-item-total">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="payment-method">
                  <label>Payment Method:</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Mobile">Mobile Payment</option>
                  </select>
                </div>

                <div className="total-section">
                  <div className="total-label">Total Amount:</div>
                  <div className="total-amount">${calculateTotal().toFixed(2)}</div>
                </div>

                <button onClick={handleCheckout} className="checkout-btn">
                  Complete Sale
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cashier;
