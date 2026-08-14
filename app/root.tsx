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
    { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
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
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="max-w-md rounded-xl border bg-card p-8 text-card-foreground shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Webdeck
        </p>
        <h1 className="mt-3 text-3xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{details}</p>
      </div>
    </main>
  );
}
