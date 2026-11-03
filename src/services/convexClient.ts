import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

const CONVEX_URL =
  process.env.EXPO_PUBLIC_CONVEX_URL ||
  "https://prestigious-anteater-117.convex.cloud";

export const convexClient = new ConvexHttpClient(CONVEX_URL);
export { api };
