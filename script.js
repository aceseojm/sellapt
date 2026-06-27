const CONFIG = window.LANDING_CONFIG || {};
const GAS_WEBAPP_URL = CONFIG.GAS_WEBAPP_URL || "";
const FIXED_DEVELOPER = "서정민";

const modal = document.querySelector("[data-modal]");
const openModalButtons = document.querySelectorAll("[data-open-modal]");
const closeModalButtons = document.querySelectorAll("[data-close-modal]");
const leadForms = document.querySelectorAll("[data-lead-form]");
const phoneLinks = document.querySelectorAll("[data-phone-click], a[href^='tel:']");
const toast = document.getElementById("toast");

let toastTimer = null;

function openModal() {
  if (!modal) return;
  modal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeModal() {
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("modal-open");
}

function showToast(message, isError = false) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.toggle("is-error", isError);
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2400);
}

function normalizePhone(phone) {
  return phone.replace(/[^0-9]/g, "");
}

function detectDevice() {
  return window.innerWidth <= 768 ? "mobile" : "desktop";
}

function isConfiguredUrl(url) {
  return url && !url.includes("YOUR_WEBAPP_ID");
}

function getStatusElement(form) {
  return form.querySelector(".form-status");
}

function setStatus(form, message, isError = false) {
  const status = getStatusElement(form);
  if (!status) return;
  status.textContent = message;
  status.style.color = isError ? "#d33927" : "#0f7c86";
}

function trackEvent(eventName, params = {}) {
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }

  if (typeof window.fbq === "function") {
    if (eventName === "lead_submit_success") {
      window.fbq("track", "Lead", params);
    } else {
      window.fbq("trackCustom", eventName, params);
    }
  }

  if (window.dataLayer && Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, ...params });
  }

  if (CONFIG.NAVER_CONVERSION_ID && window.wcs_do) {
    try {
      window.wcs_do();
    } catch (error) {
      console.error(error);
    }
  }
}

function attachPhoneTracking() {
  phoneLinks.forEach((link) => {
    link.addEventListener("click", () => {
      trackEvent("phone_click", {
        page_name: "메디스파크 랜딩페이지",
        device: detectDevice()
      });
    });
  });
}

function validateConsent(formData, form) {
  if (!formData.get("privacyConsent")) {
    setStatus(form, "개인정보 수집 및 이용 동의가 필요합니다.", true);
    return false;
  }

  return true;
}

function isFileProtocol() {
  return window.location.protocol === "file:";
}

async function sendLeadPayload(payload) {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  };

  if (isFileProtocol()) {
    await fetch(GAS_WEBAPP_URL, {
      ...requestOptions,
      mode: "no-cors"
    });

    return { ok: true, message: "sent_no_cors" };
  }

  const response = await fetch(GAS_WEBAPP_URL, requestOptions);
  const result = await response.json();
  return result;
}

async function submitLeadForm(form) {
  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  const phone = normalizePhone(String(formData.get("phone") || ""));

  if (name.length < 2) {
    setStatus(form, "성함을 다시 확인해주세요.", true);
    return;
  }

  if (!(phone.length === 10 || phone.length === 11)) {
    setStatus(form, "연락처를 다시 확인해주세요.", true);
    return;
  }

  if (!validateConsent(formData, form)) {
    return;
  }

  const payload = {
    name,
    phone,
    developer: FIXED_DEVELOPER,
    pageName: String(formData.get("pageName") || "메디스파크 랜딩페이지"),
    source:
      new URLSearchParams(window.location.search).get("utm_source") ||
      String(formData.get("source") || "direct"),
    medium: new URLSearchParams(window.location.search).get("utm_medium") || "",
    campaign:
      new URLSearchParams(window.location.search).get("utm_campaign") ||
      new URLSearchParams(window.location.search).get("campaign") ||
      "",
    content: new URLSearchParams(window.location.search).get("utm_content") || "",
    term: new URLSearchParams(window.location.search).get("utm_term") || "",
    device: detectDevice(),
    memo: "상담 연결 요청",
    privacyConsent: true
  };

  if (!isConfiguredUrl(GAS_WEBAPP_URL)) {
    setStatus(form, "config.js에 Apps Script 웹앱 URL을 입력해야 실제 접수가 작동합니다.", true);
    showToast("Apps Script URL 설정이 필요합니다.", true);
    return;
  }

  const submitButton = form.querySelector('[type="submit"]');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "접수 중...";
  }

  trackEvent("lead_submit_attempt", {
    page_name: payload.pageName,
    source: payload.source,
    campaign: payload.campaign,
    device: payload.device
  });

  try {
    const result = await sendLeadPayload(payload);

    if (!result.ok) {
      throw new Error(result.message || "save_failed");
    }

    form.reset();
    setStatus(form, "접수가 완료되었습니다. 빠르게 연락드리겠습니다.");
    showToast("접수가 완료되었습니다. 빠르게 연락드리겠습니다.");

    trackEvent("lead_submit_success", {
      page_name: payload.pageName,
      source: payload.source,
      campaign: payload.campaign,
      device: payload.device
    });

    if (!modal.hidden) {
      window.setTimeout(() => {
        closeModal();
      }, 1200);
    }
  } catch (error) {
    console.error(error);
    setStatus(form, "접수 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.", true);
    showToast("접수 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.", true);

    trackEvent("lead_submit_error", {
      page_name: payload.pageName,
      source: payload.source,
      campaign: payload.campaign,
      device: payload.device
    });
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "상담 연결";
    }
  }
}

openModalButtons.forEach((button) => {
  button.addEventListener("click", openModal);
});

closeModalButtons.forEach((button) => {
  button.addEventListener("click", closeModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

leadForms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitLeadForm(form);
  });
});

attachPhoneTracking();
