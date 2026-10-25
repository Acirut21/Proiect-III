export interface PublicSubcategory {
  id: number;
  name: string;
  slug: string;
  imagePath: string | null;
}

export interface PublicCategory {
  id: number;
  name: string;
  slug: string;
  imagePath: string | null;
  subcategories: PublicSubcategory[];
}

export interface ProductCard {
  id: number;
  name: string;
  slug: string;
  price: number;
  previousPrice: number | null;
  isOnSale: boolean;
  stock: number;
  images: string[];
}

export interface ProductPage {
  items: ProductCard[];
  totalCount: number;
  page: number;
  perPage: number;
  totalPages: number;
  title: string;
}

export interface NamedSlug {
  name: string;
  slug: string;
}

export interface ProductDetailPage {
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
  category: NamedSlug;
  subcategory: NamedSlug;
  deliveryMethods: ('Courier' | 'StorePickup')[];
  images: string[];
  specifications: { name: string; value: string }[];
  similar: ProductCard[];
}

export interface HomeData {
  categories: PublicCategory[];
  featuredProducts: ProductCard[];
}

/** Parametrii din adresa paginii de produse (si ai apelului catre API). */
export interface ProductQuery {
  cat?: string;
  sub?: string;
  minPrice?: string;
  maxPrice?: string;
  onSale?: string;
  perPage?: string;
  page?: string;
  q?: string;
}
