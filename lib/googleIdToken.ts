/**
 * Obtain a Google ID token (JWT) via Google Identity Services.
 * Used by web clients; Capacitor Android uses native SocialLogin instead.
 */
const GIS_SRC = "https://accounts.google.com/gsi/client";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: (momentListener?: (n: {
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
            isDismissedMoment: () => boolean;
          }) => void) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
          cancel: () => void;
        };
      };
    };
  }
}

function loadGisScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google sign-in requires a browser"));
  }
  if (window.google?.accounts?.id) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Identity Services")));
      if (window.google?.accounts?.id) resolve();
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

export async function obtainGoogleIdToken(clientId: string): Promise<string> {
  if (!clientId) {
    throw new Error("Missing Google client ID (NEXT_PUBLIC_GOOGLE_CLIENT_ID / VITE_GOOGLE_CLIENT_ID)");
  }

  await loadGisScript();

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (err?: Error, token?: string) => {
      if (settled) return;
      settled = true;
      try {
        window.google?.accounts.id.cancel();
      } catch {
        /* ignore */
      }
      overlay.remove();
      if (err) reject(err);
      else if (token) resolve(token);
      else reject(new Error("Google sign-in cancelled"));
    };

    const overlay = document.createElement("div");
    overlay.setAttribute("role", "dialog");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45)";
    const panel = document.createElement("div");
    panel.style.cssText =
      "background:#fff;padding:24px;border-radius:12px;display:flex;flex-direction:column;gap:12px;align-items:center;min-width:280px";
    const title = document.createElement("p");
    title.textContent = "Continue with Google";
    title.style.cssText = "margin:0;font:600 16px/1.4 system-ui,sans-serif;color:#111";
    const btnHost = document.createElement("div");
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = "Cancel";
    cancel.style.cssText =
      "border:0;background:transparent;color:#666;cursor:pointer;font:14px system-ui,sans-serif";
    cancel.onclick = () => finish(new Error("Google sign-in cancelled"));
    panel.append(title, btnHost, cancel);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    window.google!.accounts.id.initialize({
      client_id: clientId,
      callback: (response: { credential?: string }) => {
        if (response?.credential) finish(undefined, response.credential);
        else finish(new Error("No Google credential returned"));
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    window.google!.accounts.id.renderButton(btnHost, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      width: 280,
    });

    window.google!.accounts.id.prompt();
  });
}
