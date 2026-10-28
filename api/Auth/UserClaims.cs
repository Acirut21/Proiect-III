using System.Security.Claims;

namespace DiyStore.Api.Auth;

public static class UserClaims
{
    /// <summary>Id-ul utilizatorului autentificat (claim-ul "sub" din token).</summary>
    public static string? UserId(this ClaimsPrincipal user) => user.FindFirst("sub")?.Value;
}
