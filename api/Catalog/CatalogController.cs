using DiyStore.Api.Auth;
using DiyStore.Api.Domain;
using DiyStore.Api.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DiyStore.Api.Catalog;

/// <summary>Rasfoirea catalogului: public, fara autentificare.</summary>
[ApiController]
[Route("api/catalog")]
public class CatalogController(AppDbContext db) : ControllerBase
{
    private static readonly int[] PageSizes = [4, 8, 12];
    private const int DefaultPageSize = 12;
    private const int SimilarCount = 4;
    private const int HomeCategories = 3;
    private const int HomeProducts = 4;

    /// <summary>Toate categoriile cu subcategoriile lor (meniul de categorii).</summary>
    [HttpGet("categories")]
    public async Task<ActionResult<List<PublicCategoryDto>>> Categories()
    {
        var categories = await db.Categories
            .AsNoTracking()
            .Include(c => c.Subcategories)
            .OrderBy(c => c.Id)
            .ToListAsync();

        return categories.Select(c => c.ToPublic()).ToList();
    }

    [HttpGet("categories/{slug}")]
    public async Task<ActionResult<PublicCategoryDto>> Category(string slug)
    {
        var category = await db.Categories
            .AsNoTracking()
            .Include(c => c.Subcategories)
            .FirstOrDefaultAsync(c => c.Slug == slug);

        if (category is null)
            return NotFound(new ErrorResponse(["Category not found."]));

        return category.ToPublic();
    }

    /// <summary>Pagina principala: 3 categorii si 4 produse alese la intamplare.</summary>
    [HttpGet("home")]
    public async Task<ActionResult<HomeDto>> Home()
    {
        var categories = await db.Categories
            .AsNoTracking()
            .Include(c => c.Subcategories)
            .OrderBy(_ => Guid.NewGuid())
            .Take(HomeCategories)
            .ToListAsync();

        var products = await db.Products
            .AsNoTracking()
            .Include(p => p.Images)
            .OrderBy(_ => Guid.NewGuid())
            .Take(HomeProducts)
            .ToListAsync();

        return new HomeDto(
            categories.Select(c => c.ToPublic()).ToList(),
            products.Select(p => p.ToCard()).ToList());
    }

    /// <summary>
    /// Lista de produse. Filtre: categorie (cat), subcategorie (sub), interval de pret, doar produse la
    /// reducere. Paginare cu 4, 8 sau 12 produse pe pagina (implicit 12).
    /// </summary>
    [HttpGet("products")]
    public async Task<ActionResult<ProductPageDto>> Products(
        string? cat, string? sub, decimal? minPrice, decimal? maxPrice,
        bool onSale = false, int perPage = DefaultPageSize, int page = 1)
    {
        var title = await TitleAsync(cat, sub);
        return await PageAsync(db.Products.AsNoTracking(), cat, sub, minPrice, maxPrice, onSale, perPage, page, title);
    }

    /// <summary>Produsele la reducere, optional pe o singura categorie (pagina Promotions).</summary>
    [HttpGet("promotions")]
    public async Task<ActionResult<ProductPageDto>> Promotions(
        string? cat, decimal? minPrice, decimal? maxPrice, int perPage = DefaultPageSize, int page = 1)
    {
        return await PageAsync(db.Products.AsNoTracking(), cat, null, minPrice, maxPrice, true, perPage, page, "Promotions");
    }

    /// <summary>
    /// Cautare in numele si descrierea produselor. Intoarce toate rezultatele pe o singura pagina; o cautare
    /// goala le intoarce pe toate, ca in aplicatia veche.
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<ProductPageDto>> Search(string? q)
    {
        var query = (q ?? "").Trim();

        var items = await db.Products
            .AsNoTracking()
            .Include(p => p.Images)
            .Where(p => p.Name.Contains(query) || p.Description.Contains(query))
            .OrderBy(p => p.Id)
            .ToListAsync();

        var perPage = items.Count > 0 ? items.Count : DefaultPageSize;
        return new ProductPageDto(
            items.Select(p => p.ToCard()).ToList(), items.Count, 1, perPage, 1,
            $"Search results for: {query}");
    }

