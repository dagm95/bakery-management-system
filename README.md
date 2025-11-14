# Bakery Management System

The Bakery Management System is a web-based platform that helps bakery owners manage daily operations like sales tracking, expense monitoring, and inventory control. It automates financial tasks, reduces manual errors, and lets owners focus on baking and customer satisfaction.

## Technology Stack

### Backend
- **Framework**: ASP.NET Core 9.0 Web API
- **Database**: SQL Server with Entity Framework Core 9.0
- **Authentication**: JWT Bearer Authentication
- **Password Hashing**: BCrypt.Net

### Frontend
- **Framework**: React.js 18
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Styling**: Custom CSS

## Features

### 1. Authentication & Authorization
- Secure JWT-based authentication
- Role-based access control (Admin, Manager, Cashier)
- Password hashing with BCrypt

### 2. Product Management
- Create, read, update, and delete products
- Product pricing and stock management
- Product categorization
- Active/inactive product status

### 3. Cashier Operations
- Point of sale interface
- Add products to cart
- Multiple payment methods (Cash, Card, Mobile)
- Real-time stock validation
- Quick checkout process

### 4. Sales Tracking
- Complete sales history
- Filter sales by date range
- Detailed transaction information
- Sales item breakdown

### 5. Reports & Analytics
- Daily sales summaries
- Revenue tracking
- Top selling products
- Transaction analytics
- Payment method breakdown
- Low stock alerts

## Project Structure

```
bakery-management-system/
├── Backend/
│   └── BakeryAPI/
│       ├── Controllers/      # API endpoints
│       ├── Data/            # Database context
│       ├── DTOs/            # Data transfer objects
│       ├── Models/          # Entity models
│       └── Program.cs       # Application entry point
└── Frontend/
    └── src/
        ├── components/      # Reusable components
        ├── pages/          # Page components
        ├── services/       # API services
        └── utils/          # Utility functions
```

## Getting Started

### Prerequisites
- .NET 9.0 SDK
- Node.js 18+ and npm
- SQL Server or SQL Server LocalDB

### Backend Setup

1. Navigate to the backend directory:
```bash
cd Backend/BakeryAPI
```

2. Restore NuGet packages:
```bash
dotnet restore
```

3. Update the connection string in `appsettings.json` if needed:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=BakeryDB;Trusted_Connection=true;TrustServerCertificate=true;"
  }
}
```

4. Run the application:
```bash
dotnet run
```

The API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Update the API base URL in `src/services/api.js` if needed:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Default Credentials

- **Username**: admin
- **Password**: admin123
- **Role**: Admin

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Products
- `GET /api/products` - Get all products
- `GET /api/products/{id}` - Get product by ID
- `POST /api/products` - Create product (Admin/Manager)
- `PUT /api/products/{id}` - Update product (Admin/Manager)
- `DELETE /api/products/{id}` - Deactivate product (Admin)

### Sales
- `GET /api/sales` - Get all sales
- `GET /api/sales/{id}` - Get sale by ID
- `POST /api/sales` - Create sale
- `GET /api/sales/today` - Get today's sales

### Reports
- `GET /api/reports/daily-summary` - Get daily summary
- `GET /api/reports/summary-range` - Get summary for date range
- `GET /api/reports/top-products` - Get top selling products

## Database Schema

### Users
- User authentication and profile information
- Role-based access control

### Products
- Product catalog with pricing and stock
- Category management

### Sales
- Sales transaction records
- Payment method tracking

### SaleItems
- Individual items in each sale
- Quantity and pricing details

### DailySummaries
- Aggregated daily statistics
- Performance metrics

## Security Features

- JWT token-based authentication
- Password hashing with BCrypt
- Role-based authorization
- CORS configuration for frontend access
- SQL injection prevention with EF Core

## Development

### Building the Backend
```bash
cd Backend/BakeryAPI
dotnet build
```

### Building the Frontend
```bash
cd Frontend
npm run build
```

### Running Tests
```bash
# Backend tests
cd Backend/BakeryAPI
dotnet test

# Frontend tests
cd Frontend
npm test
```

## License

This project is for educational and demonstration purposes.

