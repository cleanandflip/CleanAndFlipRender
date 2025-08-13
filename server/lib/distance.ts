// Miles distance calculation utility
import { WAREHOUSE, LOCAL_RADIUS_MILES } from '../config/shipping';

export function milesBetween(a: {lat:number,lng:number}, b:{lat:number,lng:number}) {
  const R = 3958.7613; // Earth radius in miles
  const dLat = (b.lat - a.lat) * Math.PI/180;
  const dLng = (b.lng - a.lng) * Math.PI/180;
  const la1 = a.lat * Math.PI/180, la2 = b.lat * Math.PI/180;
  const h = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}

export function getWarehouseCoords() {
  return WAREHOUSE;
}

export function isLocalMiles(lat: number | null, lng: number | null): boolean {
  if (lat == null || lng == null) return false;
  return milesBetween({lat, lng}, WAREHOUSE) <= LOCAL_RADIUS_MILES;
}

export function isLocalAddress(address: any): boolean {
  return isLocalMiles(address.lat, address.lng);
}