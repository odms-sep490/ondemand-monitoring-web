import type {
  Mission,
  Drone,
  CheckItem,
  ChecklistScenario,
} from '../types/omss'

/* ── Drones ─────────────────────────────────────────────────── */
export const DRONE_PRIMARY: Drone = {
  id: 'DRN-0047',
  name: 'Eagle-47',
  model: 'DJI Matrice 350 RTK',
  serialNumber: 'M350-RTK-1FD9A2',
  state: 'PREFLIGHT',
  battery: 87,
  gpsCount: 14,
  gpsHdop: 0.72,
  altitude: 0,
  groundSpeed: 0,
  verticalSpeed: 0,
  heading: 274,
  lat: 37.7983,
  lng: -122.378,
  storageMB: 28672,
  telemetryAge: 1.1,
  cameraOk: true,
  gimbalOk: true,
  rssi: 96,
  voltage: 25.2,
  currentAmps: 0,
  tempC: 22,
}

export const DRONE_BATTERY_LOW: Drone = {
  ...DRONE_PRIMARY,
  battery: 61,
  state: 'IDLE_CHARGING',
}

export const DRONE_HW_FAULT: Drone = {
  ...DRONE_PRIMARY,
  cameraOk: false,
  gimbalOk: false,
  state: 'MAINTENANCE',
}

export const DRONE_STALE_TEL: Drone = {
  ...DRONE_PRIMARY,
  telemetryAge: 8.4,
}

export const REPLACEMENT_DRONES: Drone[] = [
  {
    id: 'DRN-0051',
    name: 'Eagle-51',
    model: 'DJI Matrice 350 RTK',
    serialNumber: 'M350-RTK-2AB3C4',
    state: 'AVAILABLE',
    battery: 95,
    gpsCount: 13,
    gpsHdop: 0.68,
    altitude: 0,
    groundSpeed: 0,
    verticalSpeed: 0,
    heading: 0,
    lat: 37.8,
    lng: -122.381,
    storageMB: 32768,
    telemetryAge: 0.9,
    cameraOk: true,
    gimbalOk: true,
    rssi: 98,
    voltage: 25.6,
    currentAmps: 0,
    tempC: 21,
  },
  {
    id: 'DRN-0053',
    name: 'Eagle-53',
    model: 'DJI Matrice 300 RTK',
    serialNumber: 'M300-RTK-9XY7Z1',
    state: 'AVAILABLE',
    battery: 91,
    gpsCount: 11,
    gpsHdop: 0.81,
    altitude: 0,
    groundSpeed: 0,
    verticalSpeed: 0,
    heading: 0,
    lat: 37.797,
    lng: -122.374,
    storageMB: 16384,
    telemetryAge: 1.3,
    cameraOk: true,
    gimbalOk: true,
    rssi: 94,
    voltage: 24.9,
    currentAmps: 0,
    tempC: 23,
  },
  {
    id: 'DRN-0055',
    name: 'Eagle-55',
    model: 'Autel EVO Max 4T',
    serialNumber: 'EVO4T-003F2A7',
    state: 'AVAILABLE',
    battery: 78,
    gpsCount: 10,
    gpsHdop: 0.91,
    altitude: 0,
    groundSpeed: 0,
    verticalSpeed: 0,
    heading: 0,
    lat: 37.794,
    lng: -122.38,
    storageMB: 12288,
    telemetryAge: 2.1,
    cameraOk: true,
    gimbalOk: true,
    rssi: 89,
    voltage: 24.1,
    currentAmps: 0,
    tempC: 24,
  },
]

/* ── Missions ───────────────────────────────────────────────── */
export const MISSION_PRIMARY: Mission = {
  id: 'MSN-2024-0891',
  orderRef: 'ORD-78234',
  title: 'Infrastructure Survey — Bay Bridge East Span',
  state: 'WAITING_OPERATOR_ACCEPTANCE',
  priority: 'HIGH',
  droneId: 'DRN-0047',
  operatorId: 'OPR-112',
  customer: 'Caltrans Bridge Inspection Unit',
  location: 'Bay Bridge East Span, San Francisco, CA',
  lat: 37.7983,
  lng: -122.378,
  scheduledAt: '2024-03-15T09:30:00Z',
  estimatedMinutes: 45,
  distanceKm: 4.2,
  flightPlanId: 'FP-2024-0891-A',
  maxAltitudeM: 60,
  targetSimX: 214,
  targetSimY: -5,
  notes:
    'Detailed photogrammetric survey of East Span cable anchorage zones. Maintain ≥15 m clearance from structure at all times. Coordinate with Bay Bridge traffic control on Ch. 6 before launch. Scheduled weather window: 08:00–12:00 PST. Deliverables: 4K ortho mosaic + point cloud.',
}

