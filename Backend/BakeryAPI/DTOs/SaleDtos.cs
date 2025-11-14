namespace BakeryAPI.DTOs;

public class CreateSaleDto
{
    public string CashierName { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = "Cash";
    public List<SaleItemDto> Items { get; set; } = new();
}

public class SaleItemDto
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
}

public class SaleResponseDto
{
    public int Id { get; set; }
    public DateTime SaleDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string CashierName { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public List<SaleItemResponseDto> Items { get; set; } = new();
}

public class SaleItemResponseDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
}
