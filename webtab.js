const WEB = ["14", "web"];
const LABEL = "udm14WebLabel";
const KEEP = ["class", "style", "href", "dir", "role"];

const store = (k, v) => {
  try {
    return v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v);
  } catch (e) {}
};

const tabs = () =>
  [...document.querySelectorAll('[role="listitem"] > a')].filter(
    (a) => a.offsetParent && a.innerText.trim()
  );

function webLink() {
  for (const a of document.querySelectorAll('a[href*="udm=web"]')) {
    try {
      if (new URL(a.href).searchParams.get("udm") === "web") return a;
    } catch (e) {}
  }
  return null;
}

function strip(el) {
  for (const n of [el, ...el.querySelectorAll("*")])
    for (const { name } of [...n.attributes])
      if (!KEEP.includes(name)) n.removeAttribute(name);
}

function addWebTab() {
  const p = new URLSearchParams(location.search);
  const here = tabs();

  if (WEB.includes(p.get("udm"))) {
    const cur = here.find((a) => a.closest("[aria-current]") || a.querySelector("[aria-current]"));
    if (cur) store(LABEL, cur.innerText.trim());
    return true;
  }

  if (!p.get("q") || document.querySelector("a[data-udm14]")) return true;
  const web = webLink();
  if (web && web.offsetParent) return true;
  if (!here.length) return false;

  const model =
    here.find((a) => {
      const u = new URL(a.href, location.href);
      const q = u.searchParams;
      return u.pathname === "/search" && !q.get("udm") && !q.get("tbm");
    }) || here[0];

  const url = new URL("/search", location.origin);
  url.searchParams.set("q", p.get("q"));
  if (p.get("hl")) url.searchParams.set("hl", p.get("hl"));
  url.searchParams.set("udm", "14");

  const item = model.parentElement.cloneNode(true);
  strip(item);
  const a = item.querySelector("a");
  a.href = url.href;
  a.setAttribute("data-udm14", "");
  const text = [...a.querySelectorAll("*")].find((n) => !n.children.length && n.textContent.trim());
  (text || a).textContent = (web && web.innerText.trim()) || store(LABEL) || "Web";

  model.parentElement.after(item);
  return true;
}

browser.runtime.sendMessage({ enabled: true }).then((on) => {
  if (!on || addWebTab()) return;
  const observer = new MutationObserver(() => addWebTab() && observer.disconnect());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 5000);
}, () => {});
