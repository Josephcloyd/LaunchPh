import Link from "next/link";
import { Brand } from "@/components/brand";
import { SocialIcon } from "@/components/social-icons";
import { GETLAUNCH_FACEBOOK_URL } from "@/lib/social-links";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <Brand/>
        <div className="footer-links">
          <Link href="/templates">Templates</Link>
          <Link href="/#products">Products</Link>
          <Link href="/#faqs">FAQs</Link>
          <Link href="/auth">Sign in</Link>
          <a className="footer-social" href={GETLAUNCH_FACEBOOK_URL} target="_blank" rel="noopener noreferrer"><SocialIcon platform="facebook" size={15}/> Facebook</a>
          <span>© 2026 GetLaunch PH</span>
        </div>
      </div>
    </footer>
  );
}
