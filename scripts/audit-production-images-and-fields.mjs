import fs from "node:fs";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, collectionGroup } from "firebase/firestore";

const config = {
  projectId: "sri-amman-smart-store",
  authDomain: "sri-amman-smart-store.firebaseapp.com",
  messagingSenderId: "1018585256480",
  apiKey: "AIzaSyDTzovF1RChmczvRXTNtY9-i-cOTI2JAuQ",
};

const app = initializeApp(config, "image-field-auditor");
const db = getFirestore(app);

function summarizeImageString(val) {
  if (!val || typeof val !== "string") return { type: "none" };
  if (val.startsWith("data:image/")) {
    const match = val.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (match) {
      return {
        type: "base64-data-uri",
        mimeType: match[1],
        byteSize: Math.floor((match[2].length * 3) / 4),
        isValid: true,
      };
    }
    return { type: "malformed-data-uri", isValid: false };
  }
  if (val.startsWith("http://") || val.startsWith("https://")) {
    return { type: "http-url", urlSnippet: val.substring(0, 50), isValid: true };
  }
  return { type: "other-string", length: val.length, isValid: false };
}

async function run() {
  const topSnap = await getDocs(collection(db, "products"));
  const topMap = new Map();
  topSnap.forEach((doc) => topMap.set(doc.id, { id: doc.id, path: doc.ref.path, data: doc.data() }));

  const nestedSnap = await getDocs(collectionGroup(db, "items"));
  const nestedMap = new Map();
  nestedSnap.forEach((doc) => {
    if (!nestedMap.has(doc.id)) nestedMap.set(doc.id, []);
    nestedMap.get(doc.id).push({ id: doc.id, path: doc.ref.path, data: doc.data() });
  });

  const allIds = Array.from(new Set([...topMap.keys(), ...nestedMap.keys()]));
  const fullAudit = [];

  for (const id of allIds) {
    const topEntry = topMap.get(id);
    const nestedEntries = nestedMap.get(id) || [];
    const chosen = topEntry || nestedEntries[0];
    const d = chosen.data;

    // Check all image fields
    const images = {
      image: summarizeImageString(d.image),
      imageUrl: summarizeImageString(d.imageUrl),
      frontImageUrl: summarizeImageString(d.frontImageUrl),
      backImageUrl: summarizeImageString(d.backImageUrl),
      imageUrlsCount: Array.isArray(d.imageUrls) ? d.imageUrls.length : 0,
      imageUrlsSummaries: Array.isArray(d.imageUrls)
        ? d.imageUrls.map((u) => summarizeImageString(u))
        : [],
    };

    // Stock conflict check
    const rootStock = typeof d.stock === "number" ? d.stock : null;
    const optionStocks = Array.isArray(d.options) ? d.options.map((o) => o.stock) : [];
    const variantStocks = Array.isArray(d.variants) ? d.variants.map((v) => v.stock) : [];

    // Stock mismatch detection
    const stockMismatches = [];
    if (rootStock !== null) {
      if (variantStocks.length > 0 && variantStocks[0] !== rootStock) {
        stockMismatches.push(`root stock (${rootStock}) != variant[0] stock (${variantStocks[0]})`);
      }
      if (optionStocks.length > 0 && optionStocks[0] !== rootStock) {
        stockMismatches.push(`root stock (${rootStock}) != option[0] stock (${optionStocks[0]})`);
      }
    }
    if (optionStocks.length > 0 && variantStocks.length > 0 && optionStocks[0] !== variantStocks[0]) {
      stockMismatches.push(`option[0] stock (${optionStocks[0]}) != variant[0] stock (${variantStocks[0]})`);
    }

    // Pricing analysis
    const sellingPrice = d.sellingPrice ?? d.offerPrice ?? d.price;
    const mrp = d.mrp ?? d.originalPrice;
    const priceAnomalies = [];
    if (typeof sellingPrice === "number" && typeof mrp === "number") {
      if (sellingPrice > mrp) {
        priceAnomalies.push(`sellingPrice (${sellingPrice}) > mrp (${mrp})`);
      }
    }
    if (typeof sellingPrice === "number" && sellingPrice <= 0) {
      priceAnomalies.push(`sellingPrice is non-positive: ${sellingPrice}`);
    }

    // Weight/Unit conflicts
    const unitWeightConflicts = [];
    if (Array.isArray(d.variants)) {
      d.variants.forEach((v, idx) => {
        if (v.weight === 500 && d.unit && d.unit.toLowerCase().includes("20g")) {
          unitWeightConflicts.push(`variant[${idx}] weight is 500 while product unit is '${d.unit}'`);
        }
      });
    }

    fullAudit.push({
      id,
      name: d.name || d.productName,
      tamilName: d.tamilName || d.nameTamil,
      brand: d.brand || d.brandName,
      category: d.category || d.categoryName,
      categoryId: d.categoryId || d.catId,
      subCategory: d.subCategory || d.subcategory,
      allPaths: [
        ...(topEntry ? [topEntry.path] : []),
        ...nestedEntries.map((n) => n.path),
      ],
      pricing: {
        root: { price: d.price, mrp: d.mrp, sellingPrice: d.sellingPrice, offerPrice: d.offerPrice },
        optionPrices: Array.isArray(d.options) ? d.options.map((o) => ({ price: o.price, mrp: o.mrp, offerPrice: o.offerPrice })) : [],
        variantPrices: Array.isArray(d.variants) ? d.variants.map((v) => ({ price: v.price, mrp: v.mrp, offerPrice: v.offerPrice })) : [],
        anomalies: priceAnomalies,
      },
      stock: {
        rootStock,
        optionStocks,
        variantStocks,
        inStock: d.inStock,
        isAvailable: d.isAvailable,
        stockMismatches,
      },
      images,
      unitWeightConflicts,
      posFieldsFiltered: {
        root: Object.keys(d).filter((k) =>
          ["barcode", "sku", "purchasePrice", "batchNumber", "safetyStock", "expiryDate"].includes(k)
        ),
        variants: Array.isArray(d.variants)
          ? d.variants.map((v, i) => ({
              index: i,
              keys: Object.keys(v).filter((k) =>
                ["barcode", "sku", "purchasePrice", "batchNumber", "safetyStock", "expiryDate"].includes(k)
              ),
              purchasePrice: v.purchasePrice,
              barcode: v.barcode,
              sku: v.sku,
              batchNumber: v.batchNumber,
              safetyStock: v.safetyStock,
              expiryDate: v.expiryDate,
            }))
          : [],
      },
    });
  }

  const outPath = "C:\\Users\\ELCOT\\.gemini\\antigravity\\brain\\c912f88c-93ba-47f5-b1e8-fbf5b31c96c8\\scratch\\detailed-field-audit.json";
  fs.writeFileSync(outPath, JSON.stringify(fullAudit, null, 2), "utf8");
  console.log(`Saved detailed field audit for ${fullAudit.length} products to ${outPath}`);
}

run().catch(console.error);

