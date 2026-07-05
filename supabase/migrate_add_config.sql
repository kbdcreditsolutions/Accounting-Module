-- One-shot migration: inject industry config into existing company_state rows.
-- Run once in the Supabase SQL Editor. Each statement should return UPDATE 1.

-- Sridatri → Healthcare (Patient/Patients, no HSN/Discount columns)
UPDATE company_state
SET data = jsonb_set(data, '{company,config}',
  '{"industry":"healthcare",
    "labels":{"client":"Patient","clients":"Patients"},
    "features":{"expenses":true,"reports":true},
    "invoiceTemplate":{"showHsn":false,"showDiscount":false},
    "customFields":{
      "client":[
        {"key":"dateOfBirth","label":"Date of Birth","type":"date"},
        {"key":"referredBy","label":"Referred By","type":"text"}
      ],
      "invoice":[
        {"key":"doctorName","label":"Doctor / Therapist","type":"text"},
        {"key":"prescriptionRef","label":"Prescription Ref.","type":"text"}
      ]
    }}'::jsonb, true)
WHERE company_id = (SELECT id FROM companies WHERE name ILIKE '%sridatri%' LIMIT 1);

-- Silaa → Apparel & Fashion (Customer/Customers)
UPDATE company_state
SET data = jsonb_set(data, '{company,config}',
  '{"industry":"apparel-fashion",
    "labels":{"client":"Customer","clients":"Customers"},
    "features":{"expenses":true,"reports":true},
    "invoiceTemplate":{"showHsn":true,"showDiscount":true},
    "customFields":{"client":[],"invoice":[]}}'::jsonb, true)
WHERE company_id = (SELECT id FROM companies WHERE name ILIKE '%silaa%' LIMIT 1);

-- KBD → Credit & Financial Services (Client/Clients, no Discount column)
UPDATE company_state
SET data = jsonb_set(data, '{company,config}',
  '{"industry":"credit-finance",
    "labels":{"client":"Client","clients":"Clients"},
    "features":{"expenses":true,"reports":true},
    "invoiceTemplate":{"showHsn":true,"showDiscount":false},
    "customFields":{"client":[],"invoice":[]}}'::jsonb, true)
WHERE company_id = (SELECT id FROM companies WHERE name ILIKE '%kbd%' LIMIT 1);
