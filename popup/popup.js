const toggler = document.getElementById("toggler");
const sw = toggler.closest(".switch");
const RULESET = "ruleset";
const WEB = ["14", "web"];

const iconPaths = (on) =>
  Object.fromEntries(
    [16, 32, 48, 128].map((s) => [s, `/images/icon-${s}${on ? "" : "-off"}.png`])
  );

async function init() {
  const enabled = await browser.declarativeNetRequest.getEnabledRulesets();
  toggler.checked = enabled.includes(RULESET);
  sw.offsetHeight;
  sw.classList.remove("no-transition");
}

async function refreshTab(on) {
  const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab?.url) return;
  const url = new URL(tab.url);
  const p = url.searchParams;
  if (url.pathname !== "/search" || !p.has("q")) return;
  if (on && !p.has("udm") && !p.has("tbm")) p.set("udm", "14");
  else if (!on && WEB.includes(p.get("udm"))) p.delete("udm");
  else return;
  browser.tabs.update(tab.id, { url: url.href });
}

toggler.addEventListener("change", async () => {
  const on = toggler.checked;
  const ids = [RULESET];
  await browser.declarativeNetRequest.updateEnabledRulesets(
    on ? { enableRulesetIds: ids } : { disableRulesetIds: ids }
  );
  browser.browserAction.setIcon({ path: iconPaths(on) });
  refreshTab(on);
});

init();
