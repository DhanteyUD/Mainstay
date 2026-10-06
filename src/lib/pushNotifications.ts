const PREF_KEY = "mainstay_push_enabled";

export interface SystemNotificationInput {
  title: string;
  body?: string;
  tag?: string;
  url?: string;
}

export function pushSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function pushPermission(): NotificationPermission | "unsupported" {
  return pushSupported() ? Notification.permission : "unsupported";
}

export function pushEnabled(): boolean {
  if (pushPermission() !== "granted") return false;
  try {
    return localStorage.getItem(PREF_KEY) !== "false";
  } catch {
    return true;
  }
}

export function setPushEnabled(enabled: boolean) {
  try {
    localStorage.setItem(PREF_KEY, String(enabled));
  } catch {}
}

export async function requestPushPermission(): Promise<boolean> {
  if (!pushSupported()) return false;
  if (Notification.permission === "default") {
    try {
      await Notification.requestPermission();
    } catch {
      return false;
    }
  }
  return pushEnabled();
}

export async function showSystemNotification({
  title,
  body,
  tag,
  url,
}: SystemNotificationInput) {
  if (!pushEnabled() || document.visibilityState === "visible") return;

  const options: NotificationOptions = {
    body,
    tag,
    icon: "/android-chrome-192x192.png",
    badge: "/favicon-32x32.png",
    data: { url: url ?? "/" },
  };

  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, options);
      return;
    }
    const n = new Notification(title, options);
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {}
}
