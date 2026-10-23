using DiyStore.Api.Auth;
using DiyStore.Api.Catalog;
using DiyStore.Api.Domain;
using DiyStore.Api.Identity;
using DiyStore.Api.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DiyStore.Api.Admin;

[ApiController]
[Route("api/admin/products")]
[Authorize(Roles = Roles.Admin)]
public class AdminProductsController(AppDbContext db, IImageStorage images) : ControllerBase
{
    // Mai multe poze de pana la 5 MB fiecare depasesc limita implicita de 30 MB a unei cereri
    private const long MaxRequestBytes = 100_000_000;

    private static readonly Dictionary<string, DeliveryMethod> DeliveryByName =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["Courier"] = DeliveryMethod.Courier,
            ["StorePickup"] = DeliveryMethod.StorePickup
        };

    [HttpGet]
    public async Task<ActionResult<List<ProductListItemDto>>> List()
    {
        return await db.Products
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .Select(p => new ProductListItemDto(
                p.Id, p.Name, p.Slug, p.Price, p.Stock,
                p.Subcategory!.Category!.Name, p.Subcategory.Name, p.IsOnSale))
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductDetailDto>> Get(int id)
    {
        var detail = await LoadDetailAsync(id);
        if (detail is null)
            return NotFound(new ErrorResponse(["Product not found."]));

        return detail;
    }

    [HttpPost]
    [RequestSizeLimit(MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxRequestBytes)]
    public async Task<ActionResult<ProductDetailDto>> Create([FromForm] ProductForm form)
    {
        var check = await CheckAsync(form);
        if (check.Errors.Count > 0)
            return BadRequest(new ErrorResponse(check.Errors));

        var name = form.Name.Trim();
        var product = new Product
        {
            Name = name,
            Slug = await UniqueSlugAsync(name, 0)
        };
        Apply(product, form, check.Delivery);
        product.Specifications = BuildSpecifications(form);

        var saved = new List<string>();
        try
        {
            if (check.Logo is not null)
            {
                var logoPath = await images.SaveAsync(check.Logo, "manufacturers");
                saved.Add(logoPath);
                product.ManufacturerLogoPath = logoPath;
            }

            product.Images = await SaveImagesAsync(check.NewImages, saved);

            db.Products.Add(product);
            await db.SaveChangesAsync();
        }
        catch
        {
            foreach (var path in saved)
                images.Delete(path);
            throw;
        }

        var detail = await LoadDetailAsync(product.Id);
        return CreatedAtAction(nameof(Get), new { id = product.Id }, detail);
    }

    [HttpPut("{id:int}")]
    [RequestSizeLimit(MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxRequestBytes)]
    public async Task<ActionResult<ProductDetailDto>> Update(int id, [FromForm] ProductForm form)
    {
        var product = await db.Products
            .Include(p => p.Images)
            .Include(p => p.Specifications)
            .AsSplitQuery()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product is null)
            return NotFound(new ErrorResponse(["Product not found."]));

        var check = await CheckAsync(form);
        if (check.Errors.Count > 0)
            return BadRequest(new ErrorResponse(check.Errors));

        // Ca in aplicatia veche, slug-ul urmareste numele produsului
        var name = form.Name.Trim();
        if (name != product.Name)
            product.Slug = await UniqueSlugAsync(name, product.Id);
        product.Name = name;
        Apply(product, form, check.Delivery);

        // Specificatiile se inlocuiesc cu lista din formular
        db.ProductSpecifications.RemoveRange(product.Specifications.ToList());
        product.Specifications.Clear();
        product.Specifications.AddRange(BuildSpecifications(form));

        var saved = new List<string>();
        string? oldLogo = null;
        var oldImagePaths = new List<string>();
        try
        {
            if (check.Logo is not null)
            {
                var logoPath = await images.SaveAsync(check.Logo, "manufacturers");
                saved.Add(logoPath);
                oldLogo = product.ManufacturerLogoPath;
                product.ManufacturerLogoPath = logoPath;
            }

            // Poze noi inlocuiesc toate pozele existente; fara poze noi, cele existente raman
            if (check.NewImages.Count > 0)
            {
                oldImagePaths = product.Images.Select(i => i.Path).ToList();
                db.ProductImages.RemoveRange(product.Images.ToList());
                product.Images.Clear();
                product.Images.AddRange(await SaveImagesAsync(check.NewImages, saved));
            }

            await db.SaveChangesAsync();
        }
        catch
        {
            foreach (var path in saved)
                images.Delete(path);
            throw;
        }

        images.Delete(oldLogo);
        foreach (var path in oldImagePaths)
            images.Delete(path);

        var detail = await LoadDetailAsync(product.Id);
        return detail!;
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await db.Products
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product is null)
            return NotFound(new ErrorResponse(["Product not found."]));

        var files = product.Images.Select(i => (string?)i.Path).ToList();
        files.Add(product.ManufacturerLogoPath);

        db.Products.Remove(product);
        await db.SaveChangesAsync();

        foreach (var file in files)
            images.Delete(file);

        return NoContent();
    }

    // ── Ajutoare ─────────────────────────────────────────────────────────────

    private sealed record Checked(
        List<string> Errors, DeliveryMethod Delivery, List<IFormFile> NewImages, IFormFile? Logo);

    /// <summary>Verificarile care nu pot fi exprimate prin atribute: livrare, specificatii, imagini, subcategorie.</summary>
    private async Task<Checked> CheckAsync(ProductForm form)
    {
        var errors = new List<string>();

        var delivery = DeliveryMethod.None;
        foreach (var methodName in form.DeliveryMethods.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            if (DeliveryByName.TryGetValue(methodName, out var method))
                delivery |= method;
            else
                errors.Add($"Unknown delivery method '{methodName}'.");
        }

        if (delivery == DeliveryMethod.None && errors.Count == 0)
            errors.Add("Select at least one delivery method.");

        foreach (var spec in form.Specifications)
        {
            var specName = spec.Name?.Trim() ?? "";
            var specValue = spec.Value?.Trim() ?? "";

            if (specName.Length == 0 && specValue.Length == 0)
                continue;

            if (specName.Length == 0 || specValue.Length == 0)
            {
                errors.Add("Each specification needs both a name and a value.");
                break;
            }

            if (specName.Length > 100)
            {
                errors.Add("Specification name cannot exceed 100 characters.");
                break;
            }

            if (specValue.Length > 300)
            {
                errors.Add("Specification value cannot exceed 300 characters.");
                break;
            }
        }

        var newImages = form.Images.Where(f => f.Length > 0).ToList();
        var logo = form.ManufacturerLogo is { Length: > 0 } ? form.ManufacturerLogo : null;

        var files = new List<IFormFile>(newImages);
        if (logo is not null)
            files.Add(logo);

        foreach (var file in files)
        {
            var problem = images.Validate(file);
            if (problem is not null)
                errors.Add(problem);
        }

        if (form.SubcategoryId is int subcategoryId &&
            !await db.Subcategories.AnyAsync(s => s.Id == subcategoryId))
        {
            errors.Add("Please select a valid subcategory.");
        }

        return new Checked(errors, delivery, newImages, logo);
    }

    private static void Apply(Product product, ProductForm form, DeliveryMethod delivery)
    {
        product.Description = form.Description?.Trim() ?? "";
        product.Price = form.Price!.Value;
        product.PreviousPrice = form.PreviousPrice;
        product.IsOnSale = form.IsOnSale;
        product.Stock = form.Stock!.Value;
        product.ManufacturerName = form.ManufacturerName?.Trim() ?? "";
        product.SubcategoryId = form.SubcategoryId!.Value;
        product.DeliveryMethods = delivery;
    }

    private static List<ProductSpecification> BuildSpecifications(ProductForm form) =>
        form.Specifications
            .Where(s => !string.IsNullOrWhiteSpace(s.Name) && !string.IsNullOrWhiteSpace(s.Value))
            .Select(s => new ProductSpecification { Name = s.Name!.Trim(), Value = s.Value!.Trim() })
            .ToList();

    private async Task<List<ProductImage>> SaveImagesAsync(List<IFormFile> files, List<string> savedPaths)
    {
        var result = new List<ProductImage>();
        for (var i = 0; i < files.Count; i++)
        {
            var path = await images.SaveAsync(files[i], "products");
            savedPaths.Add(path);
            result.Add(new ProductImage { Path = path, IsMain = i == 0, SortOrder = i });
        }

        return result;
    }

    private Task<string> UniqueSlugAsync(string name, int excludeId)
    {
        var baseSlug = Slugs.From(name, "product", 250);
        return Slugs.UniqueAsync(baseSlug, candidate =>
            db.Products.AnyAsync(p => p.Slug == candidate && p.Id != excludeId));
    }

    private async Task<ProductDetailDto?> LoadDetailAsync(int id)
    {
        var product = await db.Products
            .AsNoTracking()
            .Include(p => p.Subcategory)
            .Include(p => p.Images)
            .Include(p => p.Specifications)
            .AsSplitQuery()
            .FirstOrDefaultAsync(p => p.Id == id);

        return product is null ? null : ToDetail(product);
    }

    private static ProductDetailDto ToDetail(Product p) => new(
        p.Id, p.Name, p.Slug, p.Description,
        p.Price, p.PreviousPrice, p.IsOnSale, p.Stock,
        p.ManufacturerName, p.ManufacturerLogoPath,
        p.Subcategory?.CategoryId ?? 0, p.SubcategoryId,
        DeliveryNames(p.DeliveryMethods),
        p.Images.OrderBy(i => i.SortOrder).Select(i => new ImageDto(i.Id, i.Path)).ToList(),
        p.Specifications.OrderBy(s => s.Id).Select(s => new SpecificationDto(s.Name, s.Value)).ToList());

    private static List<string> DeliveryNames(DeliveryMethod methods) =>
        DeliveryByName
            .Where(pair => methods.HasFlag(pair.Value))
            .Select(pair => pair.Key)
            .ToList();
}
