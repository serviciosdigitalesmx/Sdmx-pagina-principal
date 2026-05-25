import { CapacitorConfig } from "@capacitor/cli";
import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../..");
const envFiles = [resolve(root, ".env.local"), resolve(root, ".env.example")];

for (const file of envFiles) {
  if (existsSync(file)) {
    loadEnv({ path: file, override: false });
  }
}

const webUrl = (
  process.env.MOBILE_WEB_URL ||
  process.env.NEXT_PUBLIC_WEB_ADMIN_URL ||
  process.env.APP_URL ||
  ""
).trim();

const config: CapacitorConfig = {
  appId: "mx.serviciosdigitalesmx.fixi",
  appName: "FIXI",
  webDir: "web",
  server: webUrl
    ? {
        url: webUrl,
        cleartext: /^http:\/\//i.test(webUrl),
      }
    : undefined,
  android: {
    allowMixedContent: true,
  },
};

export default config;
