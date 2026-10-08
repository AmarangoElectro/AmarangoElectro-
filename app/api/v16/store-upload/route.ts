import {z} from "zod";
import {storeAction} from "@/lib/subscriptions/server";
import {backendFetch,privateJson,sameOrigin} from "@/lib/server/backend";
const schema=z.object({kind:z.enum(["logo","product"]),product_id:z.string().uuid().optional(),features:z.array(z.string().min(1).max(220)).max(12).optional(),specifications:z.record(z.string().max(60),z.string().max(220)).refine(v=>Object.keys(v).length<=30).optional(),reviewed:z.literal(true)}).strict();
export async function POST(request:Request){
  if(!sameOrigin(request))return privateJson({error:"forbidden"},403);
  const auth=await storeAction("workspace");if(auth.status!==200)return privateJson(auth.data,auth.status);
  const store=auth.data.store;if(!store||store.status!=="active")return privateJson({error:"inactive"},403);
  if(Number(request.headers.get("content-length")??0)>4500000)return privateJson({error:"too_large"},413);
  let file:File,source:File,meta:z.infer<typeof schema>;
  try{const form=await request.formData();meta=schema.parse(JSON.parse(String(form.get("metadata"))));file=form.get("image") as File;source=(form.get("sourceImage")??file) as File;
    for(const f of [file,source])if(!(f instanceof File)||f.type!=="image/jpeg"||!f.size||f.size>2097152)throw new Error();
    if(meta.kind==="product"&&!auth.data.products.some((p:{id:string})=>p.id===meta.product_id))throw new Error();
  }catch{return privateJson({error:"invalid"},400)}
  const assetId=crypto.randomUUID(),sourceId=source===file?assetId:crypto.randomUUID();
  try{
    const uploads: [string,File][]=[[assetId,file]];
    if(sourceId!==assetId)uploads.push([sourceId,source]);
    for(const [asset,f] of uploads){
      const bytes=new Uint8Array(await f.arrayBuffer());if(bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)return privateJson({error:"invalid_image"},400);
      const upload=await backendFetch(`/storage/v1/object/v16-store-assets/${store.id}/${asset}.jpg`,{method:"POST",headers:{"Content-Type":"image/jpeg"},body:bytes});if(!upload.ok)throw new Error();
    }
    const saved=await storeAction("asset",{...meta,asset_id:assetId,source_asset_id:sourceId});return privateJson(saved.data,saved.status);
  }catch{return privateJson({error:"upload_failed"},503)}
}
