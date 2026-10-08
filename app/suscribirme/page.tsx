import {requireChatGPTUser} from "@/app/chatgpt-auth";
import {InternalSpaceHeader} from "@/app/components/internal-space-header";
import {StoreWorkspace} from "@/components/subscriptions/store-workspace";
export const dynamic="force-dynamic";
export default async function SubscribePage(){await requireChatGPTUser("/suscribirme");return <><InternalSpaceHeader eyebrow="TU NEGOCIO" title="Tu tienda" badge="Cuenta individual"/><StoreWorkspace/></>}
