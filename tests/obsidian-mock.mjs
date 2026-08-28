// Minimal Obsidian stub for logic tests (transitive imports via sync.ts).
export class TFile {}
export class Vault {}
export class TFolder {}
export function getLanguage() {
  return "en";
}
export function arrayBufferToBase64(data) {
  return Buffer.from(data).toString("base64");
}
export function base64ToArrayBuffer(b64) {
  const buf = Buffer.from(b64, "base64");
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}
export function requestUrl() {
  throw new Error("requestUrl not available in tests");
}
export const RequestUrlResponse = class {};
export function normalizePath(p) {
  return p;
}
export function formatDateTime() {
  return "";
}
export class Notice {}
