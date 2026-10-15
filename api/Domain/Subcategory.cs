namespace DiyStore.Api.Domain;

/// <summary>Subcategorie, apartine exact unei categorii.</summary>
public class Subcategory
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public string? ImagePath { get; set; }

    public Category? Category { get; set; }
    public List<Product> Products { get; set; } = [];
}
