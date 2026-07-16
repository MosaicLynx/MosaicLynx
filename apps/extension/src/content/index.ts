import inpageScript from "../inpage/index.ts?script&module";

const requestEvent = "mosaic-lynx:request";
const responseEvent = "mosaic-lynx:response";
const providerEvent = "mosaic-lynx:event";

// MAIN-world declarative content scripts are the primary installation path.
// Keep a compiled script-tag fallback for Chrome variants or policies that do
// not execute the manifest `world: MAIN` entry.
document.documentElement.dataset.mosaicLynxBridge = "ready";
const script = document.createElement("script");
script.type = "module";
script.src = chrome.runtime.getURL(inpageScript);
script.dataset.mosaicLynx = "inpage";
script.addEventListener("load", () => script.remove(), { once: true });
script.addEventListener("error", () => {
  document.documentElement.dataset.mosaicLynxInjection = "failed";
  script.remove();
}, { once: true });
(document.head ?? document.documentElement).append(script);

window.addEventListener(requestEvent, (event: Event) => {
  const request = (
    event as CustomEvent<{ readonly id: string; readonly request: unknown }>
  ).detail;
  if (!request?.id || request.id.length > 128 || !request.request || typeof request.request !== "object") return;

  const rpc = request.request as { readonly method?: unknown; readonly params?: unknown };
  const methods = new Set([
    "permissions_connect", "permissions_disconnect", "account_list", "account_getActive",
    "sign_message", "sign_transaction",
  ]);
  if (typeof rpc.method !== "string" || !methods.has(rpc.method)) return;
  const payload = (rpc.params as { readonly payload?: unknown } | undefined)?.payload;
  if (typeof payload === "string" && payload.length > 512 * 1024) {
    window.dispatchEvent(new CustomEvent(responseEvent, {
      detail: { id: request.id, error: { code: "INVALID_PARAMS", message: "Payload exceeds 256 KiB." } },
    }));
    return;
  }

  void chrome.runtime
    .sendMessage({
      kind: "mosaic-lynx:request",
      origin: window.location.origin,
      request: request.request,
    })
    .then((response: unknown) => {
      window.dispatchEvent(
        new CustomEvent(responseEvent, {
          detail: { id: request.id, ...(response as object) },
        }),
      );
    })
    .catch(() => {
      window.dispatchEvent(new CustomEvent(responseEvent, {
        detail: { id: request.id, error: { code: "INTERNAL_ERROR", message: "MosaicLynx is unavailable." } },
      }));
    });
});

chrome.runtime.onMessage.addListener((message: unknown) => {
  const event = message as { readonly kind?: string; readonly event?: string; readonly payload?: unknown };
  if (event.kind !== providerEvent || !event.event) return;
  window.dispatchEvent(
    new CustomEvent(providerEvent, { detail: { event: event.event, payload: event.payload } }),
  );
});
