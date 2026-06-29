(function () {
  const SESSION_KEY = "braincity_medispark_session_id";
  const TRACKING_KEY = "braincity_medispark_tracking_context";

  function createId() {
    return `bc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function safeParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function getHostFromReferrer(referrer) {
    if (!referrer) return "";
    try {
      return new URL(referrer).host;
    } catch (error) {
      return "";
    }
  }

  const url = new URL(window.location.href);
  const storedSessionId = localStorage.getItem(SESSION_KEY);
  const sessionId = storedSessionId || createId();
  const saved = safeParse(localStorage.getItem(TRACKING_KEY), {});

  localStorage.setItem(SESSION_KEY, sessionId);

  const context = {
    sessionId,
    entryUrl: saved.entryUrl || window.location.href,
    firstSeenAt: saved.firstSeenAt || new Date().toISOString(),
    referrer: saved.referrer || document.referrer || "",
    referrerHost: saved.referrerHost || getHostFromReferrer(document.referrer || ""),
    utmSource: url.searchParams.get("utm_source") || saved.utmSource || "",
    utmMedium: url.searchParams.get("utm_medium") || saved.utmMedium || "",
    utmCampaign: url.searchParams.get("utm_campaign") || saved.utmCampaign || "",
    utmTerm: url.searchParams.get("utm_term") || saved.utmTerm || "",
    utmContent: url.searchParams.get("utm_content") || saved.utmContent || "",
    lastCta: saved.lastCta || "",
    ctaHistory: Array.isArray(saved.ctaHistory) ? saved.ctaHistory : [],
    pageViews: Number(saved.pageViews || 0) + 1
  };

  function persist() {
    localStorage.setItem(TRACKING_KEY, JSON.stringify(context));
  }

  function recordCta(label, meta) {
    if (!label) return;
    const detail = meta && meta.interestType ? ` (${meta.interestType})` : "";
    context.lastCta = label;
    context.ctaHistory = [...context.ctaHistory.slice(-19), `${new Date().toISOString()} ${label}${detail}`];
    persist();
  }

  function recordEvent(name, meta) {
    if (!name) return;
    const detail = meta ? ` ${JSON.stringify(meta)}` : "";
    context.ctaHistory = [...context.ctaHistory.slice(-19), `${new Date().toISOString()} ${name}${detail}`];
    persist();
  }

  function getContext() {
    return {
      ...context,
      ctaHistory: [...context.ctaHistory]
    };
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-cta]");
    if (!target) return;
    recordCta(target.dataset.cta || "unknown", {
      interestType: target.dataset.type || ""
    });
  });

  persist();

  window.BraincityTracker = {
    getContext,
    recordCta,
    recordEvent
  };
})();
