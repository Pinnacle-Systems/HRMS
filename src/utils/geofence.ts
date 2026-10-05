export type GeofenceMode = "DISABLED" | "SOFT" | "STRICT";

export function normalizeGeofenceMode(
  mode?: GeofenceMode | string | null,
): GeofenceMode | null {
  if (mode == null || mode.trim() === "") {
    return null;
  }

  const normalizedMode = mode.trim().toUpperCase();
  return normalizedMode === "DISABLED" ||
    normalizedMode === "SOFT" ||
    normalizedMode === "STRICT"
    ? normalizedMode
    : null;
}

export interface GeofenceEvaluationInput {
  branchLatitude?: number | null;
  branchLongitude?: number | null;
  userLatitude?: number | null;
  userLongitude?: number | null;
  radiusKm?: number | null;
  mode?: GeofenceMode | string | null;
}

export interface GeofenceEvaluationResult {
  allowed: boolean;
  withinGeofence: boolean;
  distanceKm: number;
  mode: GeofenceMode;
  message: string;
}

const toRadians = (value: number) => (value * Math.PI) / 180;

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function evaluateGeofenceAccess({
  branchLatitude,
  branchLongitude,
  userLatitude,
  userLongitude,
  radiusKm,
  mode,
}: GeofenceEvaluationInput): GeofenceEvaluationResult {
  const normalizedMode = normalizeGeofenceMode(mode);
  if (mode != null && normalizedMode == null) {
    throw new Error(`Unsupported geofence mode: ${mode}`);
  }
  const effectiveMode = normalizedMode ?? "DISABLED";

  if (effectiveMode === "DISABLED") {
    return {
      allowed: true,
      withinGeofence: true,
      distanceKm: 0,
      mode: effectiveMode,
      message: "Geofence validation is disabled for this branch.",
    };
  }

  if (
    branchLatitude == null ||
    branchLongitude == null ||
    radiusKm == null ||
    Number(radiusKm) <= 0
  ) {
    return {
      allowed: effectiveMode !== "STRICT",
      withinGeofence: false,
      distanceKm: 0,
      mode: effectiveMode,
      message: "Branch geofence is not configured. Please contact your administrator.",
    };
  }

  if (userLatitude == null || userLongitude == null) {
    return {
      allowed: effectiveMode !== "STRICT",
      withinGeofence: false,
      distanceKm: 0,
      mode: effectiveMode,
      message:
        effectiveMode === "STRICT"
          ? "Location access is required to check in. Your current location could not be detected."
          : "Location access is required for geofence validation. Soft mode allows the punch but marks it outside the geofence.",
    };
  }

  const distanceKm = calculateDistanceKm(
    Number(branchLatitude),
    Number(branchLongitude),
    Number(userLatitude),
    Number(userLongitude),
  );

  const withinGeofence = distanceKm <= Number(radiusKm);

  if (effectiveMode === "STRICT") {
    if (withinGeofence) {
      return {
        allowed: true,
        withinGeofence: true,
        distanceKm,
        mode: effectiveMode,
        message: `You are within the allowed geofence (${distanceKm.toFixed(2)} km).`,
      };
    }

    return {
      allowed: false,
      withinGeofence: false,
      distanceKm,
      mode: effectiveMode,
      message: `Check-in blocked: you are outside the branch radius. Distance: ${distanceKm.toFixed(2)} km; allowed: ${Number(radiusKm).toFixed(2)} km.`,
    };
  }

  if (withinGeofence) {
    return {
      allowed: true,
      withinGeofence: true,
      distanceKm,
      mode: effectiveMode,
      message: `You are within the geofence (${distanceKm.toFixed(2)} km).`,
    };
  }

  return {
    allowed: true,
    withinGeofence: false,
    distanceKm,
    mode: effectiveMode,
    message: `Warning: you are outside the geofence (${distanceKm.toFixed(2)} km). Soft mode is enabled, so the check-in is allowed but flagged outside the geofence.`,
  };
}
