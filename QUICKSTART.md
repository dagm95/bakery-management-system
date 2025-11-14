# Bakery Management System - Quick Start Guide

This guide will help you get the Bakery Management System up and running quickly.

## Quick Setup (5 minutes)

### Step 1: Start the Backend API

```bash
# Navigate to backend directory
cd Backend/BakeryAPI

# Run the API (database will be created automatically)
dotnet run
```

The API will start at `http://localhost:5000` and automatically:
- Create the database
- Seed with a default admin user

**Default Login:**
- Username: `admin`
- Password: `admin123`

### Step 2: Start the Frontend

Open a new terminal:

```bash
# Navigate to frontend directory
cd Frontend

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

The app will open at `http://localhost:5173`

### Step 3: Login and Explore

1. Open `http://localhost:5173` in your browser
2. Login with the default credentials
3. Start exploring the features!

## Testing the Application

### 1. Add Some Products

Navigate to "Products" and click "Add Product". Try adding:

**Example Product 1:**
- Name: Croissant
- Description: Buttery, flaky French pastry
- Price: 3.50
- Stock: 50
- Category: Pastries

**Example Product 2:**
- Name: Baguette
- Description: Traditional French bread
- Price: 2.75
- Stock: 30
- Category: Breads

**Example Product 3:**
- Name: Chocolate Cake
- Description: Rich chocolate layer cake
- Price: 25.00
- Stock: 10
- Category: Cakes

### 2. Make a Sale

1. Go to "Cashier"
2. Click on products to add them to the cart
3. Adjust quantities with +/- buttons
4. Select payment method
5. Click "Complete Sale"

### 3. View Reports

Go to "Reports" to see:
- Today's revenue
- Transaction count
- Top selling products
- Sales by payment method

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Change port in launchSettings.json or use:
dotnet run --urls "http://localhost:5001"
```

**Database connection issues:**
- Make sure SQL Server LocalDB is installed
- Or update connection string in `appsettings.json` to use your SQL Server instance

### Frontend Issues

**Port 5173 is busy:**
```bash
# Vite will automatically use the next available port
# Or specify a port:
npm run dev -- --port 3000
```

**API connection refused:**
- Make sure the backend is running on port 5000
- Check the API_BASE_URL in `src/services/api.js`

## Features to Try

### For Cashiers:
- ✅ Process sales quickly
- ✅ Handle different payment methods
- ✅ View today's sales

### For Managers/Admins:
- ✅ Manage product catalog
- ✅ View detailed reports
- ✅ Track inventory
- ✅ Monitor daily performance

## API Testing

You can test the API directly using tools like Postman or curl:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get products (use the token from login response)
curl -X GET http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Next Steps

- Create additional user accounts for different roles
- Add more products to your catalog
- Process some sales transactions
- Generate reports to see analytics
- Customize the application to your needs

## Need Help?

Check the main README.md for:
- Complete API documentation
- Database schema details
- Architecture overview
- Deployment instructions

Happy Baking! 🥐🍞🎂
