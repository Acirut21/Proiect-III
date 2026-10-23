using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace DiyStore.Api.Catalog;

public static class Slugs
{
    // Loc rezervat pentru sufixul "-2", "-3" etc. adaugat cand slug-ul exista deja
    private const int SuffixRoom = 8;

    /// <summary>
    /// Genereaza un slug dintr-un text: litere mici, fara diacritice, doar a-z, 0-9 si cratime.
    /// Daca nu ramane nimic (de exemplu textul contine doar simboluri) se foloseste <paramref name="fallback"/>.
    /// </summary>
    public static string From(string text, string fallback, int maxLength)
    {
        var decomposed = text.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);
        foreach (var c in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                builder.Append(c);
        }

        var slug = builder.ToString().ToLowerInvariant();
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-");
        slug = Regex.Replace(slug, "-{2,}", "-");
        slug = slug.Trim('-');

        var limit = maxLength - SuffixRoom;
        if (slug.Length > limit)
            slug = slug[..limit].TrimEnd('-');

        return slug.Length == 0 ? fallback : slug;
    }

    /// <summary>Adauga -2, -3 etc. pana cand slug-ul nu mai exista.</summary>
    public static async Task<string> UniqueAsync(string baseSlug, Func<string, Task<bool>> existsAsync)
    {
        var candidate = baseSlug;
        for (var number = 2; await existsAsync(candidate); number++)
        {
            candidate = $"{baseSlug}-{number}";
        }
        return candidate;
    }
}
