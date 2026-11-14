using DiyStore.Api.Domain;
using DiyStore.Api.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DiyStore.Api.Shopping;

/// <summary>Calculeaza sumarul unui cos pe baza preturilor si stocurilor reale din baza de date.</summary>
public class CartCalculator(AppDbContext db)
{
    public async Task<CartSummaryDto> BuildAsync(IEnumerable<CartLineRequest> requested, string? deliveryMethod)
    {
        // Aceleasi produse cerute de mai multe ori se aduna
        var wanted = requested
            .GroupBy(l => l.ProductId)
            .ToDictionary(g => g.Key, g => g.Sum(l => Math.Max(l.Quantity, 1)));

        var ids = wanted.Keys.ToList();
        var products = await db.Products
            .AsNoTracking()
            .Include(p => p.Images)
            .Where(p => ids.Contains(p.Id))
            .ToListAsync();

        var lines = new List<CartLineDto>();
        var delivery = DeliveryMethod.Courier | DeliveryMethod.StorePickup;

        foreach (var id in ids)
        {
            var product = products.FirstOrDefault(p => p.Id == id);
            if (product is null) continue;

            var quantity = wanted[id];
            var problem = product.Stock <= 0 ? "OutOfStock" : quantity > product.Stock ? "NotEnough" : null;
            var image = product.Images.OrderBy(i => i.SortOrder).Select(i => i.Path).FirstOrDefault();

            lines.Add(new CartLineDto(
                product.Id, product.Slug, product.Name, image,
                product.Price, quantity, product.Stock, product.Price * quantity, problem));

            delivery &= product.DeliveryMethods;
        }

        var removed = ids.Where(id => products.All(p => p.Id != id)).ToList();
        var subtotal = lines.Sum(l => l.Subtotal);

        // Metodele de livrare comune tuturor produselor din cos
        var options = new List<DeliveryOptionDto>();
        if (lines.Count > 0)
        {
            foreach (var name in delivery.ToNames())
            {
                DeliveryMethodExtensions.TryParseSingle(name, out var method);
                options.Add(new DeliveryOptionDto(name, ShippingPolicy.Cost(method, subtotal)));
            }
        }

        var selected = options.FirstOrDefault(o => o.Method == deliveryMethod) ?? options.FirstOrDefault();
        var shipping = selected?.Cost ?? 0m;

        return new CartSummaryDto(
            lines, removed, subtotal, options, selected?.Method, shipping, subtotal + shipping,
            DeliveryConflict: lines.Count > 0 && options.Count == 0,
            CanCheckout: lines.Count > 0 && lines.All(l => l.Problem is null) && selected is not null);
    }
}
