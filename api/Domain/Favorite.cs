using DiyStore.Api.Identity;

namespace DiyStore.Api.Domain;

/// <summary>Un produs adaugat la favorite de un utilizator (cheie compusa: utilizator + produs).</summary>
public class Favorite
{
    public required string UserId { get; set; }
    public int ProductId { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    public AppUser? User { get; set; }
    public Product? Product { get; set; }
}
