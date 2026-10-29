export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<string | null> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
    { signal, headers: { Accept: 'application/json' } }
  );

  if (!response.ok) {
    throw new Error(`Reverse geocoding failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    display_name?: string;
    address?: {
      road?: string;
      neighbourhood?: string;
      suburb?: string;
      city?: string;
      town?: string;
      village?: string;
      state?: string;
    };
  };

  if (data.address) {
    const locality = data.address.city || data.address.town || data.address.village;
    const parts = [data.address.road, data.address.neighbourhood || data.address.suburb, locality]
      .filter(Boolean)
      .slice(0, 3);
    if (parts.length > 0) return parts.join(', ');
  }

  return data.display_name || null;
}
