export const PLATFORM_CONFIG = {
  platformName: "Portal do Proprietário",
  organizationId: "default",
  firebase: {
    apiKey: "AIzaSyCrSJnPW-nJHuj_zadQPQ5nVhf7EZvQfsA",
    authDomain: "appparenteraleenteral.firebaseapp.com",
    projectId: "appparenteraleenteral",
    storageBucket: "appparenteraleenteral.firebasestorage.app",
    messagingSenderId: "1080890601815",
    appId: "1:1080890601815:web:220a3665b6c7d64b4cce12"
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
