# Bakery Management System - Architecture Overview

## System Architecture

The Bakery Management System follows a modern three-tier architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer (React)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   Pages     │  │  Components  │  │    Services     │   │
│  │ (Views/UI)  │  │  (Reusable)  │  │  (API Calls)   │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST API (JWT)
┌─────────────────────────────────────────────────────────────┐
│              Backend Layer (ASP.NET Core API)                │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ Controllers │  │     DTOs     │  │   Middleware    │   │
│  │   (API)     │  │ (Data Trans) │  │ (Auth/CORS)     │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ Entity Framework Core
┌─────────────────────────────────────────────────────────────┐
│              Data Layer (SQL Server + EF Core)               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   Models    │  │   DbContext  │  │    Database     │   │
│  │ (Entities)  │  │ (Migrations) │  │  (SQL Server)   │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Backend Stack
- **Framework**: ASP.NET Core 9.0
- **Language**: C# 12
- **ORM**: Entity Framework Core 9.0
- **Database**: SQL Server / LocalDB
- **Authentication**: JWT Bearer Tokens
- **Password Hashing**: BCrypt.Net 4.0
- **API Documentation**: OpenAPI/Swagger

### Frontend Stack
- **Framework**: React 18.3
- **Build Tool**: Vite 7.2
- **Language**: JavaScript (ES6+)
- **Routing**: React Router DOM 7.1
- **HTTP Client**: Axios 1.7
- **Styling**: Custom CSS3

## Project Structure

### Backend Structure
```
Backend/BakeryAPI/
├── Controllers/          # API endpoints
│   ├── AuthController.cs       # Authentication & registration
│   ├── ProductsController.cs   # Product CRUD operations
│   ├── SalesController.cs      # Sales transactions
│   └── ReportsController.cs    # Analytics & reports
├── Models/              # Domain entities
│   ├── User.cs                 # User entity
│   ├── Product.cs              # Product entity
│   ├── Sale.cs                 # Sale & SaleItem entities
│   └── DailySummary.cs         # Daily summary entity
├── DTOs/                # Data Transfer Objects
│   ├── AuthDtos.cs             # Login/register DTOs
│   ├── ProductDtos.cs          # Product DTOs
│   └── SaleDtos.cs             # Sale DTOs
├── Data/                # Database context
│   └── BakeryDbContext.cs      # EF Core DbContext
├── Program.cs           # Application entry point
└── appsettings.json     # Configuration
```

### Frontend Structure
```
Frontend/src/
├── pages/               # Page components
│   ├── Login.jsx               # Login page
│   ├── Dashboard.jsx           # Main layout
│   ├── Home.jsx                # Dashboard home
│   ├── Products.jsx            # Product management
│   ├── Cashier.jsx             # POS interface
│   ├── Sales.jsx               # Sales history
│   └── Reports.jsx             # Analytics
├── services/            # API integration
│   └── api.js                  # Axios configuration & APIs
├── utils/               # Utilities
│   └── AuthContext.jsx         # Auth context provider
├── App.jsx              # Main app component
└── main.jsx             # Application entry point
```

## Database Schema

### Tables and Relationships

