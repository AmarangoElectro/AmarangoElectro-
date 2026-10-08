import { redirect } from "next/navigation";
import StoreLink from "@/app/components/store-link";
import { chatGPTSignInPath, getChatGPTUser } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function ChatGPTAuthRetryPage() {
  const user = await getChatGPTUser();
  if (user) redirect("/mi-espacio");

  return (
    <main className="error-state">
      <p className="eyebrow orange">ACCESO SEGURO</p>
      <h1>El intento de ingreso venció.</h1>
      <p>Volvé a iniciar sesión y elegí tu cuenta de ChatGPT dentro de los próximos minutos.</p>
      <div className="error-state-actions">
        <StoreLink href={chatGPTSignInPath("/mi-espacio")} target="_top">Reintentar ingreso</StoreLink>
        <StoreLink href="/">Volver a la tienda</StoreLink>
      </div>
    </main>
  );
}
