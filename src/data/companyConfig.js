// Per-company configuration: industry presets + getConfig() helper.
// Each company's state.company.config overrides the preset defaults.
// Only display-layer — data model keys (state.clients, clientId, etc.) are unchanged.

export const DEFAULT_CONFIG = {
  industry: 'general',
  labels: { client: 'Client', clients: 'Clients' },
  features: { expenses: true, reports: true },
  invoiceTemplate: { showHsn: true, showDiscount: true },
  customFields: { client: [], invoice: [] },
}

export const INDUSTRY_PRESETS = {
  'general': {
    label: 'General Business (Default)',
    config: {
      labels: { client: 'Client', clients: 'Clients' },
      features: { expenses: true, reports: true },
      invoiceTemplate: { showHsn: true, showDiscount: true },
      customFields: { client: [], invoice: [] },
    },
  },
  'credit-finance': {
    label: 'Credit & Financial Services',
    config: {
      labels: { client: 'Client', clients: 'Clients' },
      features: { expenses: true, reports: true },
      invoiceTemplate: { showHsn: true, showDiscount: false },
      customFields: { client: [], invoice: [] },
    },
  },
  'healthcare': {
    label: 'Healthcare / Clinic / Physiotherapy',
    config: {
      labels: { client: 'Patient', clients: 'Patients' },
      features: { expenses: true, reports: true },
      invoiceTemplate: { showHsn: false, showDiscount: false },
      customFields: {
        client: [
          { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
          { key: 'referredBy', label: 'Referred By', type: 'text' },
        ],
        invoice: [
          { key: 'doctorName', label: 'Doctor / Therapist', type: 'text' },
          { key: 'prescriptionRef', label: 'Prescription Ref.', type: 'text' },
        ],
      },
    },
  },
  'apparel-fashion': {
    label: 'Apparel & Fashion / Textiles',
    config: {
      labels: { client: 'Customer', clients: 'Customers' },
      features: { expenses: true, reports: true },
      invoiceTemplate: { showHsn: true, showDiscount: true },
      customFields: { client: [], invoice: [] },
    },
  },
  'legal': {
    label: 'Legal Services / Advocates',
    config: {
      labels: { client: 'Client', clients: 'Clients' },
      features: { expenses: true, reports: true },
      invoiceTemplate: { showHsn: false, showDiscount: false },
      customFields: {
        client: [
          { key: 'courtJurisdiction', label: 'Court / Jurisdiction', type: 'text' },
        ],
        invoice: [
          { key: 'matterNo', label: 'Matter / Case No.', type: 'text' },
          { key: 'hearingDate', label: 'Hearing Date', type: 'date' },
        ],
      },
    },
  },
  'architecture-design': {
    label: 'Architecture / Interior Design',
    config: {
      labels: { client: 'Client', clients: 'Clients' },
      features: { expenses: true, reports: true },
      invoiceTemplate: { showHsn: false, showDiscount: true },
      customFields: {
        client: [],
        invoice: [
          { key: 'projectName', label: 'Project Name', type: 'text' },
          { key: 'siteAddress', label: 'Site Address', type: 'text' },
          { key: 'projectPhase', label: 'Project Phase / Milestone', type: 'text' },
        ],
      },
    },
  },
  'it-software': {
    label: 'IT / Software / Consulting',
    config: {
      labels: { client: 'Client', clients: 'Clients' },
      features: { expenses: true, reports: true },
      invoiceTemplate: { showHsn: true, showDiscount: true },
      customFields: {
        client: [],
        invoice: [
          { key: 'projectCode', label: 'Project / PO Code', type: 'text' },
          { key: 'servicePeriod', label: 'Service Period', type: 'text' },
        ],
      },
    },
  },
  'construction': {
    label: 'Construction / Contracting / Real Estate',
    config: {
      labels: { client: 'Client', clients: 'Clients' },
      features: { expenses: true, reports: true },
      invoiceTemplate: { showHsn: true, showDiscount: true },
      customFields: {
        client: [],
        invoice: [
          { key: 'workOrderNo', label: 'Work Order No.', type: 'text' },
          { key: 'siteAddress', label: 'Site / Property Address', type: 'text' },
          { key: 'workStage', label: 'Work Stage / Phase', type: 'text' },
        ],
      },
    },
  },
  'education': {
    label: 'Education / Coaching / Training',
    config: {
      labels: { client: 'Student', clients: 'Students' },
      features: { expenses: true, reports: true },
      invoiceTemplate: { showHsn: true, showDiscount: true },
      customFields: {
        client: [
          { key: 'enrollmentNo', label: 'Enrollment No.', type: 'text' },
          { key: 'batch', label: 'Batch / Class', type: 'text' },
        ],
        invoice: [
          { key: 'academicYear', label: 'Academic Year', type: 'text' },
          { key: 'feeType', label: 'Fee Type', type: 'text' },
        ],
      },
    },
  },
  'logistics-transport': {
    label: 'Logistics / Transport / Freight',
    config: {
      labels: { client: 'Client', clients: 'Clients' },
      features: { expenses: true, reports: true },
      invoiceTemplate: { showHsn: true, showDiscount: false },
      customFields: {
        client: [],
        invoice: [
          { key: 'lrNo', label: 'LR / Consignment No.', type: 'text' },
          { key: 'vehicleNo', label: 'Vehicle No.', type: 'text' },
          { key: 'fromCity', label: 'From (Origin)', type: 'text' },
          { key: 'toCity', label: 'To (Destination)', type: 'text' },
          { key: 'ewayBill', label: 'E-way Bill No.', type: 'text' },
        ],
      },
    },
  },
  'hospitality': {
    label: 'Hotel / Hospitality / Resort',
    config: {
      labels: { client: 'Guest', clients: 'Guests' },
      features: { expenses: true, reports: true },
      invoiceTemplate: { showHsn: true, showDiscount: true },
      customFields: {
        client: [],
        invoice: [
          { key: 'checkIn', label: 'Check-in Date', type: 'date' },
          { key: 'checkOut', label: 'Check-out Date', type: 'date' },
          { key: 'roomNo', label: 'Room No.', type: 'text' },
          { key: 'guests', label: 'No. of Guests', type: 'text' },
        ],
      },
    },
  },
  'auto-service': {
    label: 'Automobile / Auto Service / Workshop',
    config: {
      labels: { client: 'Customer', clients: 'Customers' },
      features: { expenses: true, reports: true },
      invoiceTemplate: { showHsn: true, showDiscount: true },
      customFields: {
        client: [],
        invoice: [
          { key: 'vehicleRegNo', label: 'Vehicle Reg. No.', type: 'text' },
          { key: 'makeModel', label: 'Make & Model', type: 'text' },
          { key: 'odometer', label: 'Odometer (km)', type: 'text' },
          { key: 'jobCardNo', label: 'Job Card No.', type: 'text' },
        ],
      },
    },
  },
  'events': {
    label: 'Events / Wedding Planning / Entertainment',
    config: {
      labels: { client: 'Client', clients: 'Clients' },
      features: { expenses: true, reports: true },
      invoiceTemplate: { showHsn: false, showDiscount: true },
      customFields: {
        client: [],
        invoice: [
          { key: 'eventDate', label: 'Event Date', type: 'date' },
          { key: 'venue', label: 'Venue', type: 'text' },
          { key: 'eventType', label: 'Event Type', type: 'text' },
        ],
      },
    },
  },
  'photography': {
    label: 'Photography / Videography / Creative',
    config: {
      labels: { client: 'Client', clients: 'Clients' },
      features: { expenses: true, reports: true },
      invoiceTemplate: { showHsn: false, showDiscount: true },
      customFields: {
        client: [],
        invoice: [
          { key: 'shootDate', label: 'Shoot / Event Date', type: 'date' },
          { key: 'location', label: 'Location / Venue', type: 'text' },
          { key: 'packageName', label: 'Package Name', type: 'text' },
        ],
      },
    },
  },
  'ca-accounting': {
    label: 'CA / Tax Consultant / Accounting Firm',
    config: {
      labels: { client: 'Client', clients: 'Clients' },
      features: { expenses: true, reports: true },
      invoiceTemplate: { showHsn: true, showDiscount: false },
      customFields: {
        client: [
          { key: 'clientPan', label: 'Client PAN', type: 'text' },
          { key: 'assessmentYear', label: 'Assessment Year', type: 'text' },
        ],
        invoice: [
          { key: 'filingType', label: 'Filing / Service Type', type: 'text' },
        ],
      },
    },
  },
}

// Merges preset defaults with per-company overrides stored in company.config.
// Falls back to 'general' preset when no industry is set.
export function getConfig(company) {
  const industry = company?.config?.industry || 'general'
  const preset = (INDUSTRY_PRESETS[industry] || INDUSTRY_PRESETS.general).config
  const override = company?.config || {}
  return {
    industry,
    labels: { ...preset.labels, ...override.labels },
    features: { ...preset.features, ...override.features },
    invoiceTemplate: { ...preset.invoiceTemplate, ...override.invoiceTemplate },
    customFields: override.customFields || preset.customFields,
  }
}
