import type { Metadata } from "next";
import { LuxuryHomeClient } from "@/components/users/LuxuryHomeClient";

export const metadata: Metadata = {
  title: "Home",
  description: "Luxury bath fittings crafted by Welcona.",
};

export default function HomePage() {
  return <LuxuryHomeClient />;
}
