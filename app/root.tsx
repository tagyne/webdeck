import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";

import type { Route } from "./+types/root";
import appStylesHref from "./app.css?url";
import { PwaStatusPrompt } from "./components/pwa-status-prompt";

export function links() {
  return [
    { rel: "stylesheet", href: appStylesHref },
    { rel: "manifest", href: "/manifest.webmanifest" },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <>
      <Outlet />
      <PwaStatusPrompt />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "Application error";
  let details = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? "Page not found" : "Request failed";
    details = error.statusText || details;
  } else if (error instanceof Error) {
    details = error.message;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[--color-surface] px-6 py-16 text-[--color-ink]">
      <div className="max-w-md space-y-3 rounded-3xl border border-[--color-line] bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[--color-signal]">
          Webdeck
        </p>
        <h1 className="font-display text-3xl">{title}</h1>
        <p className="text-sm text-slate-700">{details}</p>
      </div>
    </main>
  );
}
