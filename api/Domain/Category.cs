namespace DiyStore.Api.Domain;

/// <summary>Categorie principala a catalogului (ex. "Scule electrice").</summary>
public class Category
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public string? ImagePath { get; set; }

    public List<Subcategory> Subcategories { get; set; } = [];
}
