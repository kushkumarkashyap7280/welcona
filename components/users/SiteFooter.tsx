"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Facebook, Instagram, Mail, MessageCircle, PhoneCall } from "lucide-react";

export function SiteFooter() {
  const openAdminLogin = () => {
    window.dispatchEvent(new Event("welcona:open-admin-login"));
  };

  const contactLinks = [
    {
      href: "https://www.facebook.com/profile.php?id=61556130506467",
      label: "Facebook",
      icon: Facebook,
      external: true,
    },
    {
      href: "https://www.instagram.com/welcona_offical",
      label: "Instagram",
      icon: Instagram,
      external: true,
    },
    {
      href: "tel:+919818945601",
      label: "Helpline: 9818945601",
      icon: PhoneCall,
      external: false,
    },
    {
      href: "https://wa.me/919625711655",
      label: "WhatsApp: 9625711655",
      icon: MessageCircle,
      external: true,
    },
    {
      href: "mailto:Welconacpfitting@gmail.com",
      label: "Email",
      icon: Mail,
      external: false,
    },
  ] as const;

  const shopLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "All Products" },
    { href: "/dashboard/cart", label: "Cart" },
    { href: "/dashboard/orders", label: "My Orders" },
  ] as const;

  const supportLinks = [
    { href: "/about", label: "About Us" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms & Conditions" },
    { href: "/forgot-password", label: "Forgot Password" },
  ] as const;

  return (
    <footer className="border-t border-border/60 bg-linear-to-b from-background to-muted/20">
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
        <div className="grid gap-8 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
          <section className="space-y-3">
            <p className="text-base font-semibold tracking-wide text-foreground">Welcona</p>
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground/90">
              Premium CP fittings and home utility products with dependable support, secure checkout,
              and fast assistance for every query.
            </p>
            <button
              type="button"
              onClick={openAdminLogin}
              className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Admin Login
            </button>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/90">Shop</h3>
            <nav className="grid gap-2 text-xs">
              {shopLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/90">Support</h3>
            <nav className="grid gap-2 text-xs">
              {supportLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/90">Connect</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {contactLinks.map(({ href, label, icon: Icon, external }) => (
                <motion.a
                  key={href}
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                  aria-label={label}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 360, damping: 24 }}
                  className="group inline-flex items-center gap-2 rounded-lg border border-border/70 bg-card/80 px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm shadow-black/5 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
                >
                  <Icon className="h-3.5 w-3.5 text-primary transition-transform duration-200 group-hover:rotate-3" />
                  <span>{label}</span>
                </motion.a>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-7 border-t border-border/60 pt-4 text-center text-xs text-muted-foreground/90">
          <p>Helpline & queries: 9818945601 | WhatsApp: 9625711655</p>
          <p className="mt-1">&copy; {new Date().getFullYear()} Welcona. All rights reserved.</p>
          <p className="mt-2 text-[11px] text-muted-foreground/80">
            Built and Powered by{" "}
            <a
              href="https://www.linkedin.com/in/kush-kumar-b10020302/"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-foreground transition-colors hover:text-primary"
            >
              SARVAGYA LABS
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
