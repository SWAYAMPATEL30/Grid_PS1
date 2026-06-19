import { 
  Violation, 
  HeatmapPoint, 
  PatternAnalysis, 
  ForecastData, 
  Zone, 
  Appeal, 
  Officer, 
  ComplianceEntity, 
  RevenueData,
  ViolationType,
  ViolationSeverity,
  ViolationStatus
} from './types';

const VIOLATION_TYPES: ViolationType[] = [
  'expired_meter',
  'no_parking',
  'handicap_violation',
  'fire_zone',
  'double_parking',
  'street_cleaning',
  'overtime_parking'
];

const ZONES = ['Financial District', 'Mission District', 'SOMA', 'Marina', 'Richmond', 'Sunset', 'Tenderloin'];

const VEHICLES = ['sedan', 'suv', 'truck', 'van', 'hatchback', 'coupe'];

const SF_BOUNDS = {
  minLat: 37.7,
  maxLat: 37.8,
  minLng: -122.5,
  maxLng: -122.4
};

function randomLat() {
  return SF_BOUNDS.minLat + Math.random() * (SF_BOUNDS.maxLat - SF_BOUNDS.minLat);
}

function randomLng() {
  return SF_BOUNDS.minLng + Math.random() * (SF_BOUNDS.maxLng - SF_BOUNDS.minLng);
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateLicensePlate(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let plate = '';
  for (let i = 0; i < 7; i++) {
    plate += chars[Math.floor(Math.random() * chars.length)];
  }
  return plate;
}

function getSeverity(violationType: ViolationType): ViolationSeverity {
  const severityMap: Record<ViolationType, ViolationSeverity> = {
    expired_meter: 'low',
    no_parking: 'high',
    handicap_violation: 'critical',
    fire_zone: 'high',
    double_parking: 'medium',
    street_cleaning: 'low',
    overtime_parking: 'medium'
  };
  return severityMap[violationType];
}

function getFineAmount(violationType: ViolationType): number {
  const fineMap: Record<ViolationType, number> = {
    expired_meter: 65,
    no_parking: 110,
    handicap_violation: 250,
    fire_zone: 200,
    double_parking: 85,
    street_cleaning: 75,
    overtime_parking: 95
  };
  return fineMap[violationType];
}

export function generateViolations(count: number): Violation[] {
  const violations: Violation[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const violationType = randomChoice(VIOLATION_TYPES);
    const timestamp = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days

    violations.push({
      id: `v-${Date.now()}-${i}`,
      licensePlate: generateLicensePlate(),
      vehicleType: randomChoice(VEHICLES),
      location: {
        lat: randomLat(),
        lng: randomLng(),
        address: `${randomInt(1, 9999)} Main Street`,
        zone: randomChoice(ZONES)
      },
      violationType,
      severity: getSeverity(violationType),
      status: randomChoice(['reported', 'under_review', 'ticketed', 'resolved'] as ViolationStatus[]),
      timestamp,
      fine: getFineAmount(violationType),
      officer: randomChoice(['Officer Smith', 'Officer Johnson', 'Officer Williams', 'Officer Brown']),
      notes: `Violation detected at ${randomChoice(['parking meter', 'fire zone', 'handicap spot', 'street cleaning zone'])}`
    });
  }

  return violations;
}

export function generateHeatmapData(count: number = 200): HeatmapPoint[] {
  const points: HeatmapPoint[] = [];

  for (let i = 0; i < count; i++) {
    points.push({
      lat: randomLat(),
      lng: randomLng(),
      intensity: Math.random() * 0.8 + 0.2 // 0.2 - 1.0
    });
  }

  return points;
}

export function generateForecastData(days: number = 30): ForecastData[] {
  const data: ForecastData[] = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const baseValue = 45 + Math.random() * 20;
    const trend = i % 7 === 0 ? -5 : 0; // Lower on Sundays

    data.push({
      date,
      predicted: Math.round(baseValue + trend + (Math.random() - 0.5) * 10),
      confidence: 0.7 + Math.random() * 0.25,
      actual: i < 5 ? Math.round(baseValue + (Math.random() - 0.5) * 8) : undefined
    });
  }

  return data;
}

export function generatePatterns(count: number = 50): PatternAnalysis[] {
  const patterns: PatternAnalysis[] = [];

  for (let i = 0; i < count; i++) {
    patterns.push({
      licensePlate: generateLicensePlate(),
      violationCount: randomInt(1, 25),
      lastViolation: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      riskScore: Math.random(),
      preferredZones: [randomChoice(ZONES), randomChoice(ZONES)],
      violationType: randomChoice(VIOLATION_TYPES)
    });
  }

  return patterns.sort((a, b) => b.violationCount - a.violationCount);
}

