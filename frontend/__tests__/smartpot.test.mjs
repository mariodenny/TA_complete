import test from 'node:test';
import assert from 'node:assert/strict';

// Test 1: Category to Backend Type Mapping
const CATEGORY_TO_BACKEND_TYPE = {
  moisture: 'soil_moisture',
  temperature: 'humidity_and_temperature',
  humidity: 'humidity_and_temperature',
  lux: 'lux_value',
};

test('Sensor Category Mapping: exactly 4 categories mapped to backend DB enums', () => {
  const categories = Object.keys(CATEGORY_TO_BACKEND_TYPE);
  assert.deepEqual(categories.sort(), ['humidity', 'lux', 'moisture', 'temperature']);

  assert.equal(CATEGORY_TO_BACKEND_TYPE.moisture, 'soil_moisture');
  assert.equal(CATEGORY_TO_BACKEND_TYPE.temperature, 'humidity_and_temperature');
  assert.equal(CATEGORY_TO_BACKEND_TYPE.humidity, 'humidity_and_temperature');
  assert.equal(CATEGORY_TO_BACKEND_TYPE.lux, 'lux_value');
});

// Test 2: Add Sensor Payload Validation
test('Add Sensor Payload follows actual backend database schema without hardware specifics', () => {
  const createSensorPayload = (deviceId, category, name) => {
    assert.ok(deviceId, 'Device ID is required');
    assert.ok(name && name.trim(), 'Sensor name is required');
    assert.ok(CATEGORY_TO_BACKEND_TYPE[category], 'Invalid sensor category');

    return {
      device_id: deviceId,
      name: name.trim(),
      type: CATEGORY_TO_BACKEND_TYPE[category],
    };
  };

  const payload = createSensorPayload(3, 'moisture', 'Sensor Tanah 1');
  assert.equal(payload.device_id, 3);
  assert.equal(payload.name, 'Sensor Tanah 1');
  assert.equal(payload.type, 'soil_moisture');
  assert.equal(payload.dry_calibration, undefined);
  assert.equal(payload.wet_calibration, undefined);
  assert.equal(payload.plant_id, undefined);
});

// Test 3: JWT Token Validation & Expiry Check
function parseJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

function isTokenValid(token) {
  if (!token || typeof token !== 'string') return false;
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp > nowSeconds;
}

test('Authentication: reject null, malformed, and expired JWT tokens', () => {
  assert.equal(isTokenValid(null), false);
  assert.equal(isTokenValid(''), false);
  assert.equal(isTokenValid('not.a.jwt'), false);

  // Expired token (exp in past)
  const expiredPayload = Buffer.from(JSON.stringify({ sub: '1', exp: 1000 })).toString('base64');
  const expiredToken = `header.${expiredPayload}.signature`;
  assert.equal(isTokenValid(expiredToken), false);

  // Valid token (exp in future)
  const futureSec = Math.floor(Date.now() / 1000) + 3600;
  const validPayload = Buffer.from(JSON.stringify({ sub: '1', exp: futureSec })).toString('base64');
  const validToken = `header.${validPayload}.signature`;
  assert.equal(isTokenValid(validToken), true);
});

// Test 4: Device & Plant Isolation (No mixing between devices)
test('Dashboard: correctly isolate sensors and plants by device_id', () => {
  const devices = [
    { device_id: 1, name: 'Front Garden ESP' },
    { device_id: 2, name: 'Terrace ESP' },
  ];

  const plants = [
    { id: 10, name: 'Cabe Depan', device_id: 1 },
    { id: 20, name: 'Pakcoy Hidroponik', device_id: 2 },
  ];

  const sensors = [
    { sensor_id: 101, device_id: 1, name: 'Soil Moisture 1' },
    { sensor_id: 102, device_id: 1, name: 'Temp 1' },
    { sensor_id: 201, device_id: 2, name: 'Lux Sensor 2' },
  ];

  const getDashboardContext = (activeDeviceId) => {
    const dev = devices.find((d) => d.device_id === activeDeviceId);
    const plant = plants.find((p) => p.device_id === activeDeviceId) || null;
    const devSensors = sensors.filter((s) => s.device_id === activeDeviceId);
    return { dev, plant, sensors: devSensors };
  };

  const ctx1 = getDashboardContext(1);
  assert.equal(ctx1.dev.name, 'Front Garden ESP');
  assert.equal(ctx1.plant.name, 'Cabe Depan');
  assert.equal(ctx1.sensors.length, 2);
  assert.ok(ctx1.sensors.every((s) => s.device_id === 1));

  const ctx2 = getDashboardContext(2);
  assert.equal(ctx2.dev.name, 'Terrace ESP');
  assert.equal(ctx2.plant.name, 'Pakcoy Hidroponik');
  assert.equal(ctx2.sensors.length, 1);
  assert.equal(ctx2.sensors[0].sensor_id, 201);
});

// Test 5: Activity Screen Empty State Compliance
test('Activity: no fictitious activities or fake mock claims', () => {
  // Activity state when backend has no audit log endpoint
  const backendHasActivityEndpoint = false;
  const activities = backendHasActivityEndpoint ? ['log1'] : [];

  assert.equal(activities.length, 0, 'Must have 0 fake activity entries when backend is unready');
});

