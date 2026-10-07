import { z } from "zod";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { resolveSpaceAccess } from "@/lib/internal/auth/server-access";
import { rawCatalog } from "@/lib/catalog";
import { backendFetch, privateJson, sameOrigin } from "@/lib/server/backend";

const metadataSchema = z.object({
  productId: z.string().min(1).max(200),
  features: z.array(z.string().trim().min(1).max(220)).max(12),
  specifications: z.record(z.string().max(60),z.string().max(220)),
  sourceText: z.string().max(15000),
  style: z.enum(["original","amarango"]),
  reviewed: z.literal(true),
});

export async function POST(request: Request) {
  if (!sameOrigin(request)) return privateJson({status:"unauthorized"},403);
  if (!(await resolveSpaceAccess()).admin) return privateJson({status:"unauthorized"},403);
  const user = await getChatGPTUser();
  if (!user) return privateJson({status:"unauthenticated"},401);
  if (Number(request.headers.get("content-length") ?? 0)>4600000) return privateJson({status:"too_large"},413);
  let file: File; let sourceFile: File; let meta: z.infer<typeof metadataSchema>;
  try {
    const form = await request.formData();
    const candidate = form.get("image");
    if (!(candidate instanceof File) || candidate.type!=="image/jpeg" || candidate.size>2097152 || !candidate.size) throw new Error();
    file = candidate;
    meta = metadataSchema.parse(JSON.parse(String(form.get("metadata"))));
    const source = form.get("sourceImage");
    sourceFile = source instanceof File ? source : file;
    if (meta.style==="amarango" && !(source instanceof File)) throw new Error();
    if (sourceFile.type!=="image/jpeg" || sourceFile.size>2097152 || !sourceFile.size) throw new Error();
    if (Object.keys(meta.specifications).length>30) throw new Error();
  } catch { return privateJson({status:"invalid"},400); }
  const products = await rawCatalog.listProducts();
  if (!products.some(product=>product.id===meta.productId)) return privateJson({status:"invalid_product"},400);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes[0]!==255 || bytes[1]!==216 || bytes[2]!==255) return privateJson({status:"invalid_image"},400);
  const assetId = crypto.randomUUID();
  const sourceAssetId = meta.style==="original" ? assetId : crypto.randomUUID();
  const sourceBytes = new Uint8Array(await sourceFile.arrayBuffer());
  if(sourceBytes[0]!==255||sourceBytes[1]!==216||sourceBytes[2]!==255)return privateJson({status:"invalid_image"},400);
  try {
    const upload = await backendFetch(`/storage/v1/object/v16-product-photos/${assetId}.jpg`, {method:"POST",headers:{"Content-Type":"image/jpeg"},body:bytes});
    if (!upload.ok) throw new Error("upload_failed");
    if (sourceAssetId!==assetId) {
      const sourceUpload=await backendFetch(`/storage/v1/object/v16-product-photos/${sourceAssetId}.jpg`,{method:"POST",headers:{"Content-Type":"image/jpeg"},body:sourceBytes});
      if(!sourceUpload.ok)throw new Error("source_upload_failed");
    }
    const save = await backendFetch("/rest/v1/v16_product_media?on_conflict=product_id", {
      method:"POST",headers:{Prefer:"resolution=merge-duplicates"},
      body:JSON.stringify({product_id:meta.productId,asset_id:assetId,source_asset_id:sourceAssetId,features:meta.features,specifications:meta.specifications,source_text:meta.sourceText,style:meta.style,reviewed_by:user.email,updated_at:new Date().toISOString()}),
    });
    if (!save.ok) throw new Error("save_failed");
    return privateJson({status:"ok",imageUrl:`/api/v16/product-photo/${assetId}`,supplierImageUrl:`/api/v16/product-photo/${sourceAssetId}`});
  } catch { return privateJson({status:"error",message:"No se guardó la foto. Tu borrador sigue disponible para reintentar."},503); }
}
