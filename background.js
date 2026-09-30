const PURGE = {
  id: "purge",
  css: ["purge.css"],
  matches: browser.runtime.getManifest().permissions.filter((p) => p.includes("://")),
  runAt: "document_start",
};

const iconPaths = (on) =>
  Object.fromEntries(
    [16, 32, 48, 128].map((s) => [s, `/images/icon-${s}${on ? "" : "-off"}.png`])
  );

async function apply(id, on) {
  if (id === PURGE.id) {
    const has = (await browser.scripting.getRegisteredContentScripts({ ids: [id] })).length > 0;
    if (on && !has) await browser.scripting.registerContentScripts([PURGE]);
    else if (!on && has) await browser.scripting.unregisterContentScripts({ ids: [id] });
    return;
  }
  await browser.declarativeNetRequest.updateEnabledRulesets(
    on ? { enableRulesetIds: [id] } : { disableRulesetIds: [id] }
  );
  if (id === "ruleset") await browser.browserAction.setIcon({ path: iconPaths(on) });
}

browser.runtime.onInstalled.addListener(async () => {
  for (const [id, on] of Object.entries(await browser.storage.local.get())) await apply(id, on);
});

browser.runtime.onStartup.addListener(async () => {
  const enabled = await browser.declarativeNetRequest.getEnabledRulesets();
  if (!enabled.includes("ruleset")) browser.browserAction.setIcon({ path: iconPaths(false) });
});

browser.runtime.onMessage.addListener((msg) =>
  "id" in msg
    ? browser.storage.local.set({ [msg.id]: msg.on }).then(() => apply(msg.id, msg.on))
    : browser.declarativeNetRequest.getEnabledRulesets()
);
