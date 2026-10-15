using DiyStore.Api.Identity;
using Microsoft.AspNetCore.Identity;

namespace DiyStore.Api.Persistence;

/// <summary>Creeaza rolurile si contul de administrator la prima pornire.</summary>
public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services, IConfiguration config)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<AppUser>>();

        foreach (var role in new[] { Roles.Admin, Roles.Customer })
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        var email = config["Seed:AdminEmail"];
        var password = config["Seed:AdminPassword"];
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            return; // fara cont implicit daca nu e configurat

        if (await userManager.FindByEmailAsync(email) is not null)
            return;

        var admin = new AppUser { UserName = email, Email = email, EmailConfirmed = true };
        var created = await userManager.CreateAsync(admin, password);
        if (!created.Succeeded)
            throw new InvalidOperationException(
                "Nu s-a putut crea administratorul: " +
                string.Join("; ", created.Errors.Select(e => e.Description)));

        await userManager.AddToRoleAsync(admin, Roles.Admin);
    }
}