    [HttpGet("products/{slug}")]
    public async Task<ActionResult<ProductDetailPageDto>> Product(string slug)
    {
        var p = await db.Products
            .AsNoTracking()
            .Include(x => x.Subcategory!).ThenInclude(s => s.Category)
            .Include(x => x.Images)
            .Include(x => x.Specifications)
            .FirstOrDefaultAsync(x => x.Slug == slug);

        if (p?.Subcategory?.Category is null)
            return NotFound(new ErrorResponse(["Product not found."]));

        var similar = await db.Products
            .AsNoTracking()
            .Include(x => x.Images)
            .Where(x => x.SubcategoryId == p.SubcategoryId && x.Id != p.Id)
            .OrderBy(x => x.Id)
            .Take(SimilarCount)
            .ToListAsync();

        var category = p.Subcategory.Category;

        return new ProductDetailPageDto(
            p.Id, p.Name, p.Slug, p.Description,
            p.Price, p.PreviousPrice, p.IsOnSale, p.Stock,
            p.ManufacturerName, p.ManufacturerLogoPath,
            new NamedSlugDto(category.Name, category.Slug),
            new NamedSlugDto(p.Subcategory.Name, p.Subcategory.Slug),
            DeliveryNames(p.DeliveryMethods),
            p.Images.OrderBy(i => i.SortOrder).Select(i => i.Path).ToList(),
            p.Specifications.OrderBy(s => s.Id).Select(s => new SpecificationItemDto(s.Name, s.Value)).ToList(),
            similar.Select(s => s.ToCard()).ToList());
    }

    // ── Ajutoare ─────────────────────────────────────────────────────────────

    private static List<string> DeliveryNames(DeliveryMethod methods)
    {
        var names = new List<string>();
        if (methods.HasFlag(DeliveryMethod.Courier)) names.Add("Courier");
        if (methods.HasFlag(DeliveryMethod.StorePickup)) names.Add("StorePickup");
        return names;
    }

    /// <summary>"All Products", numele categoriei sau "Categorie – Subcategorie".</summary>
    private async Task<string> TitleAsync(string? cat, string? sub)
    {
        if (string.IsNullOrEmpty(cat)) return "All Products";

        var category = await db.Categories.AsNoTracking().FirstOrDefaultAsync(c => c.Slug == cat);
        var title = category?.Name ?? cat;

        if (!string.IsNullOrEmpty(sub))
        {
            var subs = db.Subcategories.AsNoTracking().Where(s => s.Slug == sub);
            if (category is not null)
            {
                var categoryId = category.Id;
                subs = subs.Where(s => s.CategoryId == categoryId);
            }
            var subName = await subs.Select(s => s.Name).FirstOrDefaultAsync();
            title = $"{title} – {subName ?? sub}";
        }

        return title;
    }

    private static async Task<ActionResult<ProductPageDto>> PageAsync(
        IQueryable<Product> products, string? cat, string? sub, decimal? minPrice, decimal? maxPrice,
        bool onSale, int perPage, int page, string title)
    {
        if (!PageSizes.Contains(perPage)) perPage = DefaultPageSize;
        if (page < 1) page = 1;

        if (!string.IsNullOrEmpty(cat))
            products = products.Where(p => p.Subcategory!.Category!.Slug == cat);
        if (!string.IsNullOrEmpty(sub))
            products = products.Where(p => p.Subcategory!.Slug == sub);
        // Un pret minim/maxim de 0 sau mai mic inseamna "fara limita", ca in aplicatia veche
        if (minPrice is > 0)
            products = products.Where(p => p.Price >= minPrice);
        if (maxPrice is > 0)
            products = products.Where(p => p.Price <= maxPrice);
        if (onSale)
            products = products.Where(p => p.IsOnSale);

        var total = await products.CountAsync();
        var items = await products
            .Include(p => p.Images)
            .OrderBy(p => p.Id)
            .Skip((page - 1) * perPage)
            .Take(perPage)
            .ToListAsync();

        var totalPages = (int)Math.Ceiling(total / (double)perPage);

        return new ProductPageDto(items.Select(p => p.ToCard()).ToList(), total, page, perPage, totalPages, title);
    }
}
