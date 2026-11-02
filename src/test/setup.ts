import "@testing-library/jest-dom/vitest";
import fs from "node:fs";
import path from "node:path";
import { beforeAll } from "vitest";
import { FirestoreAdapter, InMemoryFirestoreDriver } from "../services/firestoreAdapter";
import { apiClient } from "../services/apiClient";
import { outboxJournal } from "../services/outboxJournal";

const dbJsonPath = path.resolve(__dirname, "../../db.json");
const rawDbData = JSON.parse(fs.readFileSync(dbJsonPath, "utf-8"));

beforeAll(() => {
  outboxJournal.clearAll();
  const memoryDriver = new InMemoryFirestoreDriver(rawDbData);
  apiClient.setFirestoreAdapter(new FirestoreAdapter(memoryDriver));
  apiClient.setMode("auto");
  apiClient.resetSourceState();
});

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

