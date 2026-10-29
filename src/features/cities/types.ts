export interface City {
  id: string; // "geo:<id GeoNames>" или "current-location"
  name: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
  isCurrentLocation: boolean;
}
