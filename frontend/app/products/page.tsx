import ProductListingSection from "../components/ProductListingSection";
import type { CatalogSource, CategoryType } from "../lib/demo-data/types";

export const metadata = {
  title: "Catalogue Produits - 1111.tn",
  description:
    "Comparez les prix en temps reel sur les grandes enseignes tunisiennes.",
};

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    category_type?: CategoryType;
    source?: CatalogSource;
  }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;
  const source = params.source === "para" ? "para" : "retail";

  return (
    <ProductListingSection
      source={source}
      initialCategory={params.category}
      initialCategoryType={params.category_type || "top_category"}
    />
  );
}
