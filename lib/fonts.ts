/**
 * Japanese Font Loading Strategy
 *
 * Approach: next/font/google (self-hosted with unicode-range splitting)
 * Measured transfer size: 67.8 KB (4 woff2 subsets for test string "ある朝、桜が咲いた。")
 * Measured FOIT: 28ms (display:swap — text visible immediately via fallback)
 * Total font-face rules: 244 (2 weights × ~122 unicode-range subsets)
 * Total self-hosted files: 250 woff2 (7.2 MB on disk, only matched subsets transferred)
 *
 * Decision: next/font/google replicates Google CDN's CJK unicode-range splitting
 * at build time. Per-page transfer is 50-200 KB depending on character coverage.
 * No need for Google CDN <link> — self-hosting gives same performance without
 * external network dependency.
 */

import { Shippori_Mincho } from "next/font/google";

export const shipporiMincho = Shippori_Mincho({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-shippori-mincho",
  fallback: ["Hiragino Mincho ProN", "Yu Mincho", "serif"],
});
