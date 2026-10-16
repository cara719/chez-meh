import assert from "node:assert/strict";
import { parseReply, summarizeDiary, buildPrompt } from "../lib/receipt.js";

// A reply wrapped in a code fence still parses; fields are cleaned and the app name is normalised.
const r = parseReply('Here you go:\n```json\n{"restaurant":"  Deli  Two ","cuisine":"Italian","service_type":"delivery","delivery_app":"doordash","date":"2026-10-14","time":"19:05","dishes":[{"item":"Italian Special","dish_type":"Italian sub"},{"item":"italian special","dish_type":null},{"item":"","dish_type":"x"},{"item":"Fries"}],"notes":""}\n```');
assert.equal(r.restaurant, "Deli Two"); assert.equal(r.delivery_app, "DoorDash"); assert.equal(r.date, "2026-10-14"); assert.equal(r.time, "19:05");
assert.deepEqual(r.dishes, [{ item: "Italian Special", dish_type: "Italian sub" }, { item: "Fries", dish_type: null }]); // duplicates and blanks dropped
// Unknown apps keep their own name; dine-in never carries an app; a time without a date is dropped.
assert.equal(parseReply('{"service_type":"delivery","delivery_app":"Waitr","dishes":[]}').delivery_app, "Waitr");
assert.equal(parseReply('{"service_type":"dine_in","delivery_app":"DoorDash","dishes":[]}').delivery_app, null);
assert.equal(parseReply('{"time":"19:05","dishes":[]}').time, null);
// Bad values become null instead of reaching the form.
const bad = parseReply('{"date":"yesterday","time":"7pm","service_type":"takeout","dishes":"none","restaurant":42}');
assert.deepEqual([bad.date, bad.time, bad.service_type, bad.restaurant, bad.dishes.length], [null, null, null, null, 0]);
assert.equal(parseReply("I can't read this."), null); assert.equal(parseReply("{not json}"), null); assert.equal(parseReply(undefined), null);
assert.equal(parseReply(JSON.stringify({ dishes: Array.from({ length: 30 }, (_, i) => ({ item: "Dish " + i })) })).dishes.length, 12); // capped

// The prompt carries what the diary already knows, once each, and today's date.
const d = summarizeDiary([
  { cuisine_type: "Italian", restaurant: "Sub Shop", dish_type: "Italian sub" },
  { cuisine_type: "italian", restaurant: "sub shop", dish_type: "ITALIAN SUB" },
  { cuisine_type: "Thai", restaurant: "Bangkok Bowl", dish_type: null },
]);
assert.equal(d.cuisines.length, 2); assert.equal(d.restaurants.length, 2); assert.equal(d.types.length, 1);
const prompt = buildPrompt(d, "2026-10-15");
assert(prompt.includes("2026-10-15") && prompt.includes("Sub Shop") && prompt.includes("Bangkok Bowl") && prompt.includes("Italian sub"));
console.log("All receipt checks passed.");
