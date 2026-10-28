using DiyStore.Api.Auth;
using DiyStore.Api.Catalog;
using DiyStore.Api.Domain;
using DiyStore.Api.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DiyStore.Api.Shopping;

public record FavoriteToggleResult(bool IsFavorite);

/// <summary>Lista de favorite (wish list) a utilizatorului autentificat.</summary>
[ApiController]
[Route("api/favorites")]
[Authorize]
public class FavoritesController(AppDbContext db) : ControllerBase
{
    /// <summary>Produsele favorite, cele adaugate cel mai recent primele.</summary>
    [HttpGet]
    public async Task<ActionResult<List<ProductCardDto>>> List()
    {
        var userId = User.UserId();

        // Ordinea (cele mai recente primele) vine din tabelul de favorite; produsele se aduc dupa aceea
        var ids = await db.Favorites
            .AsNoTracking()
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.AddedAt)
            .Select(f => f.ProductId)
            .ToListAsync();

        var products = await db.Products
            .AsNoTracking()
            .Include(p => p.Images)
            .Where(p => ids.Contains(p.Id))
            .ToListAsync();

        return ids
            .Select(id => products.FirstOrDefault(p => p.Id == id))
            .OfType<Product>()
            .Select(p => p.ToCard())
            .ToList();
    }

    /// <summary>Doar id-urile produselor favorite (pentru inimile din liste).</summary>
    [HttpGet("ids")]
    public async Task<ActionResult<List<int>>> Ids()
    {
        var userId = User.UserId();
        return await db.Favorites
            .AsNoTracking()
            .Where(f => f.UserId == userId)
            .Select(f => f.ProductId)
            .ToListAsync();
    }

    /// <summary>Adauga produsul la favorite sau il scoate, daca era deja acolo.</summary>
    [HttpPost("{productId:int}/toggle")]
    public async Task<ActionResult<FavoriteToggleResult>> Toggle(int productId)
    {
        var userId = User.UserId();
        if (userId is null)
            return Unauthorized();

        var existing = await db.Favorites.FindAsync(userId, productId);
        if (existing is not null)
        {
            db.Favorites.Remove(existing);
            await db.SaveChangesAsync();
            return new FavoriteToggleResult(false);
        }

        if (!await db.Products.AnyAsync(p => p.Id == productId))
            return NotFound(new ErrorResponse(["Product not found."]));

        db.Favorites.Add(new Favorite { UserId = userId, ProductId = productId });
        await db.SaveChangesAsync();
        return new FavoriteToggleResult(true);
    }
}
