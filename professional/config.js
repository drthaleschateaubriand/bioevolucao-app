import { PLATFORM_CONFIG, firebaseConfigured } from "../shared/platform-config.js";

export const CONFIG = {
  mode: firebaseConfigured() ? "firebase" : "preview",
  appName: "Avaliação Antropométrica",
  clinician: {
    name: "Thales Chateaubriand",
    crm: "CRM 25254"
  },
  clinic: {
    name: "Clínica",
    logoUrl: ""
  },
  firebase: PLATFORM_CONFIG.firebase,
  platform: {
    organizationId: PLATFORM_CONFIG.organizationId,
    ownerPortalPath: "../owner/"
  },
  cliniv: {
    enabled: false,
    embedAllowed: true,
    patientContextParam: "cliniv_patient_id"
  }
};
