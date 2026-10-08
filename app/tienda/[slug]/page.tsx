import {notFound} from "next/navigation";
import {publicStore} from "@/lib/subscriptions/server";
import {SubscriberStorefront} from "@/components/subscriptions/storefront";
export const dynamic="force-dynamic";
export default async function StorePage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const data=await publicStore(slug);if(!data?.store)notFound();return <SubscriberStorefront store={data.store} products={data.products}/>}
