namespace DiyStore.Api.Catalog;

public interface IImageStorage
{
    /// <summary>Intoarce null daca fisierul e acceptat, altfel mesajul de eroare.</summary>
    string? Validate(IFormFile file);

    /// <summary>Salveaza fisierul in wwwroot/images/{folder} si intoarce calea relativa (ex. "products/ab12.webp").</summary>
    Task<string> SaveAsync(IFormFile file, string folder);

    /// <summary>Sterge un fisier salvat anterior; ignora caile lipsa sau invalide.</summary>
    void Delete(string? relativePath);
}

public class ImageStorage(IWebHostEnvironment env, ILogger<ImageStorage> logger) : IImageStorage
{
    private const long MaxBytes = 5 * 1024 * 1024;
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    private string ImagesRoot =>
        Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "images");

    public string? Validate(IFormFile file)
    {
        var name = Path.GetFileName(file.FileName);
        if (file.Length > MaxBytes)
            return $"The image '{name}' is larger than 5 MB.";

        var extension = Path.GetExtension(name).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            return $"The image '{name}' must be a .jpg, .jpeg, .png, .gif or .webp file.";

        return null;
    }

    public async Task<string> SaveAsync(IFormFile file, string folder)
    {
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var directory = Path.Combine(ImagesRoot, folder);
        Directory.CreateDirectory(directory);

        // Nume unic: doua poze cu acelasi nume nu se mai suprascriu
        var fileName = $"{Guid.NewGuid():N}{extension}";
        await using (var stream = File.Create(Path.Combine(directory, fileName)))
        {
            await file.CopyToAsync(stream);
        }

        return $"{folder}/{fileName}";
    }

    public void Delete(string? relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
            return;

        var root = Path.GetFullPath(ImagesRoot) + Path.DirectorySeparatorChar;
        var fullPath = Path.GetFullPath(Path.Combine(root, relativePath));

        // Protectie: se sterg doar fisiere din folderul de imagini
        if (!fullPath.StartsWith(root, StringComparison.OrdinalIgnoreCase))
            return;

        try
        {
            if (File.Exists(fullPath))
                File.Delete(fullPath);
        }
        catch (IOException ex)
        {
            logger.LogWarning(ex, "Nu s-a putut sterge imaginea {Path}", relativePath);
        }
    }
}
