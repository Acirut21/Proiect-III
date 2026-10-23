using DiyStore.Api.Domain;

namespace DiyStore.Api.Catalog;

// Raspunsurile API-ului public (rasfoire). Calea imaginilor este relativa la /images.

public record PublicSubcategoryDto(int Id, string Name, string Slug, string? ImagePath);

public record PublicCategoryDto(
    int Id, string Name, string Slug, string? ImagePath,
    IReadOnlyList<PublicSubcategoryDto> Subcategories);

/// <summary>Datele afisate pe cardul unui produs din lista.</summary>
public record ProductCardDto(
    int Id, string Name, string Slug,
    decimal Price, decimal? PreviousPrice, bool IsOnSale, int Stock,
    IReadOnlyList<string> Images);

public record ProductPageDto(
    IReadOnlyList<ProductCardDto> Items,
    int TotalCount, int Page, int PerPage, int TotalPages,
    string Title);

public record NamedSlugDto(string Name, string Slug);

public record SpecificationItemDto(string Name, string Value);

public record ProductDetailPageDto(
    int Id, string Name, string Slug, string Description,
    decimal Price, decimal? PreviousPrice, bool IsOnSale, int Stock,
    string ManufacturerName, string? ManufacturerLogoPath,
    NamedSlugDto Category, NamedSlugDto Subcategory,
    IReadOnlyList<string> DeliveryMethods,
    IReadOnlyList<string> Images,
    IReadOnlyList<SpecificationItemDto> Specifications,
    IReadOnlyList<ProductCardDto> Similar);

public record HomeDto(
    IReadOnlyList<PublicCategoryDto> Categories,
    IReadOnlyList<ProductCardDto> FeaturedProducts);

public static class CatalogMapping
{
    public static PublicSubcategoryDto ToPublic(this Subcategory s) =>
        new(s.Id, s.Name, s.Slug, s.ImagePath);

    public static PublicCategoryDto ToPublic(this Category c) =>
        new(c.Id, c.Name, c.Slug, c.ImagePath,
            c.Subcategories.OrderBy(s => s.Id).Select(s => s.ToPublic()).ToList());

    public static ProductCardDto ToCard(this Product p) =>
        new(p.Id, p.Name, p.Slug, p.Price, p.PreviousPrice, p.IsOnSale, p.Stock,
            p.Images.OrderBy(i => i.SortOrder).Select(i => i.Path).ToList());
}
