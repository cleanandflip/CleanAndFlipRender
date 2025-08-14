// Centralized copy for fulfillment/delivery system
export const fulfillmentCopy = {
  badges: {
    localOnly: "Local delivery only",
    localAndShipping: "Local delivery & shipping"
  },
  
  banners: {
    inZone: "Free local delivery in your area • Most orders arrive in 24–48 hrs",
    outOfZone: "You're outside our local delivery area. Local-only items can't be added."
  },
  
  pdp: {
    localOnlyNote: "This heavy item is local delivery only. Delivered within 24–48 hrs in our area."
  },
  
  cart: {
    blockedTooltip: "Local-only item. Not available in your area."
  },
  
  benefits: {
    deliveryWindow: "24–48 hr delivery window",
    heavyHandling: "Heavy item handling", 
    noWaste: "No packaging waste",
    localSupport: "Local support"
  },
  
  actions: {
    checkZip: "Check your ZIP",
    addToCart: "Add to Cart",
    unavailable: "Not available in your area"
  },
  
  aria: {
    fulfillmentBadge: "Fulfillment method",
    deliveryBanner: "Delivery eligibility information",
    zipChecker: "Enter ZIP code to check delivery availability"
  }
} as const;

export type FulfillmentCopy = typeof fulfillmentCopy;
export default fulfillmentCopy;