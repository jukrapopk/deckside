import type { Metadata } from "next";
import { DemoLibrary } from "@/demo/demo-library";

export const metadata: Metadata = {
  title: "Deckside (Demo)",
  description:
    "Try Deckside with a sample library. Everything stays in your browser.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DemoPage() {
  return <DemoLibrary />;
}
