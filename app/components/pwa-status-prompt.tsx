import { useRegisterSW } from "../lib/pwa";
import { Button } from "./ui/button";

export function PwaStatusPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) {
    return null;
  }

  const dismiss = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <section
        aria-live="polite"
        className="pointer-events-auto w-full max-w-xl rounded-[1.75rem] border border-slate-900/10 bg-white/96 p-4 text-[--color-ink] shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[--color-signal]">
          Webdeck PWA
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {offlineReady
            ? "This device is ready to show your saved deck while offline."
            : "A newer version of Webdeck is ready. Reload when you have a safe moment between live actions."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {needRefresh ? (
            <Button
              onClick={() => {
                void updateServiceWorker(true);
              }}
            >
              Reload app
            </Button>
          ) : null}
          <Button variant="secondary" onClick={dismiss}>
            Dismiss
          </Button>
        </div>
      </section>
    </div>
  );
}
