export function buildGoogleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

export function buildWazeUrl(latitude: number, longitude: number): string {
  return `https://waze.com/ul?ll=${latitude}%2C${longitude}&navigate=yes`;
}
