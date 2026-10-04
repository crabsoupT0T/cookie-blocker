const enabledEl = document.getElementById("enabled");
const statusEl = document.getElementById("status");
const siteEl = document.getElementById("site");
const listEl = document.getElementById("list");
const noteEl = document.getElementById("note");

let state = { enabled: true, allowlist: [] };

function paint() {
  enabledEl.checked = state.enabled;
  statusEl.textContent = state.enabled ? "Blocking every cookie" : "Off";
  listEl.replaceChildren();
  for (const host of state.allowlist) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = host;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Remove";
    btn.addEventListener("click", () => {
      save({ allowlist: state.allowlist.filter((h) => h !== host) });
    });
    li.append(span, btn);
    listEl.append(li);
  }
}

function save(patch) {
  chrome.runtime.sendMessage({ type: "setState", patch }, (next) => {
    if (next) state = next;
    paint();
  });
}

enabledEl.addEventListener("change", () => save({ enabled: enabledEl.checked }));
document.getElementById("add").addEventListener("click", () => {
  const host = siteEl.value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!host || state.allowlist.includes(host)) return;
  siteEl.value = "";
  save({ allowlist: [...state.allowlist, host] });
});
siteEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("add").click();
});
document.getElementById("purge").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "purge" }, (res) => {
    noteEl.textContent = res
      ? `Removed ${res.removed} cookie${res.removed === 1 ? "" : "s"}.`
      : "Could not clear cookies.";
  });
});

chrome.runtime.sendMessage({ type: "getState" }, (next) => {
  if (next) state = next;
  paint();
});
