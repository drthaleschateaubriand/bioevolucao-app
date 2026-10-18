import { PLATFORM_CONFIG, firebaseConfigured } from "./platform-config.js";

let sdkPromise = null;
let ctxPromise = null;

function stripUndefined(value) {
  if (Array.isArray(value)) {
    return value.map(stripUndefined).filter(v => v !== undefined);
  }
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (val === undefined) continue;
      const clean = stripUndefined(val);
      if (clean !== undefined) out[key] = clean;
    }
    return out;
  }
  return value;
}

async function loadSdk() {
  if (!sdkPromise) {
    sdkPromise = Promise.all([
      import("https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js")
    ]).then(([appSdk, authSdk, firestoreSdk]) => ({ appSdk, authSdk, firestoreSdk }));
  }
  return sdkPromise;
}

async function context() {
  if (!firebaseConfigured()) return null;
  if (!ctxPromise) {
    ctxPromise = (async () => {
      const sdk = await loadSdk();
      const app = sdk.appSdk.getApps().length
        ? sdk.appSdk.getApp()
        : sdk.appSdk.initializeApp(PLATFORM_CONFIG.firebase);
      return {
        ...sdk,
        app,
        auth: sdk.authSdk.getAuth(app),
        db: sdk.firestoreSdk.getFirestore(app)
      };
    })();
  }
  return ctxPromise;
}

