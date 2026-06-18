(function () {
  const storageKey = "cs_visitor_events_v1";
  const visitorKey = "cs_visitor_id_v1";
  const sessionKey = "cs_session_v1";
  const maxLocalEvents = 800;
  const sessionTimeout = 30 * 60 * 1000;
  const endpoint =
    window.CS_ANALYTICS_ENDPOINT ||
    document.querySelector('meta[name="analytics-endpoint"]')?.getAttribute("content")?.trim() ||
    "";

  function createId(prefix) {
    const random =
      window.crypto && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    return `${prefix}_${random}`;
  }

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Ignore storage quota or privacy-mode failures.
    }
  }

  function getVisitorId() {
    let visitorId = localStorage.getItem(visitorKey);
    if (!visitorId) {
      visitorId = createId("visitor");
      localStorage.setItem(visitorKey, visitorId);
    }
    return visitorId;
  }

  function getSession() {
    const now = Date.now();
    const current = readJson(sessionKey, null);
    if (current && now - current.lastSeen < sessionTimeout) {
      const next = { ...current, lastSeen: now };
      writeJson(sessionKey, next);
      return next;
    }

    const next = {
      id: createId("session"),
      startedAt: new Date(now).toISOString(),
      lastSeen: now
    };
    writeJson(sessionKey, next);
    return next;
  }

  function getDeviceType() {
    const width = window.innerWidth || document.documentElement.clientWidth;
    if (width < 768) return "mobile";
    if (width < 1100) return "tablet";
    return "desktop";
  }

  function getSource() {
    if (!document.referrer) return "direct";
    try {
      return new URL(document.referrer).hostname || "referral";
    } catch (error) {
      return "referral";
    }
  }

  function buildEvent(type, details) {
    const session = getSession();
    return {
      id: createId("event"),
      type,
      timestamp: new Date().toISOString(),
      visitorId: getVisitorId(),
      sessionId: session.id,
      page: location.pathname || "index.html",
      pageTitle: document.title,
      language: document.documentElement.lang || document.body.dataset.lang || "",
      source: getSource(),
      referrer: document.referrer || "",
      device: getDeviceType(),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      screen: window.screen ? `${screen.width}x${screen.height}` : "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      userLanguage: navigator.language || "",
      details: details || {}
    };
  }

  function saveLocal(event) {
    const events = readJson(storageKey, []);
    events.push(event);
    writeJson(storageKey, events.slice(-maxLocalEvents));
  }

  function sendRemote(event) {
    if (!endpoint) return;

    const body = JSON.stringify(event);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
      return;
    }

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true
    }).catch(() => {});
  }

  function track(type, details) {
    const event = buildEvent(type, details);
    saveLocal(event);
    sendRemote(event);
    return event;
  }

  window.CSAnalytics = {
    track,
    storageKey,
    getEvents: () => readJson(storageKey, [])
  };

  function trackPageView() {
    track("page_view");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", trackPageView, { once: true });
  } else {
    trackPageView();
  }

  document.addEventListener(
    "submit",
    (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.matches("[data-inquiry-form]")) return;
      const data = new FormData(form);
      track("inquiry_submit", {
        product: data.get("product") || "",
        hasEmail: Boolean(data.get("email")),
        hasMessage: Boolean(data.get("message"))
      });
    },
    true
  );

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;

    const langButton = event.target.closest("[data-lang-switch]");
    if (langButton) {
      track("language_switch", {
        language: langButton.getAttribute("data-lang-switch") || ""
      });
      return;
    }

    const whatsappLink = event.target.closest("[data-whatsapp-link]");
    if (whatsappLink) {
      track("whatsapp_click", {
        href: whatsappLink.getAttribute("href") || "",
        label: whatsappLink.textContent.trim().replace(/\s+/g, " ")
      });
    }
  });
})();
