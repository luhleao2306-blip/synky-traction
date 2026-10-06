import type { Metadata } from "next";
import { getSynkyUser, isMasterAdmin } from "../synky-auth";
import { redirect } from "next/navigation";
import TractionApp from "../traction-app";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Painel | Synky Traction", robots: { index: false, follow: false } };

export default async function PanelPage() {
  const user = await getSynkyUser();
  if (!user) redirect("/login");
  return <TractionApp displayName={user.displayName} isMaster={isMasterAdmin(user)} />;
}
