browser.runtime.onStartup.addListener(async () => {
  const enabled = await browser.declarativeNetRequest.getEnabledRulesets();
  if (!enabled.includes("ruleset")) {
    browser.browserAction.setIcon({
      path: Object.fromEntries(
        [16, 32, 48, 128].map((s) => [s, `/images/icon-${s}-off.png`])
      ),
    });
  }
});
