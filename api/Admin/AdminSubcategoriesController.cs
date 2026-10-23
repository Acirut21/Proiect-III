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
[Route("api/admin/subcategories")]
[Authorize(Roles = Roles.Admin)]
public class AdminSubcategoriesController(AppDbContext db, IImageStorage images) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<ActionResult<SubcategoryDto>> Get(int id)
    {
        var subcategory = await db.Subcategories
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id);

        if (subcategory is null)
            return NotFound(new ErrorResponse(["Subcategory not found."]));

        return subcategory.ToDto();
    }

    [HttpPost]
    public async Task<ActionResult<SubcategoryDto>> Create([FromForm] SubcategoryForm form)
    {
        var categoryId = form.CategoryId!.Value;
        if (!await db.Categories.AnyAsync(c => c.Id == categoryId))
            return BadRequest(new ErrorResponse(["Please select a valid category."]));

        var image = PickImage(form.Image);
        var problem = image is null ? null : images.Validate(image);
        if (problem is not null)
            return BadRequest(new ErrorResponse([problem]));

        var name = form.Name.Trim();
        var subcategory = new Subcategory
        {
            CategoryId = categoryId,
            Name = name,
            Slug = await UniqueSlugAsync(name, categoryId, 0)
        };

        string? savedPath = null;
        try
        {
            if (image is not null)
            {
                savedPath = await images.SaveAsync(image, "subcategories");
                subcategory.ImagePath = savedPath;
            }

            db.Subcategories.Add(subcategory);
            await db.SaveChangesAsync();
        }
        catch
        {
            images.Delete(savedPath);
            throw;
        }

        return CreatedAtAction(nameof(Get), new { id = subcategory.Id }, subcategory.ToDto());
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<SubcategoryDto>> Update(int id, [FromForm] SubcategoryForm form)
    {
        var subcategory = await db.Subcategories.FirstOrDefaultAsync(s => s.Id == id);
        if (subcategory is null)
            return NotFound(new ErrorResponse(["Subcategory not found."]));

        var categoryId = form.CategoryId!.Value;
        if (!await db.Categories.AnyAsync(c => c.Id == categoryId))
            return BadRequest(new ErrorResponse(["Please select a valid category."]));

        var image = PickImage(form.Image);
        var problem = image is null ? null : images.Validate(image);
        if (problem is not null)
            return BadRequest(new ErrorResponse([problem]));

        var name = form.Name.Trim();

        // Ca in aplicatia veche, slug-ul urmareste numele; se recalculeaza doar cand se schimba numele sau categoria
        if (name != subcategory.Name || categoryId != subcategory.CategoryId)
            subcategory.Slug = await UniqueSlugAsync(name, categoryId, subcategory.Id);

        subcategory.Name = name;
        subcategory.CategoryId = categoryId;

        string? newPath = null;
        string? oldPath = null;
        try
        {
            if (image is not null)
            {
                newPath = await images.SaveAsync(image, "subcategories");
                oldPath = subcategory.ImagePath;
                subcategory.ImagePath = newPath;
            }

            await db.SaveChangesAsync();
        }
        catch
        {
            images.Delete(newPath);
            throw;
        }

        images.Delete(oldPath);
        return subcategory.ToDto();
    }

    /// <summary>Sterge subcategoria impreuna cu produsele ei (cascada, ca in aplicatia veche).</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var subcategory = await db.Subcategories
            .Include(s => s.Products)
                .ThenInclude(p => p.Images)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (subcategory is null)
            return NotFound(new ErrorResponse(["Subcategory not found."]));

        var files = new List<string?> { subcategory.ImagePath };
        foreach (var product in subcategory.Products)
        {
            files.Add(product.ManufacturerLogoPath);
            files.AddRange(product.Images.Select(i => (string?)i.Path));
        }

        db.Subcategories.Remove(subcategory);
        await db.SaveChangesAsync();

        foreach (var file in files)
            images.Delete(file);

        return NoContent();
    }

    private Task<string> UniqueSlugAsync(string name, int categoryId, int excludeId)
    {
        var baseSlug = Slugs.From(name, "subcategory", 100);
        return Slugs.UniqueAsync(baseSlug, candidate =>
            db.Subcategories.AnyAsync(s =>
                s.CategoryId == categoryId && s.Slug == candidate && s.Id != excludeId));
    }

    private static IFormFile? PickImage(IFormFile? file) =>
        file is { Length: > 0 } ? file : null;
}
