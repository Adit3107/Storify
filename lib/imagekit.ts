/**
 * Shared ImageKit Instance
 *
 * ImageKit is used as our media asset delivery layer instead of serving files
 * directly from the application server. This architecture decision is critical:
 *
 * WHY ImageKit (not "for image upload"):
 * - Serving media directly from the app server increases backend load and response times
 * - ImageKit provides CDN-backed optimized asset delivery — files are cached geographically
 *   closer to users, reducing latency and improving delivery speed
 * - On-the-fly transformations (resize, format conversion, quality optimization) without
 *   storing multiple variants — saving storage costs
 * - Built-in signed URL support for secure, time-limited file access
 *
 * Architecture:
 *   Frontend → Upload API → ImageKit (object storage + CDN) → Metadata in DB → URL returned
 *
 * This separates file STORAGE (ImageKit) from file METADATA (PostgreSQL/Neon),
 * which is the standard pattern for scalable file management systems.
 */

import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "",
});

export default imagekit;
