using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using BakeryAPI.Data;
using BakeryAPI.DTOs;
using BakeryAPI.Models;

namespace BakeryAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SalesController : ControllerBase
{
    private readonly BakeryDbContext _context;

    public SalesController(BakeryDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SaleResponseDto>>> GetSales(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var query = _context.Sales
            .Include(s => s.SaleItems)
            .ThenInclude(si => si.Product)
            .AsQueryable();

        if (startDate.HasValue)
        {
            query = query.Where(s => s.SaleDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(s => s.SaleDate <= endDate.Value);
        }

        var sales = await query.OrderByDescending(s => s.SaleDate).ToListAsync();

        var response = sales.Select(s => new SaleResponseDto
        {
            Id = s.Id,
            SaleDate = s.SaleDate,
            TotalAmount = s.TotalAmount,
            CashierName = s.CashierName,
            PaymentMethod = s.PaymentMethod,
            Items = s.SaleItems.Select(si => new SaleItemResponseDto
            {
                ProductId = si.ProductId,
                ProductName = si.Product?.Name ?? "",
                Quantity = si.Quantity,
                UnitPrice = si.UnitPrice,
                Subtotal = si.Subtotal
            }).ToList()
        }).ToList();

        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SaleResponseDto>> GetSale(int id)
    {
        var sale = await _context.Sales
            .Include(s => s.SaleItems)
            .ThenInclude(si => si.Product)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (sale == null)
        {
            return NotFound();
        }

        var response = new SaleResponseDto
        {
            Id = sale.Id,
            SaleDate = sale.SaleDate,
            TotalAmount = sale.TotalAmount,
            CashierName = sale.CashierName,
            PaymentMethod = sale.PaymentMethod,
            Items = sale.SaleItems.Select(si => new SaleItemResponseDto
            {
                ProductId = si.ProductId,
                ProductName = si.Product?.Name ?? "",
                Quantity = si.Quantity,
                UnitPrice = si.UnitPrice,
                Subtotal = si.Subtotal
            }).ToList()
        };

        return Ok(response);
    }

    [HttpPost]
    public async Task<ActionResult<SaleResponseDto>> CreateSale([FromBody] CreateSaleDto createSaleDto)
    {
        if (createSaleDto.Items == null || !createSaleDto.Items.Any())
        {
            return BadRequest(new { message = "Sale must have at least one item" });
        }

        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

        var sale = new Sale
        {
            SaleDate = DateTime.UtcNow,
            CashierName = createSaleDto.CashierName,
            PaymentMethod = createSaleDto.PaymentMethod,
            UserId = userId
        };

        decimal totalAmount = 0;

        foreach (var itemDto in createSaleDto.Items)
        {
            var product = await _context.Products.FindAsync(itemDto.ProductId);

            if (product == null)
            {
                return BadRequest(new { message = $"Product with ID {itemDto.ProductId} not found" });
            }

            if (product.StockQuantity < itemDto.Quantity)
            {
                return BadRequest(new { message = $"Insufficient stock for {product.Name}" });
            }

            var subtotal = product.Price * itemDto.Quantity;
            totalAmount += subtotal;

            var saleItem = new SaleItem
            {
                ProductId = itemDto.ProductId,
                Quantity = itemDto.Quantity,
                UnitPrice = product.Price,
                Subtotal = subtotal
            };

            sale.SaleItems.Add(saleItem);

            // Update stock
            product.StockQuantity -= itemDto.Quantity;
        }

        sale.TotalAmount = totalAmount;

        _context.Sales.Add(sale);
        await _context.SaveChangesAsync();

        // Reload to get navigation properties
        await _context.Entry(sale)
            .Collection(s => s.SaleItems)
            .Query()
            .Include(si => si.Product)
            .LoadAsync();

        var response = new SaleResponseDto
        {
            Id = sale.Id,
            SaleDate = sale.SaleDate,
            TotalAmount = sale.TotalAmount,
            CashierName = sale.CashierName,
            PaymentMethod = sale.PaymentMethod,
            Items = sale.SaleItems.Select(si => new SaleItemResponseDto
            {
                ProductId = si.ProductId,
                ProductName = si.Product?.Name ?? "",
                Quantity = si.Quantity,
                UnitPrice = si.UnitPrice,
                Subtotal = si.Subtotal
            }).ToList()
        };

        return CreatedAtAction(nameof(GetSale), new { id = sale.Id }, response);
    }

    [HttpGet("today")]
    public async Task<ActionResult<object>> GetTodaySales()
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var sales = await _context.Sales
            .Where(s => s.SaleDate >= today && s.SaleDate < tomorrow)
            .Include(s => s.SaleItems)
            .ToListAsync();

        var totalRevenue = sales.Sum(s => s.TotalAmount);
        var totalTransactions = sales.Count;
        var totalItems = sales.SelectMany(s => s.SaleItems).Sum(si => si.Quantity);

        return Ok(new
        {
            date = today,
            totalRevenue,
            totalTransactions,
            totalItems,
            sales = sales.Select(s => new SaleResponseDto
            {
                Id = s.Id,
                SaleDate = s.SaleDate,
                TotalAmount = s.TotalAmount,
                CashierName = s.CashierName,
                PaymentMethod = s.PaymentMethod,
                Items = s.SaleItems.Select(si => new SaleItemResponseDto
                {
                    ProductId = si.ProductId,
                    ProductName = si.Product?.Name ?? "",
                    Quantity = si.Quantity,
                    UnitPrice = si.UnitPrice,
                    Subtotal = si.Subtotal
                }).ToList()
            }).ToList()
        });
    }
}
