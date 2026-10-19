using System.Security.Claims;
using System.Text;
using DiyStore.Api.Identity;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace DiyStore.Api.Auth;

public interface ITokenService
{
    (string Token, DateTime ExpiresAt) Create(AppUser user, IEnumerable<string> roles);
}

/// <summary>Genereaza token-ul JWT cu claim-urile sub, name, email si role.</summary>
public class TokenService(IConfiguration config) : ITokenService
{
    public (string Token, DateTime ExpiresAt) Create(AppUser user, IEnumerable<string> roles)
    {
        var minutes = config.GetValue<int>("Jwt:ExpiresMinutes", 60);
        var expires = DateTime.UtcNow.AddMinutes(minutes);

        var claims = new List<Claim>
        {
            new("sub", user.Id),
            new("name", user.UserName ?? ""),
            new("email", user.Email ?? "")
        };
        claims.AddRange(roles.Select(role => new Claim("role", role)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Issuer = config["Jwt:Issuer"],
            Audience = config["Jwt:Audience"],
            Expires = expires,
            SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        };

        var token = new JsonWebTokenHandler().CreateToken(descriptor);
        return (token, expires);
    }
}
