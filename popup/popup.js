const toggler = document.getElementById("toggler");
const minusAi = document.getElementById("minus-ai");
const purgeAi = document.getElementById("purge-ai");
const settings = document.getElementById("settings");
const allTab = document.getElementById("all-tab");
const sw = toggler.closest(".switch");
const RULESET = "ruleset";
const MINUS_AI = "minus-ai";
const WEB = ["14", "web"];
const AI = / -ai$/i;

const save = (id, on) => browser.runtime.sendMessage({ id, on });

let turn = 0;
const spin = (deg) => settings.style.setProperty("--turn", `${(turn += deg)}deg`);

const showExtras = () => {
  for (const el of document.querySelectorAll(".extra")) el.hidden = !settings.checked;
};

async function init() {
  settings.checked = localStorage.settings === "1";
  if (settings.checked) spin(30);
  showExtras();
  const enabled = await browser.declarativeNetRequest.getEnabledRulesets();
  toggler.checked = enabled.includes(RULESET);
  minusAi.checked = enabled.includes(MINUS_AI);
  const css = (await browser.scripting.getRegisteredContentScripts()).map((s) => s.id);
  purgeAi.checked = css.includes("purge");
  allTab.checked = css.includes("all-tab");
  sw.offsetHeight;
  for (const el of document.querySelectorAll(".no-transition")) el.classList.remove("no-transition");
}

async function activeTab() {
  const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
  return tab?.url ? tab : null;
}

async function editTab(edit) {
  const tab = await activeTab();
  if (!tab) return;
  const url = new URL(tab.url);
  if (url.pathname !== "/search" || !edit(url.searchParams)) return false;
  browser.tabs.update(tab.id, { url: url.href });
  return true;
}

async function reload() {
  const tab = await activeTab();
  if (tab) browser.tabs.reload(tab.id);
}

const web = (on) => (p) => {
  if (on && p.get("udm") === "26") p.set("udm", "48");
  else if (!on && p.get("udm") === "48") p.set("udm", "26");
  else if (!p.has("q")) return false;
  else if (on && !p.has("udm") && !p.has("tbm")) p.set("udm", "14");
  else if (!on && WEB.includes(p.get("udm"))) p.delete("udm");
  else return false;
  return true;
};

const ai = (on) => (p) => {
  const q = p.get("q");
  if (!q) return false;
  if (on && !/-ai$/i.test(q)) p.set("q", `${q} -ai`);
  else if (!on && AI.test(q)) p.set("q", q.replace(AI, ""));
  else return false;
  return true;
};

// All tab needs the switch: ticking all tab turns the switch on, and turning the
// switch off unticks all tab. Unticking all tab or turning the switch on changes nothing else.
toggler.addEventListener("change", async () => {
  const on = toggler.checked;
  await save(RULESET, on);
  const css = !on && allTab.checked;
  if (css) {
    allTab.checked = false;
    await save("all-tab", false);
  }
  if (!(await editTab(web(on))) && css) reload();
});

minusAi.addEventListener("change", async () => {
  const on = minusAi.checked;
  await save(MINUS_AI, on);
  editTab(ai(on));
});

purgeAi.addEventListener("change", async () => {
  await save("purge", purgeAi.checked);
  reload();
});

allTab.addEventListener("change", async () => {
  await save("all-tab", allTab.checked);
  if (allTab.checked && !toggler.checked) {
    toggler.checked = true;
    await save(RULESET, true);
    if (await editTab(web(true))) return;
  }
  reload();
});

settings.addEventListener("change", () => {
  localStorage.settings = +settings.checked;
  spin(settings.checked ? 30 : -210);
  showExtras();
});

init();
