import { backendFetch } from "@/lib/server/backend";
export async function GET(_request: Request, { params }: { params: Promise<{assetId:string}> }) {
  const { assetId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(assetId)) return new Response(null,{status:404});
  try {
    const response = await backendFetch(`/storage/v1/object/v16-product-photos/${assetId}.jpg`, { headers: { Accept: "image/jpeg" } });
    if (!response.ok) return new Response(null,{status:404});
    return new Response(response.body, { headers: { "Content-Type":"image/jpeg", "Cache-Control":"private, max-age=3600", "X-Content-Type-Options":"nosniff" } });
  } catch { return new Response(null,{status:503}); }
}
