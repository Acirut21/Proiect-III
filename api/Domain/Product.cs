namespace DiyStore.Api.Domain;

public class Product
{
    public int Id { get; set; }
    public int SubcategoryId { get; set; }

    public required string Name { get; set; }
    public required string Slug { get; set; }
    public string Description { get; set; } = "";

    public decimal Price { get; set; }
    /// <summary>Pretul dinaintea reducerii, afisat taiat langa pretul curent.</summary>
    public decimal? PreviousPrice { get; set; }
    public bool IsOnSale { get; set; }

    public int Stock { get; set; }

    /// <summary>Producatorul produsului; in aplicatie joaca si rolul de "furnizor".</summary>
    public string ManufacturerName { get; set; } = "";
    public string? ManufacturerLogoPath { get; set; }

    public Subcategory? Subcategory { get; set; }
    public List<ProductImage> Images { get; set; } = [];
    public List<ProductSpecification> Specifications { get; set; } = [];
}
