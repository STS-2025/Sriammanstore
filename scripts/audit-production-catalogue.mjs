import fs from "node:fs";
import path from "node:path";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, collectionGroup } from "firebase/firestore";

const config = {
  projectId: "sri-amman-smart-store",
  authDomain: "sri-amman-smart-store.firebaseapp.com",
  messagingSenderId: "1018585256480",
  apiKey: "AIzaSyDTzovF1RChmczvRXTNtY9-i-cOTI2JAuQ",
};

const app = initializeApp(config, "live-audit-inspector-2");
const db = getFirestore(app);

async function runAudit() {
  const topSnap = await getDocs(collection(db, "products"));
  const topMap = new Map();
  topSnap.forEach((doc) => {
    topMap.set(doc.id, { id: doc.id, path: doc.ref.path, data: doc.data() });
  });

  const nestedSnap = await getDocs(collectionGroup(db, "items"));
  const nestedMap = new Map();
  nestedSnap.forEach((doc) => {
    const parentCategory = doc.ref.parent?.parent?.id;
    if (!nestedMap.has(doc.id)) nestedMap.set(doc.id, []);
    nestedMap.get(doc.id).push({ id: doc.id, path: doc.ref.path, parentCategory, data: doc.data() });
  });

  const allIds = Array.from(new Set([...topMap.keys(), ...nestedMap.keys()]));

  const productsSummary = [];

  for (const id of allIds) {
    const topEntry = topMap.get(id);
    const nestedEntries = nestedMap.get(id) || [];
    const chosen = topEntry || nestedEntries[0];
    const data = chosen.data;

    let imageSummary = {
      hasImage: false,
      type: "none",
      mimeType: null,
      byteSize: 0,
      isValid: false,
    };

    if (data.image && typeof data.image === "string") {
      imageSummary.hasImage = true;
      if (data.image.startsWith("data:image/")) {
        const mimeMatch = data.image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (mimeMatch) {
          imageSummary.type = "base64-data-uri";
          imageSummary.mimeType = mimeMatch[1];
          imageSummary.byteSize = Math.floor((mimeMatch[2].length * 3) / 4);
          imageSummary.isValid = true;
        } else {
          imageSummary.type = "malformed-data-uri";
        }
      } else if (data.image.startsWith("http://") || data.image.startsWith("https://")) {
        imageSummary.type = "http-url";
        imageSummary.isValid = true;
      }
    }

    const paths = [];
    if (topEntry) paths.push(topEntry.path);
    nestedEntries.forEach((n) => paths.push(n.path));

    productsSummary.push({
      id,
      name: data.name || data.productName || null,
      tamilName: data.tamilName || data.nameTamil || null,
      brand: data.brand || data.brandName || null,
      category: data.category || data.categoryName || null,
      categoryId: data.categoryId || data.catId || null,
      subCategory: data.subCategory || data.subcategory || null,
      description: data.description ? `${data.description.length} chars` : null,
      rawDescription: data.description || null,
      paths,
      imageSummary,
      rootPricing: {
        price: data.price,
        mrp: data.mrp,
        offerPrice: data.offerPrice,
        sellingPrice: data.sellingPrice,
        originalPrice: data.originalPrice,
        discount: data.discount,
        memberPrice: data.memberPrice,
        specialPrice: data.specialPrice,
      },
      rootStock: {
        stock: data.stock,
        inStock: data.inStock,
        isAvailable: data.isAvailable,
        available: data.available,
      },
      options: Array.isArray(data.options)
        ? data.options.map((o) => ({
            unitSize: o.unitSize,
            unit: o.unit,
            price: o.price,
            offerPrice: o.offerPrice,
            mrp: o.mrp,
            stock: o.stock,
            inStock: o.inStock,
            posFields: Object.keys(o).filter((k) =>
              ["barcode", "sku", "purchasePrice", "batchNumber", "safetyStock", "expiryDate"].includes(k)
            ),
          }))
        : null,
      variants: Array.isArray(data.variants)
        ? data.variants.map((v) => ({
            weight: v.weight,
            unit: v.unit,
            unitSize: v.unitSize,
            price: v.price,
            offerPrice: v.offerPrice,
            mrp: v.mrp,
            stock: v.stock,
            inStock: v.inStock,
            posFields: Object.keys(v).filter((k) =>
              ["barcode", "sku", "purchasePrice", "batchNumber", "safetyStock", "expiryDate"].includes(k)
            ),
          }))
        : null,
      rating: data.rating ?? null,
      reviewCount: data.reviewCount ?? data.reviewsCount ?? null,
      rootPosFields: Object.keys(data).filter((k) =>
        ["barcode", "sku", "purchasePrice", "batchNumber", "safetyStock", "expiryDate"].includes(k)
      ),
    });
  }

  const outPath = "C:\\Users\\ELCOT\\.gemini\\antigravity\\brain\\c912f88c-93ba-47f5-b1e8-fbf5b31c96c8\\scratch\\production-audit-results.json";
  fs.writeFileSync(outPath, JSON.stringify(productsSummary, null, 2), "utf8");
  console.log(`Saved audit of ${productsSummary.length} products to ${outPath}`);
}

runAudit().catch(console.error);

