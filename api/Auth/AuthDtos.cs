using System.ComponentModel.DataAnnotations;

namespace DiyStore.Api.Auth;

public class RegisterRequest
{
    [Required(ErrorMessage = "Username is required.")]
    [StringLength(100, ErrorMessage = "Username cannot exceed 100 characters.")]
    public string Username { get; set; } = "";

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email address.")]
    [StringLength(256, ErrorMessage = "Email cannot exceed 256 characters.")]
    public string Email { get; set; } = "";

    [Required(ErrorMessage = "Address is required.")]
    [StringLength(500, ErrorMessage = "Address cannot exceed 500 characters.")]
    public string Address { get; set; } = "";

    [Required(ErrorMessage = "Password is required.")]
    public string Password { get; set; } = "";
}

public class LoginRequest
{
    /// <summary>Email sau username.</summary>
    [Required(ErrorMessage = "Email or username is required.")]
    public string Login { get; set; } = "";

    [Required(ErrorMessage = "Password is required.")]
    public string Password { get; set; } = "";
}

public record UserInfo(string Id, string Username, string Email, string Address, IReadOnlyList<string> Roles);

public record AuthResponse(string Token, DateTime ExpiresAt, UserInfo User);

/// <summary>Forma unica a erorilor intoarse de API: { "errors": ["mesaj", ...] }.</summary>
public record ErrorResponse(IReadOnlyList<string> Errors);
