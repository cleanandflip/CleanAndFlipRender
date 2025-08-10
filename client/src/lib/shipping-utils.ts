// Shipping method utility functions
export function getShippingMethodLabel(method: string, isLocalCustomer: boolean): string {
  if (method === 'local_delivery' && isLocalCustomer) {
    return 'Free Local Delivery to Your Doorstep';
  }
  if (method === 'local-delivery' && isLocalCustomer) {
    return 'Free Local Delivery to Your Doorstep';
  }
  if (method === 'standard') {
    return 'Standard Shipping';
  }
  if (method === 'express') {
    return 'Express Shipping';
  }
  return method;
}

export function getShippingMethodDescription(method: string, isLocalCustomer: boolean): string {
  if (method === 'local_delivery' && isLocalCustomer) {
    return 'Same day or next day delivery to your doorstep in Asheville area';
  }
  if (method === 'local-delivery' && isLocalCustomer) {
    return 'Same day or next day delivery to your doorstep in Asheville area';
  }
  if (method === 'standard') {
    return 'Standard shipping 3-7 business days';
  }
  if (method === 'express') {
    return 'Express shipping 1-2 business days';
  }
  return '';
}

export function isLocalDeliveryMethod(method: string): boolean {
  return method === 'local_delivery' || method === 'local-delivery' || method === 'local_pickup';
}