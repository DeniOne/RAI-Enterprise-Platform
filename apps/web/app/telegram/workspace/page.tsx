import type { Metadata } from "next";
import { TelegramWorkspaceClient } from "@/components/telegram/TelegramWorkspaceClient";
import Script from "next/script";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "РАИ Менеджмент",
};

export default function TelegramWorkspacePage() {
  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />
      <TelegramWorkspaceClient />
    </>
  );
}
