export const INTRO_SPLASH_CLASS = "intro-splash";

// Runs in <head> before first paint, so returning visitors never see a flash of the splash.
// Plays once per browser session, on the home page only, and never for reduced motion.
// If the CSP moves to nonces, this script needs the nonce.
export const INTRO_SPLASH_SCRIPT = `try{if(location.pathname==="/"&&!sessionStorage.getItem("gl-intro")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.classList.add("${INTRO_SPLASH_CLASS}");sessionStorage.setItem("gl-intro","1")}}catch(e){}`;
