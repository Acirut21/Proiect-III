using DiyStore.Api.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace DiyStore.Api.Auth;

[ApiController]
[Route("api/auth")]
public class AuthController(UserManager<AppUser> users, ITokenService tokens) : ControllerBase
{
    /// <summary>Creeaza un cont de client si intoarce direct token-ul (utilizatorul ramane autentificat).</summary>
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var user = new AppUser
        {
            UserName = request.Username.Trim(),
            Email = request.Email.Trim(),
            Address = request.Address.Trim()
        };

        var created = await users.CreateAsync(user, request.Password);
        if (!created.Succeeded)
            return BadRequest(new ErrorResponse(created.Errors.Select(e => e.Description).ToList()));

        await users.AddToRoleAsync(user, Roles.Customer);
        return Ok(await BuildResponseAsync(user));
    }

    /// <summary>Login cu email sau cu username.</summary>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var login = request.Login.Trim();
        var user = await users.FindByEmailAsync(login) ?? await users.FindByNameAsync(login);

        if (user is null || !await users.CheckPasswordAsync(user, request.Password))
            return Unauthorized(new ErrorResponse(["Invalid email or password."]));

        return Ok(await BuildResponseAsync(user));
    }

    /// <summary>Datele utilizatorului curent, pe baza token-ului.</summary>
    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserInfo>> Me()
    {
        var id = User.FindFirst("sub")?.Value;
        var user = id is null ? null : await users.FindByIdAsync(id);
        if (user is null)
            return Unauthorized();

        return Ok(await BuildUserInfoAsync(user));
    }

    private async Task<AuthResponse> BuildResponseAsync(AppUser user)
    {
        var info = await BuildUserInfoAsync(user);
        var (token, expiresAt) = tokens.Create(user, info.Roles);
        return new AuthResponse(token, expiresAt, info);
    }

    private async Task<UserInfo> BuildUserInfoAsync(AppUser user)
    {
        var roles = (await users.GetRolesAsync(user)).ToList();
        return new UserInfo(user.Id, user.UserName ?? "", user.Email ?? "", user.Address, roles);
    }
}