```
Users (Authentication & Authorization)
├── Id (PK)
├── Username (Unique)
├── PasswordHash
├── FullName
├── Email (Unique)
├── Role (Admin/Manager/Cashier)
├── CreatedAt
└── IsActive

Products (Inventory Management)
├── Id (PK)
├── Name
├── Description
├── Price
├── StockQuantity
├── Category
├── CreatedAt
├── UpdatedAt
└── IsActive

Sales (Transaction Records)
├── Id (PK)
├── SaleDate
├── TotalAmount
├── CashierName
├── UserId (FK → Users)
├── PaymentMethod
└── SaleItems (1:N → SaleItems)

SaleItems (Line Items)
├── Id (PK)
├── SaleId (FK → Sales)
├── ProductId (FK → Products)
├── Quantity
├── UnitPrice
└── Subtotal

DailySummaries (Aggregated Stats)
├── Id (PK)
├── Date (Unique)
├── TotalRevenue
├── TotalTransactions
├── TotalItemsSold
├── AverageTransactionValue
├── TopSellingProduct
└── GeneratedAt
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Products (CRUD)
- `GET /api/products` - List all products
- `GET /api/products/{id}` - Get product details
- `POST /api/products` - Create product [Admin/Manager]
- `PUT /api/products/{id}` - Update product [Admin/Manager]
- `DELETE /api/products/{id}` - Deactivate product [Admin]

### Sales
- `GET /api/sales` - List sales (with date filtering)
- `GET /api/sales/{id}` - Get sale details
- `POST /api/sales` - Create new sale
- `GET /api/sales/today` - Get today's sales summary

### Reports
- `GET /api/reports/daily-summary` - Daily statistics
- `GET /api/reports/summary-range` - Date range summary
- `GET /api/reports/top-products` - Best selling products

## Security Features

### Authentication
- JWT Bearer token authentication
- Secure password hashing with BCrypt (cost factor: 11)
- Token expiration (8 hours)
- Protected routes requiring authentication

### Authorization
- Role-based access control (RBAC)
- Three roles: Admin, Manager, Cashier
- Route-level authorization
- Action-level permissions

### Data Protection
- SQL injection prevention via parameterized queries (EF Core)
- XSS prevention via React's built-in escaping
- CORS configuration for specific origins
- HTTPS redirection in production

## Key Features

### 1. User Management
- Secure registration and login
- Role-based access control
- Password reset capability (extensible)

### 2. Product Management
- Full CRUD operations
- Stock tracking
- Category organization
- Active/inactive status

### 3. Point of Sale
- Real-time product search
- Shopping cart functionality
- Stock validation
- Multiple payment methods
- Transaction history

### 4. Sales Tracking
- Complete transaction records
- Date range filtering
- Detailed item breakdown
- Payment method tracking

### 5. Reporting & Analytics
- Daily revenue summaries
- Transaction statistics
- Top selling products
- Payment method analytics
- Low stock alerts

## Performance Considerations

### Backend Optimizations
- Async/await for all database operations
- Eager loading for related entities
- Indexed database columns (Username, Email, Date)
- Connection pooling (EF Core default)

### Frontend Optimizations
- Code splitting with Vite
- Lazy loading of components
- CSS optimization and minification
- Build-time optimization

## Scalability

### Horizontal Scaling
- Stateless API design
- JWT tokens (no server session)
- Database connection pooling
- Containerization-ready

### Vertical Scaling
- Efficient database queries
- Proper indexing strategy
- Memory-efficient operations
- Async processing

## Future Enhancements

### Potential Features
1. Email notifications for low stock
2. Customer loyalty program
3. Multi-store support
4. Advanced analytics dashboard
5. Receipt printing
6. Barcode scanning
7. Inventory forecasting
8. Supplier management
9. Employee shift tracking
10. Mobile app version

### Technical Improvements
1. Redis caching layer
2. Message queue for async operations
3. Microservices architecture
4. GraphQL API
5. Real-time updates with SignalR
6. Automated testing suite
7. CI/CD pipeline
8. Docker containerization
9. Kubernetes orchestration
10. Cloud deployment (Azure/AWS)

## Maintenance

### Regular Tasks
- Database backup and maintenance
- Log monitoring and cleanup
- Security updates
- Performance monitoring
- User access review

### Monitoring
- Application logs
- Error tracking
- Performance metrics
- Database health
- API response times

## Deployment

### Development
```bash
# Backend
cd Backend/BakeryAPI
dotnet run

# Frontend
cd Frontend
npm run dev
```

### Production
```bash
# Backend
dotnet publish -c Release
# Deploy to IIS, Azure App Service, or Docker

# Frontend
npm run build
# Deploy to static hosting, CDN, or integrated with backend
```

## License

This project is for educational and demonstration purposes.

## Support

For issues or questions, please refer to:
- README.md for setup instructions
- QUICKSTART.md for quick start guide
- This document for architecture details
