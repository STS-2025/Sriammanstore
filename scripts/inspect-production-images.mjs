import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  APPROVED_PRODUCT_DOC_IDS,
  resolveProductionFirebaseConfig,
  readProductDocViaRest,
} from "./verify-production-connectivity.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scratchDir = "C:\\Users\\ELCOT\\.gemini\\antigravity\\brain\\c912f88c-93ba-47f5-b1e8-fbf5b31c96c8\\scratch";
fs.mkdirSync(scratchDir, { recursive: true });

async function run() {
  const config = resolveProductionFirebaseConfig();

  for (const docId of APPROVED_PRODUCT_DOC_IDS) {
    const res = await readProductDocViaRest(config, docId);
    const raw = res.raw;

    const imgKeys = Object.keys(raw).filter(
      (k) =>
        k.toLowerCase().includes("image") ||
        k.toLowerCase().includes("photo") ||
        k.toLowerCase().includes("pic")
    );
    console.log(`\n========================================================`);
    console.log(`DOCUMENT: ${docId} | Name: "${raw.name}" | Tamil: "${raw.tamilName || raw.nameTamil}"`);
    console.log(`Image-related keys:`, imgKeys);

    for (const key of imgKeys) {
      const val = raw[key];
      if (typeof val === "string") {
        const hash = crypto.createHash("md5").update(val).digest("hex");
        const isDataUri = val.startsWith("data:");
        console.log(`  ${key}: length=${val.length}, isDataUri=${isDataUri}, md5=${hash}`);

        if (isDataUri) {
          const match = val.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
          if (match) {
            const ext = match[1] === "jpeg" ? "jpg" : match[1];
            const buffer = Buffer.from(match[2], "base64");
            const fileName = `${docId}_${key}.${ext}`;
            const filePath = path.join(scratchDir, fileName);
            fs.writeFileSync(filePath, buffer);
            console.log(`    -> Wrote ${fileName} (${buffer.length} bytes)`);
          }
        }
      } else if (Array.isArray(val)) {
        console.log(`  ${key} is Array(length=${val.length}):`);
        val.forEach((item, idx) => {
          if (typeof item === "string") {
            const hash = crypto.createHash("md5").update(item).digest("hex");
            const isDataUri = item.startsWith("data:");
            console.log(`    [${idx}]: length=${item.length}, isDataUri=${isDataUri}, md5=${hash}`);
            if (isDataUri) {
              const match = item.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
              if (match) {
                const ext = match[1] === "jpeg" ? "jpg" : match[1];
                const buffer = Buffer.from(match[2], "base64");
                const fileName = `${docId}_${key}_idx${idx}.${ext}`;
                const filePath = path.join(scratchDir, fileName);
                fs.writeFileSync(filePath, buffer);
                console.log(`      -> Wrote ${fileName} (${buffer.length} bytes)`);
              }
            }
          }
        });
      }
    }
  }
}

run().catch(console.error);

