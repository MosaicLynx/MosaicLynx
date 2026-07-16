import {
  ProviderRpcError,
  RpcMosaicLynxProvider,
  type RpcExecutor,
  type RpcRequest,
} from "@mosaic-lynx/provider-api";
import { installSssAdapter, type SssWindow } from "@mosaic-lynx/sss-adapter";

declare global {
  interface Window {
    mosaicLynx?: RpcMosaicLynxProvider;
  }
}

const requestEvent = "mosaic-lynx:request";
const responseEvent = "mosaic-lynx:response";

const createRequestId = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  // RFC 4122 UUID v4. getRandomValues is available in every supported
  // extension injection context, including pages without randomUUID().
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
};

class PageRpcExecutor implements RpcExecutor {
  public request<TResult>(request: RpcRequest): Promise<TResult> {
    const id = createRequestId();
    return new Promise<TResult>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        window.removeEventListener(responseEvent, onResponse);
        reject(new ProviderRpcError("REQUEST_EXPIRED", "The MosaicLynx request expired."));
      }, 5 * 60_000);
      const onResponse = (event: Event): void => {
        const detail = (
          event as CustomEvent<{
            readonly id: string;
            readonly result?: TResult;
            readonly error?: {
              readonly code: ProviderRpcError["code"];
              readonly message: string;
            };
          }>
        ).detail;
        if (detail?.id !== id) return;
        clearTimeout(timeout);
        window.removeEventListener(responseEvent, onResponse);
        if (detail.error) {
          reject(new ProviderRpcError(detail.error.code, detail.error.message));
          return;
        }
        resolve(detail.result as TResult);
      };
      window.addEventListener(responseEvent, onResponse);
      window.dispatchEvent(
        new CustomEvent(requestEvent, { detail: { id, request } }),
      );
    });
  }
}

if (!window.mosaicLynx) {
  const provider = new RpcMosaicLynxProvider(new PageRpcExecutor());
  Object.defineProperty(window, "mosaicLynx", {
    value: provider,
    enumerable: true,
    configurable: false,
    writable: false,
  });
  installSssAdapter(window as unknown as SssWindow, provider);
  window.addEventListener(responseEvent.replace("response", "event"), (event: Event) => {
    const detail = (event as CustomEvent<{ readonly event?: Parameters<typeof provider.emit>[0]; readonly payload?: unknown }>).detail;
    if (detail?.event) provider.emit(detail.event, detail.payload as never);
  });
  window.dispatchEvent(new CustomEvent("mosaic-lynx:ready", {
    detail: { apiVersion: provider.apiVersion },
  }));
}
document.documentElement.dataset.mosaicLynxProvider = window.mosaicLynx
  ? window.mosaicLynx.apiVersion
  : "blocked";
