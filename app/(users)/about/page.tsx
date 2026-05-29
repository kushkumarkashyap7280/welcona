import { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "About Our Story & Journey | Welcona Luxury Bath Fittings",
  description:
    "Discover Welcona's factory-direct journey starting in 2008 in Shahdara, Delhi. Deeply rooted in Indian home emotions, premium CP fittings engineering, and a lifetime on-site warranty support.",
};

export default function AboutPage() {
  return <AboutClient />;
}