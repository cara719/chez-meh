// Checks the query rules from the spec against sample data. Run: npm test
const fs = require("fs"), path = require("path"), assert = require("assert");
const html = fs.readFileSync(path.join(__dirname, "../src/app.html"), "utf8");
const js = html.match(/function norm[\s\S]*?var Q = \{[\s\S]*?\n  \};/)[0];
const ts = (e) => { const t = Date.parse(e.occurred_at); return isNaN(t) ? 0 : t; };
const Q = new Function("ts", js + "; return Q;")(ts);
const d = (day) => `2026-10-${day}T19:00:00-04:00`;
const E = [
  { item: "Ramen", restaurant: "A", food_rating: 5, occurred_at: d("01"), cuisine_type: "Japanese" },
  { item: "ramen ", restaurant: "B", food_rating: 5, occurred_at: d("10"), cuisine_type: "Japanese" },
  { item: "Tonkotsu ramen", restaurant: "C", food_rating: 5, occurred_at: d("11") },
  { item: "Tikka", restaurant: "A", food_rating: 3, occurred_at: d("12"), delivery_app: "DoorDash", delivery_rating: 4 },
  { item: "Naan", restaurant: "a", food_rating: 4, occurred_at: d("13"), delivery_app: "doordash", delivery_rating: 2 },
  { item: "Pad thai", restaurant: "D", food_rating: 2, occurred_at: d("14"), delivery_rating: 5 },
];
const r = Q.restaurant(E, "a"); assert.equal(r.count, 3); assert.equal(r.avg, "4.00");
assert.deepEqual(Q.top(E, 3).map((e) => e.item), ["Tonkotsu ramen", "ramen ", "Ramen"]);
assert.equal(Q.top(E, 5, "japanese").length, 2);
const g = Q.delivery(E, ""); assert.equal(g.length, 2); assert.equal(g[1].label, "DoorDash"); assert.equal(g[1].avg, "3.00"); assert.equal(g[1].n, 2);
assert.deepEqual(Q.versions([], "x"), []);
// Best version of a dish type: one row per restaurant and dish name, ranked by average, then tries, then recency.
const S = [
  { item: "The Stallion", dish_type: "Italian sub", restaurant: "Sub Shop", food_rating: 5, occurred_at: d("01") },
  { item: "the stallion", dish_type: "italian sub", restaurant: "sub shop", food_rating: 4, occurred_at: d("09") },
  { item: "Italian Special", dish_type: "Italian sub", restaurant: "Deli Two", food_rating: 4, occurred_at: d("05") },
  { item: "Italian Special", dish_type: "Italian sub", restaurant: "Deli Two", food_rating: 5, occurred_at: d("06") },
  { item: "Meatball Sub", dish_type: "Meatball sub", restaurant: "Deli Two", food_rating: 5, occurred_at: d("07") },
  { item: "Italian sub", restaurant: "Old Place", food_rating: 2, occurred_at: d("02") }, // older entry: matches by dish name
];
const v = Q.versions(S, "ITALIAN SUB");
assert.equal(v.length, 3);
assert.deepEqual(v.map((x) => x.item), ["The Stallion", "Italian Special", "Italian sub"]); // both 4.50 with 2 tries: the more recent one ranks first
assert.deepEqual(v.map((x) => x.avg), ["4.50", "4.50", "2.00"]);
assert.equal(v[0].n, 2); assert.equal(v[2].restaurant, "Old Place");
assert.equal(Q.versions(S, "meatball sub").length, 1);
// Two dishes from one order share a visit_id, so the delivery rating counts once.
const V = [
  { entry_id: "a1", visit_id: "v1", food_rating: 5, delivery_app: "DoorDash", delivery_rating: 4, occurred_at: d("15") },
  { entry_id: "a2", visit_id: "v1", food_rating: 3, delivery_app: "DoorDash", delivery_rating: 4, occurred_at: d("15") },
  { entry_id: "a3", visit_id: "v2", food_rating: 4, delivery_app: "doordash", delivery_rating: 2, occurred_at: d("16") },
];
const vg = Q.delivery(V, "");
assert.equal(vg.length, 1); assert.equal(vg[0].n, 2); assert.equal(vg[0].avg, "3.00");
console.log("All query-rule checks passed.");
