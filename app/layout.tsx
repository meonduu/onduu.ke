import type { Metadata } from "next";
import "./globals.css";
import "./site.css";
import { ConsentGate } from "./consent";
import { AttributionCapture } from "./attribution";
export const metadata: Metadata = { title:"Website Revenue and Digital Readiness in Kenya | Onduu", description:"Onduu helps established Kenyan businesses find and fix website weaknesses affecting enquiries, trust, control and resilience." };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}<AttributionCapture/><ConsentGate/></body></html>}
