const KEY = "avaliacao-antropometrica-preview-v1";

const demo = {
  user: { id: "u1", name: "Thales Chateaubriand", role: "admin" },
  patients: [
    {
      id: "p1",
      fullName: "Paciente Exemplo",
      birthDate: "1986-04-15",
      sex: "male",
      email: "paciente@example.com",
      phone: "(81) 99999-0000",
      heightCm: 179,
      assessments: [
        {
          id: "a1",
          date: "2026-09-11",
          bio: { weight: 90.9, bmi: 28.4, fatPct: 13.0, fatMass: 11.8, muscleMass: 45.2, leanMass: 79.1, visceral: 5, bmr: 2079 },
          skinfold: { fatPct: 12.2, density: 1.071, sum: 80, folds: { chest:8, axillary:10, triceps:9, subscapular:12, abdomen:16, suprailiac:11, thigh:14 } },
          anthropometry: { waist: 94, hip: 102, calf: 40 }
        },
        {
          id: "a2",
          date: "2026-10-16",
          bio: { weight: 88.5, bmi: 27.6, fatPct: 15.2, fatMass: 13.5, muscleMass: 42.9, leanMass: 75.0, visceral: 5, bmr: 1990 },
          skinfold: { fatPct: 13.6, density: 1.068, sum: 89, folds: { chest:8, axillary:11, triceps:10, subscapular:14, abdomen:18, suprailiac:13, thigh:15 } },
          anthropometry: { waist: 91, hip: 101, calf: 39 }
        }
      ]
    }
  ]
};

function clone(v){ return JSON.parse(JSON.stringify(v)); }

export class PreviewStore {
  constructor() {
    const saved = localStorage.getItem(KEY);
    this.data = saved ? JSON.parse(saved) : clone(demo);
  }
  persist(){ localStorage.setItem(KEY, JSON.stringify(this.data)); }
  reset(){ this.data = clone(demo); this.persist(); }
  searchPatients(query=""){
    const q = query.trim().toLowerCase();
    return this.data.patients.filter(p => !q || p.fullName.toLowerCase().includes(q));
  }
  getPatient(id){ return this.data.patients.find(p=>p.id===id) || null; }
  createPatient(payload){
    const patient = { id:"p"+Date.now(), ...payload, assessments:[] };
    this.data.patients.push(patient); this.persist(); return patient;
  }
  updatePatient(id,payload){
    const p=this.getPatient(id); if(!p) return null;
    Object.assign(p,payload); this.persist(); return p;
  }
  saveAssessment(patientId, assessment){
    const p=this.getPatient(patientId); if(!p) throw new Error("Paciente não encontrado");
    const existing=p.assessments.find(a=>a.date===assessment.date);
    if(existing) Object.assign(existing, assessment, { id: existing.id });
    else p.assessments.push({ id:"a"+Date.now(), ...assessment });
    p.assessments.sort((a,b)=>a.date.localeCompare(b.date));
    this.persist();
    return p;
  }
}
