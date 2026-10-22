export const INTRO_SPLASH_CLASS = "intro-splash";
// Added once the page has hydrated. Until then only the orbit spins (it runs on the GPU);
// the logo build, splash exit, and hero entrance wait, so hydration can't stutter them.
export const INTRO_READY_CLASS = "intro-ready";
// When the splash has fully faded, counted from ready (its exit in globals.css ends at 2.9s).
// Heavy work such as the 3D hero waits until then.
export const INTRO_SPLASH_DURATION_MS = 2900;

// Runs in <head> before first paint, so returning visitors never see a flash of the splash.
// Plays once per browser session, on the home page only, and never for reduced motion.
// The timeout starts the logo anyway if hydration is slow or the app's JavaScript fails.
// If the CSP moves to nonces, this script needs the nonce.
export const INTRO_SPLASH_SCRIPT = `try{if(location.pathname==="/"&&!sessionStorage.getItem("gl-intro")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){var h=document.documentElement;h.classList.add("${INTRO_SPLASH_CLASS}");sessionStorage.setItem("gl-intro","1");setTimeout(function(){h.classList.add("${INTRO_READY_CLASS}")},2500)}}catch(e){}`;
