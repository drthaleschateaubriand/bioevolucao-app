import { PLATFORM_CONFIG, firebaseConfigured } from "./platform-config.js";

let sdkPromise = null;
let ctxPromise = null;

async function loadSdk() {
  if (!sdkPromise) {
    sdkPromise = Promise.all([
      import("https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js")
    ]).then(([app, auth, firestore]) => ({ app, auth, firestore }));
  }
  return sdkPromise;
}

async function context() {
  if (!firebaseConfigured()) return null;
  if (!ctxPromise) {
    ctxPromise = (async () => {
      const sdk = await loadSdk();
      const app = sdk.app.getApps().length ? sdk.app.getApp() : sdk.app.initializeApp(PLATFORM_CONFIG.firebase);
      const auth = sdk.auth.getAuth(app);
      const db = sdk.firestore.getFirestore(app);
      return { ...sdk, app, auth, db };
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
    return c.auth.onAuthStateChanged(c.auth, callback);
  },

  async signIn(email, password) {
    const c = await context();
    if (!c) throw new Error("Firebase ainda não configurado.");
    return c.auth.signInWithEmailAndPassword(c.auth, email, password);
  },

  async signUp(email, password, displayName = "") {
    const c = await context();
    if (!c) throw new Error("Firebase ainda não configurado.");
    const credential = await c.auth.createUserWithEmailAndPassword(c.auth, email, password);
    if (displayName) await c.auth.updateProfile(credential.user, { displayName });
    return credential;
  },

  async signOut() {
    const c = await context();
    if (!c) return;
    await c.auth.signOut(c.auth);
  },

  async resetPassword(email) {
    const c = await context();
    if (!c) throw new Error("Firebase ainda não configurado.");
    await c.auth.sendPasswordResetEmail(c.auth, email);
  },

  async currentUser() {
    const c = await context();
    return c ? c.auth.currentUser : null;
  },

  async getMembership(uid) {
    const c = await context();
    if (!c || !uid) return null;
    const ref = c.firestore.doc(c.db, "memberships", uid);
    const snap = await c.firestore.getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async activateInvite(token) {
    const c = await context();
    const user = c && c.auth.currentUser;
    if (!c || !user) throw new Error("Faça login antes de ativar o convite.");

    const inviteRef = c.firestore.doc(c.db, "invites", token);
    const inviteSnap = await c.firestore.getDoc(inviteRef);
    if (!inviteSnap.exists()) throw new Error("Convite não encontrado.");
    const invite = inviteSnap.data();

    if (!user.email || user.email.toLowerCase() !== String(invite.email || "").toLowerCase()) {
      throw new Error("Este convite pertence a outro e-mail.");
    }
    if (invite.status !== "pending") throw new Error("Este convite não está mais disponível.");

    const membershipRef = c.firestore.doc(c.db, "memberships", user.uid);
    const membership = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || invite.displayName || "",
      organizationId: invite.organizationId,
      globalRole: invite.globalRole || "member",
      appRoles: invite.appRoles || {},
      status: "active",
      inviteToken: token,
      createdAt: c.firestore.serverTimestamp(),
      updatedAt: c.firestore.serverTimestamp()
    };

    const batch = c.firestore.writeBatch(c.db);
    batch.set(membershipRef, membership);
    batch.update(inviteRef, {
      status: "accepted",
      acceptedBy: user.uid,
      acceptedAt: c.firestore.serverTimestamp()
    });
    await batch.commit();
    return membership;
  },

  async bootstrapOwner(email, displayName = "") {
    const c = await context();
    const user = c && c.auth.currentUser;
    if (!c || !user) throw new Error("Faça login primeiro.");
    if (!user.email || user.email.toLowerCase() !== String(email).toLowerCase()) {
      throw new Error("O e-mail autenticado não corresponde ao proprietário configurado.");
    }
    const ref = c.firestore.doc(c.db, "memberships", user.uid);
    const data = {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.displayName || "",
      organizationId: PLATFORM_CONFIG.organizationId,
      globalRole: "owner",
      appRoles: { anthropometry: "owner" },
      status: "active",
      createdAt: c.firestore.serverTimestamp(),
      updatedAt: c.firestore.serverTimestamp()
    };
    await c.firestore.setDoc(ref, data);
    return data;
  },

  async listMemberships() {
    const c = await context();
    if (!c) return [];
    const q = c.firestore.query(
      c.firestore.collection(c.db, "memberships"),
      c.firestore.where("organizationId", "==", PLATFORM_CONFIG.organizationId)
    );
    const snap = await c.firestore.getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async createInvite(payload) {
    const c = await context();
    const user = c && c.auth.currentUser;
    if (!c || !user) throw new Error("Sessão administrativa necessária.");
    const token = crypto.randomUUID().replace(/-/g, "");
    const ref = c.firestore.doc(c.db, "invites", token);
    const data = {
      token,
      email: String(payload.email || "").trim().toLowerCase(),
      displayName: String(payload.displayName || "").trim(),
      organizationId: PLATFORM_CONFIG.organizationId,
      globalRole: payload.globalRole || "member",
      appRoles: payload.appRoles || {},
      status: "pending",
      createdBy: user.uid,
      createdAt: c.firestore.serverTimestamp()
    };
    await c.firestore.setDoc(ref, data);
    return {
      ...data,
      inviteUrl: new URL(`../professional/?invite=${token}`, location.href).href
    };
  },

  async updateMembership(uid, patch) {
    const c = await context();
    if (!c) throw new Error("Firebase ainda não configurado.");
    const ref = c.firestore.doc(c.db, "memberships", uid);
    await c.firestore.updateDoc(ref, {
      ...patch,
      updatedAt: c.firestore.serverTimestamp()
    });
  },

  async listApps() {
    const c = await context();
    if (!c) return PLATFORM_CONFIG.apps;
    const snap = await c.firestore.getDocs(c.firestore.collection(c.db, "apps"));
    if (snap.empty) return PLATFORM_CONFIG.apps;
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
};
