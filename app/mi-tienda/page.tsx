import {requireChatGPTUser} from "@/app/chatgpt-auth";
import {InternalSpaceHeader} from "@/app/components/internal-space-header";
import {StoreWorkspace} from "@/components/subscriptions/store-workspace";
export const dynamic="force-dynamic";
export default async function MyStorePage(){await requireChatGPTUser("/mi-tienda");return <><InternalSpaceHeader eyebrow="TU NEGOCIO" title="Mi tienda" badge="Administrás tu propio espacio"/><StoreWorkspace/></>}
