import ProductListingSection from "../components/ProductListingSection";

const ELECTROMENAGER = "\u00c9lectrom\u00e9nager";

export const metadata = {
  title: "Electromenager - 1111.tn",
  description: "Comparez les prix des produits electromenager en Tunisie.",
};

export default function ElectromenagerPage() {
  return (
    <ProductListingSection
      source="retail"
      title={ELECTROMENAGER}
      eyebrow="Categorie dediee"
      description="Comparez les refrigerateurs, machines a laver, fours, climatiseurs et autres equipements maison disponibles dans le catalogue."
      initialCategory={ELECTROMENAGER}
      initialCategoryType="top_category"
      lockedCategory
    />
  );
}
