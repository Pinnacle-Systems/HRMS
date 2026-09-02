import { describe, expect, it } from 'vitest';
import { evaluateGeofenceAccess } from '../../src/utils/geofence';

describe('evaluateGeofenceAccess', () => {
  it('allows check-in when distance is within strict radius', () => {
    const result = evaluateGeofenceAccess({
      branchLatitude: 12.9716,
      branchLongitude: 77.5946,
      userLatitude: 12.9717,
      userLongitude: 77.5947,
      radiusKm: 0.5,
      mode: 'STRICT',
    });

    expect(result.allowed).toBe(true);
    expect(result.withinGeofence).toBe(true);
    expect(result.message).toContain('within');
  });

  it('blocks check-in in strict mode when user is outside the radius', () => {
    const result = evaluateGeofenceAccess({
      branchLatitude: 12.9716,
      branchLongitude: 77.5946,
      userLatitude: 13.0,
      userLongitude: 77.7,
      radiusKm: 0.5,
      mode: 'STRICT',
    });

    expect(result.allowed).toBe(false);
    expect(result.withinGeofence).toBe(false);
    expect(result.message).toContain('outside');
  });

  it('allows check-in in soft mode even when outside radius but flags it', () => {
    const result = evaluateGeofenceAccess({
      branchLatitude: 12.9716,
      branchLongitude: 77.5946,
      userLatitude: 13.0,
      userLongitude: 77.7,
      radiusKm: 0.5,
      mode: 'SOFT',
    });

    expect(result.allowed).toBe(true);
    expect(result.withinGeofence).toBe(false);
    expect(result.message).toContain('outside');
  });

  it('disables geofence validation when mode is disabled', () => {
    const result = evaluateGeofenceAccess({
      branchLatitude: 12.9716,
      branchLongitude: 77.5946,
      userLatitude: 13.0,
      userLongitude: 77.7,
      radiusKm: 0.5,
      mode: 'DISABLED',
    });

    expect(result.allowed).toBe(true);
    expect(result.withinGeofence).toBe(true);
    expect(result.message).toContain('disabled');
  });
});
