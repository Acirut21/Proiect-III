namespace DiyStore.Api.Domain;

/// <summary>O specificatie tehnica de tip nume/valoare, ex. "Putere" = "750 W".</summary>
public class ProductSpecification
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public required string Name { get; set; }
    public required string Value { get; set; }

    public Product? Product { get; set; }
}
