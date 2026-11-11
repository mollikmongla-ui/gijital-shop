// DEMO ORDER MODE — আসল bKash/Nagad/Rocket পেমেন্টের সাথে এর কোনো সম্পর্ক নেই।
// অর্ডার Netlify Blobs (বিল্ট-ইন ডাটাবেস)-এ সংরক্ষিত হয়। কোনো পেমেন্ট ভেরিফাই বা দাবি করা হয় না।
// চালু করতে Netlify Environment Variables-এ DEMO_MODE=true দিন। (প্রোডাকশনে না দিলে এটি বন্ধ থাকে)
import { getStore } from "@netlify/blobs";
import { timingSafeEqual } from "node:crypto";

const PRODUCT = { name: "Mega Digital Collection Package", price: 99, currency: "BDT" };

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const clean = (v, max = 120) => String(v ?? "").replace(/<[^>]*>/g, "").trim().slice(0, max);

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

export default async (req) => {
  // Demo Mode সার্ভারে চালু না থাকলে কিছুই করবে না
  if (String(process.env.DEMO_MODE || "").toLowerCase() !== "true") {
    return json(403, { ok: false, error: "demo_disabled" });
  }

  let store;
  try {
    store = getStore({ name: "demo-orders", consistency: "strong" });
  } catch (e) {
    console.error("Blobs init failed:", e.message);
    return json(500, { ok: false, error: "storage_unavailable" });
  }

  // GET: টেস্ট অর্ডারগুলো দেখা (শুধু DEMO_ADMIN_KEY দিয়ে)
  if (req.method === "GET") {
    const adminKey = process.env.DEMO_ADMIN_KEY;
    const given = new URL(req.url).searchParams.get("key") || "";
    if (!adminKey || !safeEqual(given, adminKey)) return json(401, { ok: false, error: "unauthorized" });
    try {
      const { blobs } = await store.list({ prefix: "orders/" });
      const orders = (await Promise.all(blobs.slice(0, 200).map((b) => store.get(b.key, { type: "json" }))))
        .filter(Boolean)
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      return json(200, { ok: true, count: orders.length, orders });
    } catch (e) {
      console.error("Demo list failed:", e.message);
      return json(500, { ok: false, error: "storage_error" });
    }
  }

  if (req.method !== "POST") return json(405, { ok: false, error: "method_not_allowed" });

  try {
    const d = await req.json();
    const name = clean(d.name), email = clean(d.email), phone = clean(d.phone);
    if (d.website || !name || !/^\S+@\S+\.\S+$/.test(email) || !/^01\d{9}$/.test(phone)) {
      return json(422, { ok: false, error: "invalid_data" });
    }

    const stamp = new Date().toISOString();
    const id = "DEMO-" + stamp.slice(0, 10).replace(/-/g, "") + "-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    const order = {
      id,
      mode: "demo",
      payment_status: "not_paid", // কখনো "paid" হয় না
      payment_note: "Demo order. No real payment was made or verified.",
      name, email, phone,
      product: PRODUCT,
      created_at: stamp,
    };

    await store.setJSON(`orders/${id}`, order);
    return json(200, { ok: true, orderId: id, mode: "demo", paid: false });
  } catch (e) {
    console.error("Demo order failed:", e.message);
    return json(500, { ok: false, error: "save_failed" });
  }
};
