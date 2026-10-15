const str = (v) => (typeof v === "string" ? v.trim() : "");
const rating = (v) => (Number.isInteger(v) && v >= 1 && v <= 5 ? v : null);

// Validates a submitted meal against the spec's data integrity rules and returns a clean record.
export function cleanEntry(b) {
  const e = {
    entry_id: str(b.entry_id),
    schema_version: 1,
    occurred_at: str(b.occurred_at),
    created_at: new Date().toISOString(),
    created_by: str(b.created_by) || null,
    restaurant: str(b.restaurant),
    service_type: b.service_type,
    item: str(b.item),
    cuisine_type: str(b.cuisine_type),
    food_rating: rating(b.food_rating),
    food_comment: str(b.food_comment),
    delivery_app: null, delivery_rating: null, delivery_comment: null,
  };
  if (!e.entry_id || !/^[A-Za-z0-9_-]{8,64}$/.test(e.entry_id)) return { error: "Bad entry id." };
  if (!e.restaurant || !e.item || !e.cuisine_type) return { error: "Restaurant, dish and cuisine are required." };
  if (e.service_type !== "dine_in" && e.service_type !== "delivery") return { error: "Service type must be dine-in or delivery." };
  if (e.food_rating === null) return { error: "Food rating must be a whole number from 1 to 5." };
  if (Number.isNaN(Date.parse(e.occurred_at))) return { error: "Bad meal date." };
  if (e.service_type === "delivery" && b.delivery_rating != null) {
    const r = rating(b.delivery_rating);
    if (r === null) return { error: "Delivery rating must be a whole number from 1 to 5." };
    if (!str(b.delivery_app)) return { error: "Delivery app is required when a delivery rating is given." };
    e.delivery_app = str(b.delivery_app); e.delivery_rating = r; e.delivery_comment = str(b.delivery_comment);
  }
  return { entry: e };
}

