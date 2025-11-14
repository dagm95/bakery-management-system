using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BakeryAPI.Data;
using BakeryAPI.Models;

namespace BakeryAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Manager")]
public class ReportsController : ControllerBase
{
    private readonly BakeryDbContext _context;

    public ReportsController(BakeryDbContext context)
    {
        _context = context;
    }

    [HttpGet("daily-summary")]
    public async Task<ActionResult<object>> GetDailySummary([FromQuery] DateTime? date = null)
    {
        var targetDate = date?.Date ?? DateTime.UtcNow.Date;
        var nextDay = targetDate.AddDays(1);

        var sales = await _context.Sales
            .Where(s => s.SaleDate >= targetDate && s.SaleDate < nextDay)
            .Include(s => s.SaleItems)
            .ThenInclude(si => si.Product)
            .ToListAsync();

        var totalRevenue = sales.Sum(s => s.TotalAmount);
        var totalTransactions = sales.Count;
        var totalItemsSold = sales.SelectMany(s => s.SaleItems).Sum(si => si.Quantity);
        var averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

        var productSales = sales
            .SelectMany(s => s.SaleItems)
            .GroupBy(si => si.Product?.Name ?? "Unknown")
            .Select(g => new
            {
                productName = g.Key,
                quantitySold = g.Sum(si => si.Quantity),
                revenue = g.Sum(si => si.Subtotal)
            })
            .OrderByDescending(p => p.quantitySold)
            .ToList();

        var topSellingProduct = productSales.FirstOrDefault()?.productName ?? "None";

        return Ok(new
        {
            date = targetDate,
            totalRevenue,
            totalTransactions,
            totalItemsSold,
            averageTransactionValue,
            topSellingProduct,
            productSales,
            salesByPaymentMethod = sales
                .GroupBy(s => s.PaymentMethod)
                .Select(g => new { paymentMethod = g.Key, count = g.Count(), total = g.Sum(s => s.TotalAmount) })
                .ToList()
        });
    }

    [HttpGet("summary-range")]
    public async Task<ActionResult<object>> GetSummaryRange(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var sales = await _context.Sales
            .Where(s => s.SaleDate >= startDate && s.SaleDate <= endDate)
            .Include(s => s.SaleItems)
            .ThenInclude(si => si.Product)
            .ToListAsync();

        var totalRevenue = sales.Sum(s => s.TotalAmount);
        var totalTransactions = sales.Count;
        var totalItemsSold = sales.SelectMany(s => s.SaleItems).Sum(si => si.Quantity);
        var averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

        var dailyBreakdown = sales
            .GroupBy(s => s.SaleDate.Date)
            .Select(g => new
            {
                date = g.Key,
                revenue = g.Sum(s => s.TotalAmount),
                transactions = g.Count(),
                items = g.SelectMany(s => s.SaleItems).Sum(si => si.Quantity)
            })
            .OrderBy(d => d.date)
            .ToList();

        return Ok(new
        {
            startDate,
            endDate,
            totalRevenue,
            totalTransactions,
            totalItemsSold,
            averageTransactionValue,
            dailyBreakdown
        });
    }

    [HttpGet("top-products")]
    public async Task<ActionResult<object>> GetTopProducts(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] int limit = 10)
    {
        var query = _context.SaleItems
            .Include(si => si.Product)
            .Include(si => si.Sale)
            .AsQueryable();

        if (startDate.HasValue)
        {
            query = query.Where(si => si.Sale!.SaleDate >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(si => si.Sale!.SaleDate <= endDate.Value);
        }

        var topProducts = await query
            .GroupBy(si => new { si.ProductId, si.Product!.Name })
            .Select(g => new
            {
                productId = g.Key.ProductId,
                productName = g.Key.Name,
                quantitySold = g.Sum(si => si.Quantity),
                revenue = g.Sum(si => si.Subtotal)
            })
            .OrderByDescending(p => p.quantitySold)
            .Take(limit)
            .ToListAsync();

        return Ok(topProducts);
    }
}
