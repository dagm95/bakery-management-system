namespace BakeryAPI.Models;

public class DailySummary
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public decimal TotalRevenue { get; set; }
    public int TotalTransactions { get; set; }
    public int TotalItemsSold { get; set; }
    public decimal AverageTransactionValue { get; set; }
    public string TopSellingProduct { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}
