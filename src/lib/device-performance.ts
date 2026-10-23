// How much visual effect this device can handle smoothly.
// "high": the full 3D scene; "low": a lighter 3D scene; "off": no 3D, CSS background only.
export type EffectsTier = "off" | "low" | "high";

export const EFFECTS_LITE_CLASS = "effects-lite";

// Runs in <head> before first paint. Budget devices (fewer than 4 CPU cores, under 4 GB of
// memory, Data Saver, or a 2G connection) get the "effects-lite" class: no 3D, no smooth-scroll
// library, and no frosted-glass blur, which is costly on low-end phones.
export const EFFECTS_LITE_SCRIPT = `try{var n=navigator,c=n.connection||{};if((n.hardwareConcurrency||8)<4||(n.deviceMemory&&n.deviceMemory<4)||c.saveData||/2g$/.test(c.effectiveType||""))document.documentElement.classList.add("${EFFECTS_LITE_CLASS}")}catch(e){}`;

const STORAGE_KEY = "gl-effects-tier";
const REMEMBER_MS = 14 * 24 * 60 * 60 * 1000;

export function isLiteDevice() {
  return document.documentElement.classList.contains(EFFECTS_LITE_CLASS);
}

/** A lower tier this device fell back to on a recent visit, so it starts there instead of lagging again. */
function rememberedTier(): EffectsTier | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as { tier?: EffectsTier; at?: number } | null;
    if (saved?.tier && saved.at && Date.now() - saved.at < REMEMBER_MS) return saved.tier;
  } catch { /* storage unavailable: decide fresh */ }
  return null;
}

export function rememberTier(tier: EffectsTier) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ tier, at: Date.now() })); } catch { /* storage unavailable */ }
}

export const lowerTier = (tier: EffectsTier): EffectsTier => tier === "high" ? "low" : "off";

/** Whether WebGL2 works, and whether it runs on a real GPU rather than slow software rendering. */
function probeGpu() {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return { webgl2: false, software: false };
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return { webgl2: true, software: /swiftshader|llvmpipe|softpipe|software|basic render driver/i.test(renderer) };
  } catch {
    return { webgl2: false, software: false };
  }
}

// Picks the 3D quality to start with. Creating the WebGL probe briefly blocks the main thread,
// so call this once, after the intro splash. The scene then watches its own frame rate and
// steps down further if needed.
export function startingTier(): EffectsTier {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || isLiteDevice()) return "off";
  const remembered = rememberedTier();
  if (remembered === "off") return "off";
  const gpu = probeGpu();
  if (!gpu.webgl2 || gpu.software) return "off";
  if (remembered === "low") return "low";
  const nav = navigator as Navigator & { deviceMemory?: number };
  const modest = window.innerWidth < 900 || (nav.hardwareConcurrency ?? 8) < 8 || (nav.deviceMemory ?? 8) < 8;
  return modest ? "low" : "high";
}
