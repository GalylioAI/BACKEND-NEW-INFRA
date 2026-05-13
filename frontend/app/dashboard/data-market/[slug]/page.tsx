import { notFound } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/header";
import { StoreDataDetail } from "@/components/dashboard/store-data-detail";
import {
  getDataMarketStoreDetail,
  getDataMarketStores,
} from "@/lib/data-market";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const stores = await getDataMarketStores();
  return stores.map((store) => ({ slug: store.slug }));
}

export default async function DataMarketStorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getDataMarketStoreDetail(slug);

  if (!detail) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title={`${detail.store.shopName} data`} />
      <StoreDataDetail detail={detail} />
    </div>
  );
}
