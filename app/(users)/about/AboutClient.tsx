"use client";

import { motion } from "framer-motion";
import {
  Heart,
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Users,
  Wrench,
  Droplet,
  Compass,
  ChevronRight,
  TrendingUp,
  Sparkle,
  Clock,
  Map
} from "lucide-react";

export default function AboutClient() {
  const emotionalPillars = [
    {
      title: "Purity & Sacred Beginnings",
      sanskrit: "पावन प्रवाह (Sacred Flow)",
      description:
        "In every Indian home, water is not just a resource; it is a symbol of purity, hospitality, and life itself. The first splash of cold water at dawn is a sacred ritual. Welcona's premium chrome-plated fittings deliver that flow with flawless precision, ensuring the beginning of your day is always pure, gentle, and refreshing.",
      icon: Droplet,
      gradient: "from-sky-500/10 to-primary/10",
      iconColor: "text-sky-500"
    },
    {
      title: "A Promise of a Lifetime",
      sanskrit: "अटूट विश्वास (Unbreakable Trust)",
      description:
        "Indian homes are built to last for generations, and the relationships within them are forever. Welcona respects this ethos of enduring bond. By backing our hardware with a rock-solid 7 to 10-year warranty featuring direct on-site support, we offer more than just plumbing — we offer the reassurance of a family member who stands by you.",
      icon: ShieldCheck,
      gradient: "from-emerald-500/10 to-primary/10",
      iconColor: "text-emerald-500"
    },
    {
      title: "Swadeshi Roots, Pan-India Pride",
      sanskrit: "स्वदेशी निर्माण (Indigenous Craft)",
      description:
        "Rooted in the industrious landscape of Ram Nagar-Shahdara, Delhi, our designs are tailor-made for Indian hard-water conditions. By manufacturing locally and shifting to an advanced factory-direct model, we bypass expensive middlemen. We deliver premium luxury engineering directly to your doorstep at fair, honest prices.",
      icon: Compass,
      gradient: "from-amber-500/10 to-primary/10",
      iconColor: "text-amber-500"
    }
  ];

  const timelineEvents = [
    {
      year: "2008 – 2009",
      phase: "The Foundation",
      title: "Roots in Shahdara, Delhi",
      description:
        "Welcona's story began in the heart of Delhi — Ram Nagar-Shahdara. Starting as a regional manufacturer and supplier, we set out to build a reputation for reliability, precision, and craftsmanship.",
      details: "Laid down the foundation of robust foundry practices and regional distribution.",
      icon: MapPin,
      color: "bg-primary/20 text-primary border-primary/40"
    },
    {
      year: "2015 – 2018",
      phase: "Redefining Value",
      title: "The Shift to Factory-Direct",
      description:
        "To protect our customers from high distributor and middleman markups, we transitioned to a factory-direct value model. This historic shift allowed us to provide high-end chrome-plated luxury fittings at competitive rates, securing a local customer satisfaction score of 4.9/5 stars.",
      details: "Bypassed supply chains to put custom value directly into the consumer's hands.",
      icon: Award,
      color: "bg-amber-500/20 text-amber-600 border-amber-500/40"
    },
    {
      year: "Present & Future",
      phase: "Pan-India Expansion",
      title: "Pan-India B2B Network",
      description:
        "Having grown past regional supply channels, Welcona is today actively building a pan-India B2B network. We are partnering with quality-driven dealers and distributors to bring elite sanitary engineering to modern households across all states.",
      details: "Inviting partners who share our core vision of affordable premium quality and exceptional on-site service.",
      icon: Users,
      color: "bg-purple-500/20 text-purple-600 border-purple-500/40"
    }
  ];

  const categoriesData = [
    {
      name: "Faucets & Taps",
      items: ["Modern Basin Mixers", "Heavy-Duty Stop Cocks", "Swan Neck Taps", "Sink Taps", "Brass Angle Valves"],
      bg: "from-primary/5 to-transparent"
    },
    {
      name: "Showers & Systems",
      items: ["Overhead Stainless Steel", "Grey Round Showers", "Premium Hand Showers", "Half-Bend Wall Arms"],
      bg: "from-indigo-500/5 to-transparent"
    },
    {
      name: "Wall Mixers",
      items: ["Heavy 3-in-1 Mixers", "Integrated Diverters", "Telephonic Shower Controls", "Dual Output Valves"],
      bg: "from-sky-500/5 to-transparent"
    },
    {
      name: "Sanitary Hardware",
      items: ["High-Grade Steel Spouts", "Complete Health Faucets", "Plumbing Accessories", "Utility Connectors"],
      bg: "from-emerald-500/5 to-transparent"
    }
  ];

  return (
    <div className="relative overflow-hidden pt-6 pb-20">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-1/3 left-10 -z-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

      <div className="mx-auto max-w-6xl px-4 md:px-8">
        
        {/* --- SECTION 1: HERO & BRAND IMAGE --- */}
        <section className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-[10px] sm:text-xs font-semibold text-primary uppercase tracking-wider">
              <Sparkles className="h-3 w-3" /> About Welcona
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl px-1">
              Crafting Elegance for the <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-primary via-amber-600 to-amber-500 bg-clip-text text-transparent">
                Heart of Indian Homes
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-xs sm:text-base text-muted-foreground px-2">
              Born from a legacy of precision engineering, Welcona blends modern luxury with deep-rooted values of trust, longevity, and familial warmth.
            </p>
          </motion.div>

          {/* Fully Responsive Top Image Block */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-10 overflow-hidden rounded-2xl md:rounded-3xl border border-border/80 bg-card p-1.5 shadow-2xl shadow-primary/5 md:p-3"
          >
            <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/about.png"
                alt="Welcona Luxury Bath Fittings - Brand Profile & Details"
                className="w-full h-auto object-contain transition-transform duration-700 hover:scale-[1.01]"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </section>

        {/* --- SECTION 2: INDIAN EMOTIONS (THE SOUL) --- */}
        <section className="mb-20">
          <div className="mb-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-2 px-2"
            >
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-4xl">
                The Emotions That Define Us
              </h2>
              <p className="mx-auto max-w-xl text-xs sm:text-base text-muted-foreground">
                In India, a house becomes a home through shared rituals, sacred bonds, and the deep reliance on elements that support our daily lives.
              </p>
            </motion.div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {emotionalPillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="luxury-card flex flex-col justify-between overflow-hidden relative group p-5 sm:p-6"
                >
                  <div className={`absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-gradient-to-br ${pillar.gradient} opacity-50 group-hover:scale-110 transition-transform duration-300`} />
                  
                  <div className="space-y-3 relative z-10">
                    <div className={`inline-flex rounded-xl bg-card p-2.5 shadow-md border border-border/50 ${pillar.iconColor}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold tracking-widest text-primary uppercase block mb-1">
                        {pillar.sanskrit}
                      </span>
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                        {pillar.title}
                      </h3>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground/90">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-border/40 flex items-center text-[10px] font-semibold text-primary">
                    <span>Rooted in Trust</span>
                    <Sparkle className="h-2.5 w-2.5 ml-1 animate-pulse" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* --- SECTION 3: THE DECORATIVE JOURNEY TIMELINE --- */}
        <section className="mb-20">
          <div className="mb-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-2 px-2"
            >
              <div className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-primary uppercase tracking-wider">
                <TrendingUp className="h-3.5 w-3.5" /> Safar Welcona Ka
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-4xl">
                Our Decorative Journey
              </h2>
              <p className="mx-auto max-w-xl text-xs sm:text-base text-muted-foreground">
                From a local neighborhood manufacturing unit in Delhi to a trusted nationwide brand name.
              </p>
            </motion.div>
          </div>

          {/* Decorative Timeline Structure (Fully responsive for 320px phones) */}
          <div className="relative mx-auto max-w-4xl px-1">
            {/* Center vertical line on desktop, shifted left on mobile to maximize card width */}
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border/60 md:left-1/2 md:-ml-px" />

            <div className="space-y-10">
              {timelineEvents.map((event, index) => {
                const Icon = event.icon;
                const isEven = index % 2 === 0;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className={`relative flex flex-col md:flex-row md:items-center ${
                      isEven ? "md:flex-row-reverse" : ""
                    }`}
                  >
                    {/* Circle Pin on Line */}
                    <div className="absolute left-3 z-10 -ml-2.5 flex h-5 w-5 items-center justify-center rounded-full border-4 border-background bg-primary shadow-sm md:left-1/2 md:-ml-2.5" />

                    {/* Left/Right Card Container */}
                    <div className="w-full pl-8 pr-1 md:w-1/2 md:pl-0 md:px-8">
                      <div className="luxury-panel p-5 shadow-sm relative hover:shadow-lg transition-all duration-300 border border-border/80 hover:border-primary/30">
                        {/* Event Header with spacing and responsive alignment */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                          <div className={`rounded-xl border p-2 w-fit shrink-0 ${event.color}`}>
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-black tracking-wider uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-md font-mono">
                                {event.year}
                              </span>
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                {event.phase}
                              </span>
                            </div>
                            <h3 className="text-sm sm:text-base font-extrabold text-foreground leading-snug tracking-tight">
                              {event.title}
                            </h3>
                          </div>
                        </div>

                        <p className="text-xs leading-relaxed text-muted-foreground/90">
                          {event.description}
                        </p>

                        <div className="mt-4 pt-3 border-t border-border/50 text-[10px] text-muted-foreground/80 flex items-start gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                          <span>{event.details}</span>
                        </div>
                      </div>
                    </div>

                    {/* Hidden spacer block for desktop alignment */}
                    <div className="hidden md:block md:w-1/2" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* --- SECTION 4: PRODUCT SPECIFICATIONS & ENGINEERING --- */}
        <section className="mb-20">
          <div className="luxury-panel p-5 md:p-10 relative overflow-hidden bg-linear-to-b from-card to-background border border-border/80">
            <div className="absolute top-0 right-0 h-40 w-40 rounded-bl-full bg-primary/5 -z-10" />
            
            <div className="max-w-3xl space-y-5">
              <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground">
                What We Craft: Engineered to Outlast
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Welcona's collection revolves around high-purity brass, thick triple-layer Chrome Plating (CP), and rigorous pressure testing. Every single faucet, shower, and mixer is fine-tuned to withstand tough conditions, providing the ultimate long-term satisfaction.
              </p>

              <div className="grid gap-4 sm:grid-cols-2 mt-6">
                {categoriesData.map((cat, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl border border-border/50 p-4 bg-gradient-to-br ${cat.bg} hover:border-primary/20 transition-all duration-300`}
                  >
                    <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {cat.name}
                    </h3>
                    <ul className="grid grid-cols-1 gap-1.5 pl-2">
                      {cat.items.map((item, i) => (
                        <li key={i} className="text-[11px] text-muted-foreground/90 flex items-center gap-1.5">
                          <ChevronRight className="h-3 w-3 text-primary/60 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Promise Highlight */}
            <div className="mt-8 border-t border-border/60 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-foreground">Our Core Brand Promise</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Enjoy absolute peace of mind with our 7 to 10-year replacement warranty, inclusive of direct, hassle-free on-site technician service support.
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3.5 py-2 text-primary text-[11px] font-bold shadow-xs self-start sm:self-auto">
                <Wrench className="h-3.5 w-3.5" />
                <span>On-Site Support Guarantee</span>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 5: OUTLET LOCATION & GOOGLE MAP --- */}
        <section className="mb-6">
          <div className="mb-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-2 px-2"
            >
              <div className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-primary uppercase tracking-wider">
                <Map className="h-3.5 w-3.5" /> Flagship Showroom
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-4xl">
                Visit Our Store & Manufacturing Hub
              </h2>
              <p className="mx-auto max-w-xl text-xs sm:text-base text-muted-foreground">
                Experience the premium quality and mirror finishes of Welcona products in person at our flagship outlet.
              </p>
            </motion.div>
          </div>

          <div className="grid gap-6 lg:grid-cols-12 items-stretch">
            {/* Address Details (Left 5 columns) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div className="luxury-panel p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="inline-flex rounded-xl bg-primary/15 p-2.5 text-primary border border-primary/30">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold tracking-widest text-primary uppercase block">
                      Official Outlet Address
                    </span>
                    <h3 className="text-base font-bold text-foreground">
                      Welcona Luxury Bath Fittings
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground font-medium">
                      11/29, Ram Nagar,<br />
                      Shahdara, New Delhi,<br />
                      Delhi – 110032, India
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary shrink-0" />
                    <span>
                      <strong className="text-foreground font-semibold">Opening Hours:</strong> 10:00 AM – 7:30 PM (Mon – Sat)
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      Bulk order inquiries, wholesale catalogs, and dealer onboarding consultations available on-site.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Map (Right 7 columns) */}
            <div className="lg:col-span-7 rounded-3xl border border-border/80 bg-card p-1.5 shadow-xl shadow-primary/5 min-h-[300px] lg:min-h-full flex">
              <div className="relative w-full h-full min-h-[280px] rounded-2xl overflow-hidden bg-muted flex-1">
                <iframe
                  src="https://maps.google.com/maps?q=11/29,%20Ram%20Nagar,%20Shahdara,%20New%20Delhi,%20Delhi%20110032&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: "280px" }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Welcona Shahdara Outlet Map Location"
                  className="absolute inset-0 w-full h-full"
                ></iframe>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
