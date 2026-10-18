import { PreviewStore } from "./store.js";
import { FirebaseClient } from "../../shared/firebase-client.js";
import { firebaseConfigured } from "../../shared/platform-config.js";

export class AppDataStore {
  constructor() {
    this.demo = !firebaseConfigured();
    this.preview = this.demo ? new PreviewStore() : null;
    this.data = this.demo ? this.preview.data : { patients: [] };
  }

  async load() {
    if (this.demo) return this.data;
    this.data.patients = await FirebaseClient.listPatients();
    return this.data;
  }

  searchPatients(query = "") {
    const q = query.trim().toLowerCase();
    return this.data.patients.filter(p =>
      !q || String(p.fullName || "").toLowerCase().includes(q)
    );
  }

  getPatient(id) {
    return this.data.patients.find(p => p.id === id) || null;
  }

  async createPatient(payload) {
    if (this.demo) return this.preview.createPatient(payload);
    const patient = await FirebaseClient.createPatient(payload);
    this.data.patients.push(patient);
    return patient;
  }

  async updatePatient(id, payload) {
    if (this.demo) return this.preview.updatePatient(id, payload);
    await FirebaseClient.updatePatient(id, payload);
    const patient = this.getPatient(id);
    if (patient) Object.assign(patient, payload);
    return patient;
  }

  async saveAssessment(patientId, assessment) {
    if (this.demo) return this.preview.saveAssessment(patientId, assessment);
    const patient = this.getPatient(patientId);
    if (!patient) throw new Error("Paciente não encontrado.");

    const current = (patient.assessments || []).find(a =>
      a.id === assessment.id || a.date === assessment.date
    );
    const saved = await FirebaseClient.saveAssessment(patientId, {
      ...assessment,
      id: current?.id || assessment.id
    });

    if (!patient.assessments) patient.assessments = [];
    if (current) Object.assign(current, saved);
    else patient.assessments.push(saved);

    patient.assessments.sort((a, b) =>
      String(a.date || "").localeCompare(String(b.date || ""))
    );
    return patient;
  }
}
