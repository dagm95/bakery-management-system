using Microsoft.EntityFrameworkCore;
using BakeryAPI.Models;

namespace BakeryAPI.Data;

public class BakeryDbContext : DbContext
{
    public BakeryDbContext(DbContextOptions<BakeryDbContext> options) : base(options)
    {
    }

    public DbSet<Product> Products { get; set; }
    public DbSet<Sale> Sales { get; set; }
    public DbSet<SaleItem> SaleItems { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<DailySummary> DailySummaries { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Product
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Price).HasPrecision(18, 2);
        });

        // Configure Sale
        modelBuilder.Entity<Sale>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TotalAmount).HasPrecision(18, 2);
            entity.HasOne(e => e.User)
                .WithMany(u => u.Sales)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure SaleItem
        modelBuilder.Entity<SaleItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
            entity.Property(e => e.Subtotal).HasPrecision(18, 2);
            entity.HasOne(e => e.Sale)
                .WithMany(s => s.SaleItems)
                .HasForeignKey(e => e.SaleId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Product)
                .WithMany()
                .HasForeignKey(e => e.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Username).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
        });

        // Configure DailySummary
        modelBuilder.Entity<DailySummary>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TotalRevenue).HasPrecision(18, 2);
            entity.Property(e => e.AverageTransactionValue).HasPrecision(18, 2);
            entity.HasIndex(e => e.Date).IsUnique();
        });

        // Seed initial data
        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = 1,
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                FullName = "System Administrator",
                Email = "admin@bakery.com",
                Role = "Admin",
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            }
        );

        // Seed sample products
        modelBuilder.Entity<Product>().HasData(
            new Product
            {
                Id = 1,
                Name = "Croissant",
                Description = "Buttery, flaky French pastry",
                Price = 3.50m,
                StockQuantity = 50,
                Category = "Pastries",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            },
            new Product
            {
                Id = 2,
                Name = "Baguette",
                Description = "Traditional French bread",
                Price = 2.75m,
                StockQuantity = 30,
                Category = "Breads",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            },
            new Product
            {
                Id = 3,
                Name = "Chocolate Cake",
                Description = "Rich chocolate layer cake",
                Price = 25.00m,
                StockQuantity = 10,
                Category = "Cakes",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            },
            new Product
            {
                Id = 4,
                Name = "Blueberry Muffin",
                Description = "Moist muffin with fresh blueberries",
                Price = 2.50m,
                StockQuantity = 40,
                Category = "Pastries",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            },
            new Product
            {
                Id = 5,
                Name = "Sourdough Loaf",
                Description = "Artisan sourdough bread",
                Price = 5.50m,
                StockQuantity = 20,
                Category = "Breads",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            },
            new Product
            {
                Id = 6,
                Name = "Chocolate Chip Cookie",
                Description = "Classic cookie with chocolate chips",
                Price = 1.50m,
                StockQuantity = 100,
                Category = "Cookies",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            },
            new Product
            {
                Id = 7,
                Name = "Danish Pastry",
                Description = "Sweet pastry with fruit filling",
                Price = 3.25m,
                StockQuantity = 35,
                Category = "Pastries",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            },
            new Product
            {
                Id = 8,
                Name = "Cinnamon Roll",
                Description = "Soft roll with cinnamon and icing",
                Price = 4.00m,
                StockQuantity = 25,
                Category = "Pastries",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            }
        );
    }
}
