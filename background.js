const DEFAULTS = {
  enabled: true,
  allowlist: []
};

const RULE_IDS = [1, 2];

function hostOf(domain) {
  return String(domain || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^\.+/, "");
}

function matchesAllow(cookieDomain, allowlist) {
  const d = hostOf(cookieDomain).replace(/^\./, "");
  return allowlist.some((raw) => {
    const a = hostOf(raw).replace(/^\./, "");
    return d === a || d.endsWith("." + a);
  });
}

async function getSettings() {
  const stored = await chrome.storage.local.get(DEFAULTS);
  return {
    enabled: stored.enabled !== false,
    allowlist: Array.isArray(stored.allowlist)
      ? stored.allowlist.map(hostOf).filter(Boolean)
      : []
  };
}

function buildRules(settings) {
  if (!settings.enabled) return [];
  const excluded = settings.allowlist.filter(Boolean);
  const condition = {
    urlFilter: "*",
    resourceTypes: [
      "main_frame",
      "sub_frame",
      "stylesheet",
      "script",
      "image",
      "font",
      "object",
      "xmlhttprequest",
      "ping",
      "csp_report",
      "media",
      "websocket",
      "webtransport",
      "webbundle",
      "other"
    ],
    ...(excluded.length ? { excludedRequestDomains: excluded } : {})
  };
  return [
    {
      id: 1,
      priority: 1,
      action: {
        type: "modifyHeaders",
        requestHeaders: [{ header: "cookie", operation: "remove" }]
      },
      condition
    },
    {
      id: 2,
      priority: 1,
      action: {
        type: "modifyHeaders",
        responseHeaders: [{ header: "set-cookie", operation: "remove" }]
      },
      condition
    }
  ];
}

async function removeCookie(cookie) {
  const host = cookie.domain.replace(/^\./, "");
  const url = `${cookie.secure ? "https" : "http"}://${host}${cookie.path || "/"}`;
  try {
    return await chrome.cookies.remove({
      url,
      name: cookie.name,
      storeId: cookie.storeId
    });
  } catch (_) {
    return null;
  }
}

async function purgeCookies(settings) {
  if (!settings.enabled) return 0;
  const all = await chrome.cookies.getAll({});
  let removed = 0;
  for (const cookie of all) {
    if (matchesAllow(cookie.domain, settings.allowlist)) continue;
    if (await removeCookie(cookie)) removed += 1;
  }
  return removed;
}

async function applyRules() {
  const settings = await getSettings();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: RULE_IDS,
    addRules: buildRules(settings)
  });
  await chrome.action.setBadgeText({ text: settings.enabled ? "ON" : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#c43c36" });
  if (settings.enabled) await purgeCookies(settings);
  return settings;
}

chrome.runtime.onInstalled.addListener(() => {
  applyRules();
});

chrome.runtime.onStartup.addListener(() => {
  applyRules();
});

chrome.storage.onChanged.addListener(() => {
  applyRules();
});

chrome.cookies.onChanged.addListener(async (info) => {
  if (info.removed) return;
  const settings = await getSettings();
  if (!settings.enabled) return;
  if (matchesAllow(info.cookie.domain, settings.allowlist)) return;
  await removeCookie(info.cookie);
});

chrome.alarms.create("sweep", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "sweep") getSettings().then(purgeCookies);
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "getState") {
    getSettings().then((settings) => sendResponse(settings));
    return true;
  }
  if (msg?.type === "setState") {
    chrome.storage.local.set(msg.patch || {}).then(async () => {
      sendResponse(await applyRules());
    });
    return true;
  }
  if (msg?.type === "purge") {
    getSettings().then(async (settings) => {
      sendResponse({ removed: await purgeCookies(settings) });
    });
    return true;
  }
  return false;
});

applyRules();
