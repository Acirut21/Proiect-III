using System.ComponentModel.DataAnnotations;
using DiyStore.Api.Domain;

namespace DiyStore.Api.Admin;

// ── Raspunsuri ───────────────────────────────────────────────────────────────

public record SubcategoryDto(int Id, int CategoryId, string Name, string Slug, string? ImagePath);

public record CategoryDto(int Id, string Name, string Slug, string? ImagePath, IReadOnlyList<SubcategoryDto> Subcategories);

public record ImageDto(int Id, string Path);

public record SpecificationDto(string Name, string Value);

public record ProductListItemDto(
    int Id, string Name, string Slug, decimal Price, int Stock,
    string CategoryName, string SubcategoryName, bool IsOnSale);

public record ProductDetailDto(
    int Id, string Name, string Slug, string Description,
    decimal Price, decimal? PreviousPrice, bool IsOnSale, int Stock,
    string ManufacturerName, string? ManufacturerLogoPath,
    int CategoryId, int SubcategoryId,
    IReadOnlyList<string> DeliveryMethods,
    IReadOnlyList<ImageDto> Images,
    IReadOnlyList<SpecificationDto> Specifications);

public static class AdminMapping
{
    public static SubcategoryDto ToDto(this Subcategory s) =>
        new(s.Id, s.CategoryId, s.Name, s.Slug, s.ImagePath);

    public static CategoryDto ToDto(this Category c) =>
        new(c.Id, c.Name, c.Slug, c.ImagePath,
            c.Subcategories.OrderBy(s => s.Id).Select(s => s.ToDto()).ToList());
}

// ── Formulare (multipart/form-data) ──────────────────────────────────────────

public class CategoryForm
{
    [Required(ErrorMessage = "Category name is required.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 100 characters.")]
    public string Name { get; set; } = "";

    [Required(ErrorMessage = "Slug is required.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Slug must be between 2 and 100 characters.")]
    [RegularExpression(@"^[a-z0-9\-]+$", ErrorMessage = "Slug can only contain lowercase letters, numbers and hyphens.")]
    public string Slug { get; set; } = "";

    public IFormFile? Image { get; set; }
}

public class SubcategoryForm
{
    [Required(ErrorMessage = "Please select a parent category.")]
    [Range(1, int.MaxValue, ErrorMessage = "Please select a valid category.")]
    public int? CategoryId { get; set; }

    [Required(ErrorMessage = "Subcategory name is required.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 100 characters.")]
    public string Name { get; set; } = "";

    public IFormFile? Image { get; set; }
}

public class SpecificationInput
{
    public string? Name { get; set; }
    public string? Value { get; set; }
}

public class ProductForm
{
    [Required(ErrorMessage = "Product name is required.")]
    [StringLength(200, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 200 characters.")]
    public string Name { get; set; } = "";

    [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters.")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Price is required.")]
    [Range(0.01, 99999.99, ErrorMessage = "Price must be between 0.01 and 99999.99 RON.")]
    public decimal? Price { get; set; }

    [Range(0, 99999.99, ErrorMessage = "Old price must be between 0 and 99999.99 RON.")]
    public decimal? PreviousPrice { get; set; }

    public bool IsOnSale { get; set; }

    [Required(ErrorMessage = "Stock quantity is required.")]
    [Range(0, 100000, ErrorMessage = "Stock must be between 0 and 100000.")]
    public int? Stock { get; set; }

    [StringLength(100, ErrorMessage = "Manufacturer name cannot exceed 100 characters.")]
    public string? ManufacturerName { get; set; }

    [Required(ErrorMessage = "Please select a subcategory.")]
    [Range(1, int.MaxValue, ErrorMessage = "Please select a valid subcategory.")]
    public int? SubcategoryId { get; set; }

    /// <summary>Valori acceptate: "Courier", "StorePickup".</summary>
    public List<string> DeliveryMethods { get; set; } = [];

    public List<SpecificationInput> Specifications { get; set; } = [];

    /// <summary>Imaginile produsului; prima este cea principala. Daca lipsesc la editare, imaginile existente raman.</summary>
    public List<IFormFile> Images { get; set; } = [];

    public IFormFile? ManufacturerLogo { get; set; }
}
