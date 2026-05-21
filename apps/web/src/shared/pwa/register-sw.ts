/** Auto-update: works for both browser tabs and installed PWA. */
export function registerServiceWorkerUpdates() {
  if (!("serviceWorker" in navigator)) return;

  let reloading = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  window.addEventListener("focus", () => {
    navigator.serviceWorker.getRegistration().then((reg) => reg?.update());
  });

  navigator.serviceWorker.ready.then((reg) => reg.update());
}
