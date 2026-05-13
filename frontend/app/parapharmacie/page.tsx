import ProductListingSection from "../components/ProductListingSection";

export const metadata = {
  title: "Parapharmacie - 1111.tn",
  description: "Comparez les prix des produits de parapharmacie en Tunisie.",
};

export default function ParapharmaciePage() {
  return (
    <ProductListingSection
      source="para"
      title="Parapharmacie"
      eyebrow="Categorie dediee"
      description="Comparez les soins, produits solaires, hygiene, maman et bebe disponibles dans les boutiques de parapharmacie."
      initialCategoryType="top_category"
    />
  );
}
