const LEAD_SHEET_NAME = "leads";
const TRACKING_SHEET_NAME = "lead_tracking";

const LEAD_HEADERS = [
  "submitted_at",
  "name",
  "phone",
  "phone_digits",
  "interest_type",
  "consult_type",
  "cta_label",
  "lead_owner",
  "lead_channel",
  "lead_number",
  "campaign_name",
  "landing_variant",
  "page_url",
  "page_title",
  "referrer",
  "referrer_host",
  "session_id",
  "entry_url",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "user_agent",
  "screen_size",
  "viewport_size",
  "language",
  "timezone"
];

const TRACKING_HEADERS = [
  "submitted_at",
  "name",
  "phone",
  "interest_type",
  "consult_type",
  "cta_label",
  "last_cta",
  "cta_history",
  "campaign_name",
  "landing_variant",
  "page_url",
  "referrer",
  "referrer_host",
  "session_id",
  "entry_url",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "user_agent",
  "screen_size",
  "viewport_size",
  "language",
  "timezone"
];

function doPost(e) {
  const payload = parsePayload_(e);
  ensureHeaders_(LEAD_SHEET_NAME, LEAD_HEADERS);
  ensureHeaders_(TRACKING_SHEET_NAME, TRACKING_HEADERS);

  appendRow_(LEAD_SHEET_NAME, LEAD_HEADERS, payload);
  appendRow_(TRACKING_SHEET_NAME, TRACKING_HEADERS, payload);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, message: "Braincity lead webhook ready" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function parsePayload_(e) {
  const parameters = (e && e.parameter) ? e.parameter : {};
  const payload = {};

  Object.keys(parameters).forEach(function (key) {
    payload[key] = normalizeValue_(parameters[key]);
  });

  if (!payload.submitted_at) {
    payload.submitted_at = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd'T'HH:mm:ssXXX");
  }

  return payload;
}

function ensureHeaders_(sheetName, headers) {
  const sheet = getOrCreateSheet_(sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
}

function appendRow_(sheetName, headers, payload) {
  const sheet = getOrCreateSheet_(sheetName);
  const row = headers.map(function (header) {
    return payload[header] || "";
  });
  sheet.appendRow(row);
}

function getOrCreateSheet_(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function normalizeValue_(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}
