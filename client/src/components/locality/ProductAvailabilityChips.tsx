import React from "react";

type Props = {
  is_local_delivery_available?: boolean;
  is_shipping_available?: boolean;

  // keep backward compat with camelCase props as well
  isLocalDeliveryAvailable?: boolean;
  isShippingAvailable?: boolean;
};

export default function ProductAvailabilityChips(props: Props) {
  const local =
    props.is_local_delivery_available ?? props.isLocalDeliveryAvailable ?? false;
  const shipping =
    props.is_shipping_available ?? props.isShippingAvailable ?? false;

  if (!local && !shipping) return null;

  const base =
    "inline-flex items-center rounded-full text-xs px-2 py-1 border";
  if (local && shipping) {
    return (
      <div className="mt-2">
        <span className={`${base} bg-blue-500/10 text-blue-100 border-blue-500/30`}>
          Local + Shipping
        </span>
      </div>
    );
  }
  if (local) {
    return (
      <div className="mt-2">
        <span className={`${base} bg-amber-500/10 text-amber-100 border-amber-500/30`}>
          Local delivery only
        </span>
      </div>
    );
  }
  return (
    <div className="mt-2">
      <span className={`${base} bg-emerald-500/10 text-emerald-100 border-emerald-500/30`}>
        Shipping only
      </span>
    </div>
  );
}