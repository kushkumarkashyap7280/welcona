import { ProductDetailsClient } from "@/components/users/ProductDetailsClient";

type ProductDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;

  return <ProductDetailsClient productId={id} />;
}