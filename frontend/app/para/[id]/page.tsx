import { redirect } from "next/navigation";

type ParaProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ParaProductAliasPage({
  params,
}: ParaProductPageProps) {
  const { id } = await params;
  redirect(`/products/${encodeURIComponent(id)}?source=para`);
}
