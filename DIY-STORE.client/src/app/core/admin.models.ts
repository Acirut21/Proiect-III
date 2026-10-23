export interface SubcategoryDto {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  imagePath: string | null;
}

export interface CategoryDto {
  id: number;
  name: string;
  slug: string;
  imagePath: string | null;
  subcategories: SubcategoryDto[];
}

export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  categoryName: string;
  subcategoryName: string;
  isOnSale: boolean;
}

export interface ProductImageDto {
  id: number;
  path: string;
}

export interface SpecificationDto {
  name: string;
  value: string;
}

/** Valorile acceptate de API pentru modalitatea de livrare. */
export type DeliveryMethodName = 'Courier' | 'StorePickup';

export interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  previousPrice: number | null;
  isOnSale: boolean;
  stock: number;
  manufacturerName: string;
  manufacturerLogoPath: string | null;
  categoryId: number;
  subcategoryId: number;
  deliveryMethods: DeliveryMethodName[];
  images: ProductImageDto[];
  specifications: SpecificationDto[];
}
