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
[Route("api/admin/categories")]
[Authorize(Roles = Roles.Admin)]
public class AdminCategoriesController(AppDbContext db, IImageStorage images) : ControllerBase
{
    private const string SlugTaken = "A category with this slug already exists.";

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> List()
    {
        var categories = await db.Categories
            .AsNoTracking()
            .Include(c => c.Subcategories)
            .OrderBy(c => c.Id)
            .ToListAsync();

        return categories.Select(c => c.ToDto()).ToList();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CategoryDto>> Get(int id)
    {
        var category = await db.Categories
            .AsNoTracking()
            .Include(c => c.Subcategories)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category is null)
            return NotFound(new ErrorResponse(["Category not found."]));

        return category.ToDto();
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create([FromForm] CategoryForm form)
    {
        var slug = form.Slug.Trim();
        if (await db.Categories.AnyAsync(c => c.Slug == slug))
            return BadRequest(new ErrorResponse([SlugTaken]));

        var image = PickImage(form.Image);
        var problem = image is null ? null : images.Validate(image);
        if (problem is not null)
            return BadRequest(new ErrorResponse([problem]));

        var category = new Category { Name = form.Name.Trim(), Slug = slug };

        string? savedPath = null;
        try
        {
            if (image is not null)
            {
                savedPath = await images.SaveAsync(image, "categories");
                category.ImagePath = savedPath;
            }

            db.Categories.Add(category);
            await db.SaveChangesAsync();
        }
        catch
        {
            images.Delete(savedPath);
            throw;
        }

        return CreatedAtAction(nameof(Get), new { id = category.Id }, category.ToDto());
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CategoryDto>> Update(int id, [FromForm] CategoryForm form)
    {
        var category = await db.Categories
            .Include(c => c.Subcategories)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category is null)
            return NotFound(new ErrorResponse(["Category not found."]));

        var slug = form.Slug.Trim();
        if (await db.Categories.AnyAsync(c => c.Slug == slug && c.Id != id))
            return BadRequest(new ErrorResponse([SlugTaken]));

        var image = PickImage(form.Image);
        var problem = image is null ? null : images.Validate(image);
        if (problem is not null)
            return BadRequest(new ErrorResponse([problem]));

        string? newPath = null;
        string? oldPath = null;
        try
        {
            if (image is not null)
            {
                newPath = await images.SaveAsync(image, "categories");
                oldPath = category.ImagePath;
                category.ImagePath = newPath;
            }

            category.Name = form.Name.Trim();
            category.Slug = slug;
            await db.SaveChangesAsync();
        }
        catch
        {
            images.Delete(newPath);
            throw;
        }

        images.Delete(oldPath);
        return category.ToDto();
    }

    /// <summary>Sterge categoria impreuna cu subcategoriile si produsele ei (cascada, ca in aplicatia veche).</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var category = await db.Categories
            .Include(c => c.Subcategories)
                .ThenInclude(s => s.Products)
                    .ThenInclude(p => p.Images)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category is null)
            return NotFound(new ErrorResponse(["Category not found."]));

        var files = new List<string?> { category.ImagePath };
        foreach (var subcategory in category.Subcategories)
        {
            files.Add(subcategory.ImagePath);
            foreach (var product in subcategory.Products)
            {
                files.Add(product.ManufacturerLogoPath);
                files.AddRange(product.Images.Select(i => (string?)i.Path));
            }
        }

        db.Categories.Remove(category);
        await db.SaveChangesAsync();

        foreach (var file in files)
            images.Delete(file);

        return NoContent();
    }

    private static IFormFile? PickImage(IFormFile? file) =>
        file is { Length: > 0 } ? file : null;
}
