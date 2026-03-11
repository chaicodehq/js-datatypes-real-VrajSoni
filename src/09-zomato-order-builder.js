/**
 * 🍕 Zomato Order Builder
 *
 * Zomato jaisa order summary banana hai! Cart mein items hain (with quantity
 * aur addons), ek optional coupon code hai, aur tujhe final bill banana hai
 * with itemwise breakdown, taxes, delivery fee, aur discount.
 *
 * Rules:
 *   - cart is array of items:
 *     [{ name: "Butter Chicken", price: 350, qty: 2, addons: ["Extra Butter:50", "Naan:40"] }, ...]
 *   - Each addon string format: "AddonName:Price" (split by ":" to get price)
 *   - Per item total = (price + sum of addon prices) * qty
 *   - Calculate:
 *     - items: array of { name, qty, basePrice, addonTotal, itemTotal }
 *     - subtotal: sum of all itemTotals
 *     - deliveryFee: Rs 30 if subtotal < 500, Rs 15 if 500-999, FREE (0) if >= 1000
 *     - gst: 5% of subtotal, rounded to 2 decimal places parseFloat(val.toFixed(2))
 *     - discount: based on coupon (see below)
 *     - grandTotal: subtotal + deliveryFee + gst - discount (minimum 0, use Math.max)
 *     - Round grandTotal to 2 decimal places
 *
 *   Coupon codes (case-insensitive):
 *     - "FIRST50"  => 50% off subtotal, max Rs 150 (use Math.min)
 *     - "FLAT100"  => flat Rs 100 off
 *     - "FREESHIP" => delivery fee becomes 0 (discount = original delivery fee value)
 *     - null/undefined/invalid string => no discount (0)
 *
 *   - Items with qty <= 0 ko skip karo
 *   - Hint: Use map(), reduce(), filter(), split(), parseFloat(),
 *     toFixed(), Math.max(), Math.min(), toLowerCase()
 *
 * Validation:
 *   - Agar cart array nahi hai ya empty hai, return null
 *
 * @param {Array<{ name: string, price: number, qty: number, addons?: string[] }>} cart
 * @param {string} [coupon] - Optional coupon code
 * @returns {{ items: Array<{ name: string, qty: number, basePrice: number, addonTotal: number, itemTotal: number }>, 
 * subtotal: number, deliveryFee: number, gst: number, discount: number, grandTotal: number } | null}
 *
 * @example
 *   buildZomatoOrder([{ name: "Biryani", price: 300, qty: 1, addons: ["Raita:30"] }], "FLAT100")
 *   // subtotal: 330, deliveryFee: 30, gst: 16.5, discount: 100
 *   // grandTotal: 330 + 30 + 16.5 - 100 = 276.5
 *
 *   buildZomatoOrder([{ name: "Pizza", price: 500, qty: 2, addons: [] }], "FIRST50")
 *   // subtotal: 1000, deliveryFee: 0, gst: 50, discount: min(500, 150) = 150
 *   // grandTotal: 1000 + 0 + 50 - 150 = 900
 */
// export function buildZomatoOrder(cart, coupon) {
//   if(!Array.isArray(cart) || cart.length===0) return null

//   const parseAddonPrice =(addstr) => {
//     if(typeof addstr !== "string") return 0;
//   };

// }
export function buildZomatoOrder(cart, coupon) {
  // 1) validate cart
  if (!Array.isArray(cart) || cart.length === 0) return null;

  // helper: parse addon price safely
  const parseAddonPrice = (addonStr) => {
    if (typeof addonStr !== "string") return 0;
    const parts = addonStr.split(":");
    if (parts.length < 2) return 0;
    const val = parseFloat(parts[1]);
    return Number.isFinite(val) ? val : 0;
  };

  const items = [];
  let subtotal = 0;

  // 2) process each cart entry
  for (const entry of cart) {
    if (!entry || typeof entry !== "object") continue;

    const name = entry.name;
    const basePrice = Number(entry.price);
    const qty = Number(entry.qty);

    if (typeof name !== "string" || !Number.isFinite(basePrice) || !Number.isFinite(qty) || qty <= 0) {
      continue; // skip invalid entries
    }

    let addonTotal = 0;
    if (Array.isArray(entry.addons) && entry.addons.length > 0) {
      for (const a of entry.addons) {
        addonTotal += parseAddonPrice(a);
      }
    }

    const itemTotal = (basePrice + addonTotal) * qty;

    items.push({
      name,
      qty,
      basePrice,
      addonTotal,
      itemTotal,
    });

    subtotal += itemTotal;
  }

  // if no valid items -> null
  if (items.length === 0) return null;

  // 3) delivery fee rules (compute originalDeliveryFee first)
  let originalDeliveryFee;
  if (subtotal >= 1000) originalDeliveryFee = 0;
  else if (subtotal >= 500) originalDeliveryFee = 15;
  else originalDeliveryFee = 30;

  // We'll possibly modify deliveryFee below if coupon is FREESHIP
  let deliveryFee = originalDeliveryFee;

  // 4) GST 5%, round to 2 decimals
  const gst = parseFloat((subtotal * 0.05).toFixed(2));

  // 5) coupon handling (case-insensitive)
  const code = typeof coupon === "string" ? coupon.trim().toLowerCase() : "";
  let discount = 0;
  if (code === "first50") {
    discount = Math.min(subtotal * 0.5, 150);
  } else if (code === "flat100") {
    discount = 100;
  } else if (code === "freeship") {
    // freeship means delivery becomes free -> discount equals the original delivery fee
    discount = originalDeliveryFee;
    deliveryFee = 0; // IMPORTANT: reflect freeship in returned deliveryFee
  } else {
    discount = 0;
  }

  // 6) grand total
  let grandTotal = subtotal + deliveryFee + gst - discount;
  grandTotal = Math.max(0, grandTotal);
  grandTotal = parseFloat(grandTotal.toFixed(2));

  // round subtotal too
  subtotal = parseFloat(subtotal.toFixed(2));

  return {
    items,
    subtotal,
    deliveryFee,
    gst,
    discount,
    grandTotal,
  };
}