export function generateZones(): Zone[] {
  return [
    {
      id: 'z-1',
      name: 'Financial District',
      coordinates: [[37.7949, -122.4010], [37.7975, -122.3950], [37.7900, -122.3950], [37.7900, -122.4010]],
      enforcementHours: { start: 6, end: 22 },
      rules: ['No parking 8-10am', 'Street cleaning Wed 8-10am'],
      violationCount: 245,
      complianceRate: 68
    },
    {
      id: 'z-2',
      name: 'SOMA',
      coordinates: [[37.7749, -122.3950], [37.7800, -122.3800], [37.7700, -122.3800], [37.7700, -122.3950]],
      enforcementHours: { start: 8, end: 20 },
      rules: ['Parking rate 2.50/hr', 'Max 4 hours'],
      violationCount: 189,
      complianceRate: 72
    },
    {
      id: 'z-3',
      name: 'Mission District',
      coordinates: [[37.7599, -122.4100], [37.7650, -122.3950], [37.7550, -122.3950], [37.7550, -122.4100]],
      enforcementHours: { start: 6, end: 23 },
      rules: ['Street cleaning Thu 8-10am'],
      violationCount: 312,
      complianceRate: 65
    },
    {
      id: 'z-4',
      name: 'Marina District',
      coordinates: [[37.8049, -122.4300], [37.8100, -122.4100], [37.8000, -122.4100], [37.8000, -122.4300]],
      enforcementHours: { start: 7, end: 19 },
      rules: ['Residential permit required'],
      violationCount: 87,
      complianceRate: 85
    }
  ];
}

export function generateAppeals(count: number = 30): Appeal[] {
  const appeals: Appeal[] = [];

  for (let i = 0; i < count; i++) {
    const status = randomChoice(['submitted', 'under_review', 'approved', 'denied'] as const);
    const submittedDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);

    appeals.push({
      id: `a-${Date.now()}-${i}`,
      violationId: `v-${i}`,
      licensePlate: generateLicensePlate(),
      status,
      reason: randomChoice([
        'Parking sign was obscured',
        'Payment made before ticket',
        'Incorrect violation type',
        'Meter malfunction',
        'Administrative error'
      ]),
      submittedDate,
      reviewedDate: status !== 'submitted' ? new Date(submittedDate.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000) : undefined,
      notes: status !== 'submitted' ? 'Reviewed by admin' : undefined
    });
  }

  return appeals;
}

export function generateOfficers(count: number = 12): Officer[] {
  const officers: Officer[] = [];

  for (let i = 0; i < count; i++) {
    officers.push({
      id: `o-${i}`,
      name: `Officer ${randomChoice(['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'])}`,
      zone: randomChoice(ZONES),
      ticketsIssued: randomInt(50, 300),
      averageTicketValue: randomInt(70, 150),
      status: randomChoice(['active', 'break', 'off_duty'] as const),
      currentLocation: { lat: randomLat(), lng: randomLng() }
    });
  }

  return officers;
}

export function generateComplianceEntities(count: number = 50): ComplianceEntity[] {
  const entities: ComplianceEntity[] = [];

  for (let i = 0; i < count; i++) {
    entities.push({
      id: `c-${i}`,
      type: randomChoice(['vehicle', 'driver', 'dashboard'] as const),
      name: randomChoice(['vehicle', 'driver'] === 'vehicle' ? generateLicensePlate() : `Driver ${randomInt(1, 1000)}`),
      violationCount: randomInt(0, 20),
      complianceScore: randomInt(50, 100),
      lastViolation: randomInt(0, 2) === 0 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined,
      tags: randomChoice(['regular', 'risky', 'compliant'])
    });
  }

  return entities;
}

export function generateRevenueData(days: number = 30): RevenueData[] {
  const data: RevenueData[] = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const violationsPerDay = randomInt(30, 100);

    for (let j = 0; j < randomInt(2, 4); j++) {
      const violationType = randomChoice(VIOLATION_TYPES);
      const count = randomInt(5, 20);

      data.push({
        date,
        violationType,
        count,
        totalRevenue: count * getFineAmount(violationType)
      });
    }
  }

  return data.sort((a, b) => b.date.getTime() - a.date.getTime());
}

// Zone-specific violation counts
export function generateViolationsByZone(): Record<string, number> {
  const counts: Record<string, number> = {};
  ZONES.forEach(zone => {
    counts[zone] = randomInt(50, 300);
  });
  return counts;
}
