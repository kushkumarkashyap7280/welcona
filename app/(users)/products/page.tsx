import { ProductCatalogClient } from "@/components/users/ProductCatalogClient";

export const metadata = {
  title: "Products",
  description: "Browse Welcona's luxury bath fittings collection.",
};

export default function ProductsPage() {
  return (
    <ProductCatalogClient />
  );
}
