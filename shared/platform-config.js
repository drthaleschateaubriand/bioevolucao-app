export const PLATFORM_CONFIG = {
  platformName: "Portal do Proprietário",
  organizationId: "default",
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  },
  apps: [
    {
      id: "anthropometry",
      name: "Avaliação Antropométrica",
      path: "../professional/",
      description: "Composição corporal, bioimpedância e adipometria."
    }
  ]
};

export function firebaseConfigured() {
  const f = PLATFORM_CONFIG.firebase;
  return Boolean(f.apiKey && f.authDomain && f.projectId && f.appId);
}
