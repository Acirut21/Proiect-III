using System.Text;
using DiyStore.Api.Identity;
using DiyStore.Api.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;

// Baza de date
builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseSqlServer(config.GetConnectionString("Default")));

// Identity: utilizatori, parole, roluri
builder.Services
    .AddIdentityCore<AppUser>(o =>
    {
        o.Password.RequiredLength = 6;
        o.Password.RequireDigit = true;
        o.Password.RequireUppercase = false;
        o.Password.RequireNonAlphanumeric = false;
        o.User.RequireUniqueEmail = true;
    })
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>();

// JWT
var jwtKey = config["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
    throw new InvalidOperationException(
        "Jwt:Key lipseste sau are sub 32 de caractere (vezi appsettings.Development.json).");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o => o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidIssuer = config["Jwt:Issuer"],
        ValidAudience = config["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidateLifetime = true,
        NameClaimType = "name",
        RoleClaimType = "role"
    });
builder.Services.AddAuthorization();

// CORS pentru serverul de dezvoltare Angular
const string ClientPolicy = "client";
builder.Services.AddCors(o => o.AddPolicy(ClientPolicy, p => p
    .WithOrigins("http://localhost:4200")
    .AllowAnyHeader()
    .AllowAnyMethod()));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// La pornire (doar in dezvoltare): aplica migrarile si creeaza rolurile/adminul
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    if (!db.Database.GetMigrations().Any())
        throw new InvalidOperationException(
            "Nu exista nicio migrare. Ruleaza in folderul api: " +
            "dotnet ef migrations add InitialCreate");

    await db.Database.MigrateAsync();
    await DbSeeder.SeedAsync(scope.ServiceProvider, config);

    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles(); // serveste wwwroot/images
app.UseCors(ClientPolicy);
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Map("/error", () => Results.Problem("A aparut o eroare pe server."));

app.MapGet("/api/health", async (AppDbContext db) => Results.Ok(new
{
    status = "ok",
    database = await db.Database.CanConnectAsync() ? "connected" : "unreachable"
}));

app.Run();