export const ALL_MISSIONS: Mission[] = [
  MISSION_PRIMARY,
  {
    id: 'MSN-2024-0893',
    orderRef: 'ORD-78241',
    title: 'Thermal Scan — Solar Array Block C',
    state: 'SCHEDULED',
    priority: 'NORMAL',
    droneId: 'DRN-0051',
    operatorId: 'OPR-112',
    customer: 'SunPower Corp.',
    location: 'Tracy Solar Farm, Tracy, CA',
    lat: 37.7399,
    lng: -121.4252,
    scheduledAt: '2024-03-15T13:00:00Z',
    estimatedMinutes: 60,
    distanceKm: 8.7,
    flightPlanId: 'FP-2024-0893-B',
    maxAltitudeM: 40,
    notes: 'Full array thermal imaging. Flag cells > +5°C above panel mean.',
  },
  {
    id: 'MSN-2024-0887',
    orderRef: 'ORD-78198',
    title: 'Perimeter Security — Warehouse District',
    state: 'COMPLETED',
    priority: 'LOW',
    droneId: 'DRN-0047',
    operatorId: 'OPR-112',
    customer: 'SecureWatch Holdings',
    location: 'Oakland Port District, CA',
    lat: 37.8044,
    lng: -122.2712,
    scheduledAt: '2024-03-14T22:00:00Z',
    estimatedMinutes: 30,
    distanceKm: 3.1,
    flightPlanId: 'FP-2024-0887-A',
    maxAltitudeM: 35,
    notes: '',
  },
  {
    id: 'MSN-2024-0878',
    orderRef: 'ORD-78155',
    title: 'Construction Progress Survey — Block 4A',
    state: 'FAILED',
    priority: 'NORMAL',
    droneId: 'DRN-0053',
    operatorId: 'OPR-112',
    customer: 'Turner Construction Co.',
    location: 'Mission Bay, San Francisco, CA',
    lat: 37.768,
    lng: -122.394,
    scheduledAt: '2024-03-14T14:00:00Z',
    estimatedMinutes: 25,
    distanceKm: 2.8,
    flightPlanId: 'FP-2024-0878-A',
    maxAltitudeM: 50,
    notes: 'Hardware fault mid-flight.',
    rejectionReason:
      'Camera gimbal hardware fault — drone sent to maintenance.',
  },
]

/* ── Checklists ─────────────────────────────────────────────── */
const BASE_PASS: CheckItem[] = [
  {
    id: 'battery',
    label: 'Battery',
    icon: 'battery',
    value: '87%',
    requirement: '≥ 80%',
    status: 'PASS',
    explanation:
      'Battery charged to 87%. Minimum threshold met with 7% margin. Estimated flight endurance: 38 min at nominal load.',
  },
  {
    id: 'gps',
    label: 'GPS Signal',
    icon: 'gps',
    value: '14 satellites',
    requirement: '≥ 8 satellites',
    status: 'PASS',
    explanation:
      'GPS lock acquired: 14 satellites. HDOP 0.72 — excellent positioning accuracy. RTK correction active.',
  },
  {
    id: 'camera',
    label: 'Camera & Gimbal',
    icon: 'camera',
    value: 'Operational',
    requirement: 'Camera and gimbal operational',
    status: 'PASS',
    explanation:
      'Primary 4K camera online. Gimbal 3-axis calibrated and tracking. Lens clear. No sensor faults detected.',
  },
  {
    id: 'storage',
    label: 'Storage',
    icon: 'storage',
    value: '28.0 GB available',
    requirement: '≥ 100 MB',
    status: 'PASS',
    explanation:
      'Available storage: 28.0 GB. Estimated mission usage: ~4.2 GB (4K video + photos). Ample headroom.',
  },
  {
    id: 'telemetry',
    label: 'Telemetry Link',
    icon: 'signal',
    value: '1.1 s ago',
    requirement: 'Link active · freshness ≤ 5 s',
    status: 'PASS',
    explanation:
      'Drone connected to GCS via encrypted MAVLink v2.3 link. Telemetry stream current at 10 Hz.',
  },
  {
    id: 'weather',
    label: 'Weather',
    icon: 'weather',
    value: 'Wind 8 kt · Vis 10+ mi',
    requirement: 'Conditions suitable for flight',
    status: 'PASS',
    explanation:
      'Clear skies. Wind NW 8 kt steady — well within limits. Visibility unrestricted. No precipitation or NOTAM conflicts.',
  },
]

export const CHECKLIST: Record<ChecklistScenario, CheckItem[]> = {
  'all-pass': BASE_PASS,

  'battery-fail': BASE_PASS.map((i) =>
    i.id !== 'battery'
      ? i
      : {
          ...i,
          value: '61%',
          status: 'FAIL',
          explanation:
            'Battery at 61% — below the 80% minimum required for safe mission execution at this range. Insufficient endurance margin.',
          action:
            'Place drone on charger (est. 28 min to 80%). Alternatively, assign a replacement drone with sufficient charge.',
        },
  ),

  'hardware-fail': BASE_PASS.map((i) =>
    i.id !== 'camera'
      ? i
      : {
          ...i,
          value: 'CAMERA FAULT — GIMBAL ERROR',
          status: 'FAIL',
          explanation:
            'Camera initialization failed with sensor error code 0x4A. Gimbal calibration aborted — axis 2 encoder fault detected. Hardware inspection required.',
          action:
            'Remove drone from service immediately. Assign to MAINTENANCE status. Select a replacement drone to continue this mission.',
        },
  ),

  'telemetry-stale': BASE_PASS.map((i) =>
    i.id !== 'telemetry'
      ? i
      : {
          ...i,
          value: '8.4 s ago',
          status: 'FAIL',
          explanation:
            'Telemetry stream is stale. Last update was 8.4 seconds ago — exceeds the 5-second freshness threshold. This is a link quality issue, not a hardware fault.',
          action:
            'Check RF interference and GCS antenna orientation. Attempt GCS reconnection. Do not confuse with hardware failure — drone may be physically intact.',
        },
  ),

  'weather-warn': BASE_PASS.map((i) =>
    i.id !== 'weather'
      ? i
      : {
          ...i,
          value: 'Wind 19 kt gusting 27',
          status: 'WARNING',
          explanation:
            'Wind gusts at 27 kt are approaching the operational limit of 30 kt for this airframe. Flight is permitted but marginal. Conditions deteriorating.',
          action:
            'Monitor wind continuously. Reduce altitude if gusts exceed 25 kt. Abort if sustained wind exceeds 28 kt or gusts reach 30 kt. Reassess at T-10 min.',
        },
  ),
}
