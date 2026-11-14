namespace DiyStore.Api.Shopping;

public record CartLineRequest(int ProductId, int Quantity);

public class CartRequest
{
    public List<CartLineRequest> Items { get; set; } = [];

    /// <summary>"Courier" sau "StorePickup"; daca lipseste sau nu e disponibila, se alege prima disponibila.</summary>
    public string? DeliveryMethod { get; set; }
}

/// <param name="Problem">null, "OutOfStock" (stoc 0) sau "NotEnough" (cantitatea cere mai mult decat stocul).</param>
public record CartLineDto(
    int ProductId, string Slug, string Name, string? ImagePath,
    decimal UnitPrice, int Quantity, int Stock, decimal Subtotal, string? Problem);

public record DeliveryOptionDto(string Method, decimal Cost);

public record CartSummaryDto(
    IReadOnlyList<CartLineDto> Lines,
    IReadOnlyList<int> RemovedProductIds,
    decimal Subtotal,
    IReadOnlyList<DeliveryOptionDto> DeliveryOptions,
    string? DeliveryMethod,
    decimal ShippingCost,
    decimal Total,
    bool DeliveryConflict,
    bool CanCheckout);
