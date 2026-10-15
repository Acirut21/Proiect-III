namespace DiyStore.Api.Domain;

public class ProductImage
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    /// <summary>Cale relativa fata de wwwroot/images, ex. "products/bormasina.webp".</summary>
    public required string Path { get; set; }
    public bool IsMain { get; set; }
    public int SortOrder { get; set; }

    public Product? Product { get; set; }
}
