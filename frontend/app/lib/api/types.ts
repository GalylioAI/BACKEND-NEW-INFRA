export type CatalogSource = "retail" | "para";

export type CategoryType = "subcategory" | "low_category" | "top_category";

export interface ApiValidationIssue {
  loc?: Array<string | number>;
  msg: string;
  type?: string;
}

export interface ShopPrice {
  shop: string;
  price: number;
  oldPrice?: number | null;
  available?: boolean;
  url?: string | null;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  bestPrice: number;
  originalPrice?: number | null;
  image: string;
  images?: string[];
  description: string;
  inStock: boolean;
  category?: string | null;
  shopPrices?: ShopPrice[];
  specifications?: Record<string, unknown> | null;
}

export interface ParaProduct extends Product {
  topCategory?: string | null;
}

export type CatalogProduct = Product | ParaProduct;

export interface ProductListResponse<TProduct extends CatalogProduct = Product> {
  products: TProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductListingParams {
  category?: string;
  category_type?: CategoryType;
  search?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  page?: number;
  limit?: number;
}

export interface ProductSearchResult {
  id: string;
  name: string;
  brand: string;
  bestPrice: number;
  image: string;
  inStock: boolean;
  relevance?: number;
}

export interface ShopRanking {
  shop: string;
  avg_price: number;
  min_price: number;
  max_price: number;
  product_count: number;
}

export interface CategoryAnalytics {
  category: string;
  cheapest_shop: string;
  cheapest_avg_price: number;
  shop_rankings: ShopRanking[];
  only_available: boolean;
}

export interface ShopAnalytics {
  name: string;
  average_price: number;
  logo_url?: string | null;
}

export interface MergeStats {
  shop_totals: Record<string, number>;
  common_products: number;
}

export interface MergeStatsResponse {
  para?: MergeStats | null;
  retails?: MergeStats | null;
}

export interface ShopDetailedAnalytics {
  name: string;
  product_count: number;
  available_count: number;
  total_price: number;
  average_price: number;
  cheapest_product_count: number;
  discount_count: number;
  total_discount_value: number;
  average_discount_percent: number;
}

export interface DetailedAnalyticsResponse {
  para_shops: ShopDetailedAnalytics[];
  retails_shops: ShopDetailedAnalytics[];
}

export interface StoreAvailabilityEntry {
  store: string;
  status?: string | null;
  available: boolean;
}

export interface StoreProductAdded {
  id: string;
  url?: string | null;
  shop: string;
  scraped_at?: string | null;
  updated_at?: string | null;
  top_category?: string | null;
  low_category?: string | null;
  subcategory?: string | null;
  title: string;
  product_id?: string | null;
  sku?: string | null;
  overview?: string | null;
  brand_logo?: string | null;
  brand?: string | null;
  price?: number | null;
  specifications?: Record<string, string>;
  images?: string[];
  availability?: string | null;
  available: boolean;
  store_availability?: StoreAvailabilityEntry[];
}

export interface StoreProductsAddedResponse {
  shop: string;
  source: string;
  total: number;
  products_added: StoreProductAdded[];
}

export interface StoreProductsRemovedResponse {
  shop: string;
  source: string;
  total: number;
  products_removed: StoreProductAdded[];
}

export interface FakePromoItem {
  id: string;
  product_id?: string | null;
  sku?: string | null;
  title: string;
  brand: string;
  shop: string;
  image: string;
  url: string;
  old_scrap_old_price: number;
  old_scrap_price: number;
  new_scrap_price: number;
  new_scrap_old_price: number;
  price_change: number;
  price_change_pct: number;
  real_increase: number;
  real_increase_pct: number;
  old_price_inflated_by: number;
  old_price_inflated_by_pct: number;
  advertised_discount: number;
  advertised_discount_pct: number;
  verdict?: string | null;
  top_category?: string | null;
  subcategory?: string | null;
  category?: string | null;
  updated_at?: string | null;
}

export interface UserCreate {
  full_name: string;
  username?: string;
  email: string;
  phone?: string | null;
  password: string;
  role?: DashboardRole;
  address?: string | null;
  gouvernorat_id?: number | null;
}

export interface UserLogin {
  identifier?: string; // email or username
  email?: string;
  password: string;
}

export interface AuthToken {
  access_token: string;
  user_id: string;
  role: string;
}

// Returned when 2FA is required instead of a direct token
export interface AuthToken2FAPending {
  session_token: string;
  two_fa_required: true;
}

export type LoginResponse = AuthToken | AuthToken2FAPending;

export function is2FAPending(r: unknown): r is AuthToken2FAPending {
  return Boolean(r && typeof r === "object" && (r as AuthToken2FAPending).two_fa_required === true);
}

export interface UserResponse {
  _id?: string | null;
  id: string;
  email: string;
  role?: string;
  full_name?: string | null;
  username?: string | null;
  picture?: string | null;
  address?: string | null;
  birthdate?: string | null;
  phone?: string | null;
  gouvernorat_id?: number | null;
  is_verified?: boolean;
  is_banned?: boolean;
  created_at?: string | null;
}

export interface UserProfileUpdate {
  full_name?: string | null;
  username?: string | null;
  birthdate?: string | null;
  address?: string | null;
  picture?: string | null;
  phone?: string | null;
  gouvernorat_id?: number | null;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export type DashboardRole = "client" | "user" | "admin" | "superadmin";

export interface AccessRule {
  _id?: string | null;
  path: string;
  label: string;
  category: string;
  visible: boolean;
  allowed_roles: DashboardRole[];
  allowed_emails: string[];
  updated_at?: string | null;
  created_at?: string | null;
}

export interface AccessRulePayload {
  path: string;
  label: string;
  category?: string;
  visible?: boolean;
  allowed_roles?: DashboardRole[];
  allowed_emails?: string[];
}

export type BlogSectionType = "h2" | "h3" | "p" | "ul" | "highlight";

export interface BlogSection {
  type: BlogSectionType;
  text?: string | null;
  items?: string[];
}

export interface BlogArticle {
  _id?: string | null;
  slug: string;
  category: string;
  categoryColor: string;
  title: string;
  desc: string;
  img: string;
  read: string;
  date: string;
  sections: BlogSection[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface BlogArticlePayload {
  slug?: string;
  category: string;
  categoryColor: string;
  title: string;
  desc: string;
  img: string;
  read: string;
  date: string;
  sections: BlogSection[];
}