export const FirebaseClient = {
  configured: firebaseConfigured,

  async onAuthChanged(callback) {
    const c = await context();
    if (!c) {
      callback(null);
      return () => {};
    }
    return c.authSdk.onAuthStateChanged(c.auth, callback);
  },

  async signIn(email, password) {
    const c = await context();
    if (!c) throw new Error("Firebase ainda não configurado.");
    return c.authSdk.signInWithEmailAndPassword(c.auth, email, password);
  },

  async signUp(email, password, displayName = "") {
    const c = await context();
    if (!c) throw new Error("Firebase ainda não configurado.");
    const credential = await c.authSdk.createUserWithEmailAndPassword(c.auth, email, password);
    if (displayName) await c.authSdk.updateProfile(credential.user, { displayName });
    return credential;
  },

  async sendVerification() {
    const c = await context();
    const user = c && c.auth.currentUser;
    if (!c || !user) throw new Error("Usuário não autenticado.");
    await c.authSdk.sendEmailVerification(user);
  },

  async refreshUser() {
    const c = await context();
    const user = c && c.auth.currentUser;
    if (!c || !user) return null;
    await c.authSdk.reload(user);
    await c.authSdk.getIdToken(user, true);
    return c.auth.currentUser;
  },

  async bootstrapOwner(token) {
    const c = await context();
    const user = c && c.auth.currentUser;
    if (!c || !user) throw new Error("Faça login primeiro.");
    await c.authSdk.reload(user);
    await c.authSdk.getIdToken(user, true);
    const current = c.auth.currentUser;
    if (!current.emailVerified) throw new Error("Confirme seu e-mail antes de ativar o proprietário.");

    const bootstrapRef = c.firestoreSdk.doc(c.db, "bootstrap", token);
    const membershipRef = c.firestoreSdk.doc(c.db, "memberships", current.uid);
    const membership = {
      uid: current.uid,
      email: current.email,
      displayName: current.displayName || "",
      organizationId: PLATFORM_CONFIG.organizationId,
      globalRole: "owner",
      appRoles: { anthropometry: "owner" },
      status: "active",
      bootstrapToken: token,
      createdAt: c.firestoreSdk.serverTimestamp(),
      updatedAt: c.firestoreSdk.serverTimestamp()
    };

    const batch = c.firestoreSdk.writeBatch(c.db);
    batch.set(membershipRef, membership);
    batch.update(bootstrapRef, {
      status: "used",
      usedBy: current.uid,
      usedAt: c.firestoreSdk.serverTimestamp()
    });
    await batch.commit();
    return membership;
  },

  async signOut() {
    const c = await context();
    if (!c) return;
    await c.authSdk.signOut(c.auth);
  },

  async resetPassword(email) {
    const c = await context();
    if (!c) throw new Error("Firebase ainda não configurado.");
    await c.authSdk.sendPasswordResetEmail(c.auth, email);
  },

  async currentUser() {
    const c = await context();
    return c ? c.auth.currentUser : null;
  },

  async getMembership(uid) {
    const c = await context();
    if (!c || !uid) return null;
    const ref = c.firestoreSdk.doc(c.db, "memberships", uid);
    const snap = await c.firestoreSdk.getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async activateInvite(token) {
    const c = await context();
    const user = c && c.auth.currentUser;
    if (!c || !user) throw new Error("Faça login antes de ativar o convite.");

    const inviteRef = c.firestoreSdk.doc(c.db, "invites", token);
    const inviteSnap = await c.firestoreSdk.getDoc(inviteRef);
    if (!inviteSnap.exists()) throw new Error("Convite não encontrado.");
    const invite = inviteSnap.data();

    if (!user.email || user.email.toLowerCase() !== String(invite.email || "").toLowerCase()) {
      throw new Error("Este convite pertence a outro e-mail.");
    }
    if (invite.status !== "pending") throw new Error("Este convite não está mais disponível.");

    const membershipRef = c.firestoreSdk.doc(c.db, "memberships", user.uid);
    const membership = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || invite.displayName || "",
      organizationId: invite.organizationId,
      globalRole: invite.globalRole || "member",
      appRoles: invite.appRoles || {},
      status: "active",
      inviteToken: token,
      createdAt: c.firestoreSdk.serverTimestamp(),
      updatedAt: c.firestoreSdk.serverTimestamp()
    };

    const batch = c.firestoreSdk.writeBatch(c.db);
    batch.set(membershipRef, membership);
    batch.update(inviteRef, {
      status: "accepted",
      acceptedBy: user.uid,
      acceptedAt: c.firestoreSdk.serverTimestamp()
    });
    await batch.commit();
    return membership;
  },

  async listMemberships() {
    const c = await context();
    if (!c) return [];
    const q = c.firestoreSdk.query(
      c.firestoreSdk.collection(c.db, "memberships"),
      c.firestoreSdk.where("organizationId", "==", PLATFORM_CONFIG.organizationId)
    );
    const snap = await c.firestoreSdk.getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async createInvite(payload) {
    const c = await context();
    const user = c && c.auth.currentUser;
    if (!c || !user) throw new Error("Sessão administrativa necessária.");
    const token = crypto.randomUUID().replace(/-/g, "");
    const ref = c.firestoreSdk.doc(c.db, "invites", token);
    const data = {
      token,
      email: String(payload.email || "").trim().toLowerCase(),
      displayName: String(payload.displayName || "").trim(),
      organizationId: PLATFORM_CONFIG.organizationId,
      globalRole: payload.globalRole || "member",
      appRoles: payload.appRoles || {},
      status: "pending",
      createdBy: user.uid,
      createdAt: c.firestoreSdk.serverTimestamp()
    };
    await c.firestoreSdk.setDoc(ref, data);
    return {
      ...data,
      inviteUrl: new URL(`../professional/?invite=${token}`, location.href).href
    };
  },

  async updateMembership(uid, patch) {
    const c = await context();
    if (!c) throw new Error("Firebase ainda não configurado.");
    const ref = c.firestoreSdk.doc(c.db, "memberships", uid);
    await c.firestoreSdk.updateDoc(ref, stripUndefined({
      ...patch,
      updatedAt: c.firestoreSdk.serverTimestamp()
    }));
  },

  async listApps() {
    const c = await context();
    if (!c) return PLATFORM_CONFIG.apps;
    const snap = await c.firestoreSdk.getDocs(c.firestoreSdk.collection(c.db, "apps"));
    if (snap.empty) return PLATFORM_CONFIG.apps;
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async listPatients() {
    const c = await context();
    if (!c) return [];
    const q = c.firestoreSdk.query(
      c.firestoreSdk.collection(c.db, "patients"),
      c.firestoreSdk.where("organizationId", "==", PLATFORM_CONFIG.organizationId)
    );
    const snap = await c.firestoreSdk.getDocs(q);
    const patients = [];
    for (const d of snap.docs) {
      const assessmentsSnap = await c.firestoreSdk.getDocs(
        c.firestoreSdk.query(
          c.firestoreSdk.collection(c.db, "patients", d.id, "assessments"),
          c.firestoreSdk.orderBy("date", "asc")
        )
      );
      patients.push({
        id: d.id,
        ...d.data(),
        assessments: assessmentsSnap.docs.map(a => ({ id: a.id, ...a.data() }))
      });
    }
    return patients;
  },

  async createPatient(payload) {
    const c = await context();
    const user = c && c.auth.currentUser;
    if (!c || !user) throw new Error("Sessão necessária.");
    const ref = c.firestoreSdk.doc(c.firestoreSdk.collection(c.db, "patients"));
    const data = stripUndefined({
      ...payload,
      organizationId: PLATFORM_CONFIG.organizationId,
      createdBy: user.uid,
      createdAt: c.firestoreSdk.serverTimestamp(),
      updatedAt: c.firestoreSdk.serverTimestamp()
    });
    delete data.assessments;
    await c.firestoreSdk.setDoc(ref, data);
    return { id: ref.id, ...payload, assessments: [] };
  },

  async updatePatient(id, patch) {
    const c = await context();
    if (!c) throw new Error("Firebase ainda não configurado.");
    const ref = c.firestoreSdk.doc(c.db, "patients", id);
    await c.firestoreSdk.updateDoc(ref, stripUndefined({
      ...patch,
      updatedAt: c.firestoreSdk.serverTimestamp()
    }));
  },

  async saveAssessment(patientId, assessment) {
    const c = await context();
    const user = c && c.auth.currentUser;
    if (!c || !user) throw new Error("Sessão necessária.");
    const id = assessment.id || String(assessment.date || "").replace(/[^0-9]/g, "") || crypto.randomUUID();
    const ref = c.firestoreSdk.doc(c.db, "patients", patientId, "assessments", id);
    const { id: ignoredAssessmentId, ...assessmentData } = assessment;
    const payload = stripUndefined({
      ...assessmentData,
      clinicianId: user.uid,
      updatedAt: c.firestoreSdk.serverTimestamp(),
      createdAt: c.firestoreSdk.serverTimestamp()
    });
    await c.firestoreSdk.setDoc(ref, payload, { merge: true });
    return stripUndefined({ id, ...assessmentData });
  }
};
