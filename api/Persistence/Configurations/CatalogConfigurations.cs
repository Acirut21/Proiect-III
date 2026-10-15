using DiyStore.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DiyStore.Api.Persistence.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> b)
    {
        b.Property(x => x.Name).HasMaxLength(100);
        b.Property(x => x.Slug).HasMaxLength(100);
        b.Property(x => x.ImagePath).HasMaxLength(300);
        b.HasIndex(x => x.Slug).IsUnique();
    }
}

public class SubcategoryConfiguration : IEntityTypeConfiguration<Subcategory>
{
    public void Configure(EntityTypeBuilder<Subcategory> b)
    {
        b.Property(x => x.Name).HasMaxLength(100);
        b.Property(x => x.Slug).HasMaxLength(100);
        b.Property(x => x.ImagePath).HasMaxLength(300);
        // slug unic in interiorul aceleiasi categorii
        b.HasIndex(x => new { x.CategoryId, x.Slug }).IsUnique();

        b.HasOne(x => x.Category)
            .WithMany(c => c.Subcategories)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> b)
    {
        b.Property(x => x.Name).HasMaxLength(200);
        b.Property(x => x.Slug).HasMaxLength(250);
        b.Property(x => x.Description).HasMaxLength(2000);
        b.Property(x => x.ManufacturerName).HasMaxLength(100);
        b.Property(x => x.ManufacturerLogoPath).HasMaxLength(300);
        b.Property(x => x.Price).HasColumnType("decimal(18,2)");
        b.Property(x => x.PreviousPrice).HasColumnType("decimal(18,2)");
        b.HasIndex(x => x.Slug).IsUnique();
        b.HasIndex(x => x.Name);

        b.HasOne(x => x.Subcategory)
            .WithMany(s => s.Products)
            .HasForeignKey(x => x.SubcategoryId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ProductImageConfiguration : IEntityTypeConfiguration<ProductImage>
{
    public void Configure(EntityTypeBuilder<ProductImage> b)
    {
        b.Property(x => x.Path).HasMaxLength(300);
        b.HasOne(x => x.Product)
            .WithMany(p => p.Images)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ProductSpecificationConfiguration : IEntityTypeConfiguration<ProductSpecification>
{
    public void Configure(EntityTypeBuilder<ProductSpecification> b)
    {
        b.Property(x => x.Name).HasMaxLength(100);
        b.Property(x => x.Value).HasMaxLength(300);
        b.HasOne(x => x.Product)
            .WithMany(p => p.Specifications)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
