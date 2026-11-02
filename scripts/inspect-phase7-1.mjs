import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs, collectionGroup } from "firebase/firestore";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";

const config = {
  projectId: "sri-amman-smart-store",
  authDomain: "sri-amman-smart-store.firebaseapp.com",
  messagingSenderId: "1018585256480",
  apiKey: "AIzaSyDTzovF1RChmczvRXTNtY9-i-cOTI2JAuQ",
  storageBucket: "sri-amman-smart-store.firebasestorage.app",
};

const app = initializeApp(config, "phase7-1-inspector");
const db = getFirestore(app);
const storage = getStorage(app);

function summarizeImage(val) {
  if (!val) return null;
  if (typeof val !== "string") return { type: typeof val };
  if (val.startsWith("data:image/")) {
    const match = val.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (match) {
      return {
        type: "base64-data-uri",
        mimeType: match[1],
        byteSize: Math.floor((match[2].length * 3) / 4),
        preview: match[2].substring(0, 30) + "...",
      };
    }
    return { type: "malformed-data-uri", length: val.length };
  }
  return { type: "url-or-path", value: val };
}

async function inspectProduct(id) {
  const topRef = doc(db, "products", id);
  const topSnap = await getDoc(topRef);

  const nestedRef = doc(db, "products", "Grocery", "items", id);
  const nestedSnap = await getDoc(nestedRef);

  return {
    id,
    topExists: topSnap.exists(),
    topData: topSnap.exists() ? topSnap.data() : null,
    nestedExists: nestedSnap.exists(),
    nestedData: nestedSnap.exists() ? nestedSnap.data() : null,
  };
}

async function inspectStorage() {
  const results = {
    rootFiles: [],
    rootPrefixes: [],
    errors: [],
  };
  try {
    const rootRef = ref(storage);
    const rootList = await listAll(rootRef);
    results.rootFiles = rootList.items.map((i) => i.fullPath);
    results.rootPrefixes = rootList.prefixes.map((p) => p.fullPath);

    for (const prefix of rootList.prefixes) {
      try {
        const subList = await listAll(prefix);
        results[prefix.name] = {
          files: subList.items.map((i) => i.fullPath),
          prefixes: subList.prefixes.map((p) => p.fullPath),
        };
      } catch (err) {
        results.errors.push(`Prefix ${prefix.fullPath}: ${err.message}`);
      }
    }
  } catch (err) {
    results.errors.push(`Root listAll: ${err.message}`);
  }
  return results;
}

async function main() {
  console.log("=== PHASE 7.1 LIVE INSPECTION START ===");

  // 1. Inspect Chicken Masala (prod-munn8cp3)
  console.log("--- 1. Inspecting prod-munn8cp3 ---");
  const cm = await inspectProduct("prod-munn8cp3");
  const cmData = cm.topData || cm.nestedData;
  if (cmData) {
    console.log("Product Name:", cmData.name);
    console.log("Image fields in prod-munn8cp3:");
    for (const key of Object.keys(cmData)) {
      if (key.toLowerCase().includes("image") || key.toLowerCase().includes("photo") || key.toLowerCase().includes("pic") || key.toLowerCase().includes("url")) {
        console.log(`  ${key}:`, summarizeImage(cmData[key]));
      }
    }
    console.log("Options in prod-munn8cp3:", JSON.stringify(cmData.options, null, 2));
    console.log("Variants in prod-munn8cp3:", JSON.stringify(cmData.variants, null, 2));
    console.log("Root unit/weight/stock in prod-munn8cp3:", {
      unit: cmData.unit,
      weight: cmData.weight,
      stock: cmData.stock,
      price: cmData.price,
      mrp: cmData.mrp,
    });
  } else {
    console.log("prod-munn8cp3 NOT FOUND");
  }

  // Also check prod-munnjfuy (Puliyogare) image for byte comparison
  const puli = await inspectProduct("prod-munnjfuy");
  const puliData = puli.topData || puli.nestedData;
  if (puliData && cmData) {
    const cmFront = cmData.frontImageUrl || cmData.imageUrl;
    const puliFront = puliData.frontImageUrl || puliData.imageUrl;
    const isExactMatch = cmFront === puliFront;
    console.log("Is Chicken Masala frontImageUrl exact bit-for-bit match with Puliyogare?", isExactMatch);
  }

  // 2. Inspect Storage objects
  console.log("--- 2. Inspecting Firebase Storage ---");
  const storageReport = await inspectStorage();
  console.log("Storage report:", JSON.stringify(storageReport, null, 2));

  // 3. Inspect pack weights across all products
  console.log("--- 3. Inspecting pack weights across all products ---");
  const productIds = [
    "prod-mumqpksq",
    "prod-mumrbamt",
    "prod-munn8cp3",
    "prod-munnbzf7",
    "prod-munnezib",
    "prod-munnjfuy",
    "prod-munnwgk0",
    "prod-mv0jd8dy",
  ];

  const weightSummary = [];
  for (const id of productIds) {
    const p = await inspectProduct(id);
    const d = p.topData || p.nestedData;
    if (d) {
      weightSummary.push({
        id,
        name: d.name,
        rootUnit: d.unit,
        rootWeight: d.weight,
        options: (d.options || []).map((o) => ({
          unit: o.unit,
          unitSize: o.unitSize,
          weight: o.weight,
        })),
        variants: (d.variants || []).map((v) => ({
          name: v.name,
          unit: v.unit,
          weight: v.weight,
        })),
      });
    }
  }
  console.log("Weight Summary:\n", JSON.stringify(weightSummary, null, 2));

  console.log("=== PHASE 7.1 LIVE INSPECTION END ===");
}

main().catch(console.error);

