using Microsoft.AspNetCore.Identity;

namespace DiyStore.Api.Identity;

public class AppUser : IdentityUser
{
    /// <summary>Adresa de livrare completata la inregistrare.</summary>
    public string Address { get; set; } = "";
}

public static class Roles
{
    public const string Admin = "Admin";
    public const string Customer = "Customer";
}
