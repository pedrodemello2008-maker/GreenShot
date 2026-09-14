/*
 * GreenShot — Integração com Firebase (Auth + Firestore)
 * ========================================================
 * Este arquivo expõe `window.GreenShotFirebase`, usado pelo app.js para:
 *   - login / cadastro / login com Google / recuperar senha / sair
 *   - salvar e carregar o progresso do usuário (XP, tokens, nível,
 *     estágio do ecossistema) no Firestore, um documento por usuário
 *
 * Você não precisa mexer neste arquivo — as chaves do projeto ficam em
 * firebase-config.js. Se aquele arquivo ainda tiver os valores de
 * exemplo, tudo aqui roda em "modo local": `isConfigured` fica `false`,
 * nenhuma chamada de rede é feita, e o app.js usa apenas o localStorage,
 * exatamente como antes de existir esta integração.
 */
(() => {
  "use strict";

  const cfg = window.GREENSHOT_FIREBASE_CONFIG || {};
  const isConfigured =
    !!cfg.apiKey &&
    cfg.apiKey.indexOf("SUA_API_KEY_AQUI") === -1 &&
    !!cfg.projectId &&
    cfg.projectId.indexOf("SEU_PROJETO_ID_AQUI") === -1;

  const USERS_COLLECTION = "users";

  let auth = null;
  let db = null;

  if (isConfigured) {
    if (!window.firebase || !window.firebase.initializeApp) {
      console.warn(
        "GreenShot/Firebase: firebase-config.js está preenchido, mas o " +
          "SDK do Firebase não carregou (verifique a conexão ou os " +
          "<script> do Firebase no <head> do app.html). Rodando em modo local.",
      );
    } else {
      try {
        firebase.initializeApp(cfg);
        auth = firebase.auth();
        db = firebase.firestore();
        // Mantém o app usável offline (a base do PWA) também para os
        // dados do Firestore, sincronizando quando a conexão voltar.
        db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
          if (
            err.code !== "failed-precondition" &&
            err.code !== "unimplemented"
          ) {
            console.warn(
              "GreenShot/Firebase: persistência offline indisponível:",
              err.code,
            );
          }
        });
      } catch (err) {
        console.error("GreenShot/Firebase: falha ao iniciar o Firebase:", err);
        auth = null;
        db = null;
      }
    }
  }

  /* Traduz os códigos de erro mais comuns do Firebase Auth para
     mensagens que fazem sentido em português, para mostrar na tela. */
  function friendlyAuthError(err) {
    const code = err && err.code;
    const map = {
      "auth/invalid-email": "E-mail inválido.",
      "auth/user-disabled": "Esta conta foi desativada.",
      "auth/user-not-found": "E-mail ou senha incorretos.",
      "auth/wrong-password": "E-mail ou senha incorretos.",
      "auth/invalid-credential": "E-mail ou senha incorretos.",
      "auth/email-already-in-use": "Já existe uma conta com este e-mail.",
      "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
      "auth/missing-password": "Digite uma senha.",
      "auth/too-many-requests":
        "Muitas tentativas seguidas. Aguarde um momento e tente de novo.",
      "auth/popup-closed-by-user": "Janela fechada antes de concluir o login.",
      "auth/cancelled-popup-request": "Login cancelado.",
      "auth/network-request-failed": "Sem conexão com a internet.",
      "not-configured":
        "O Firebase ainda não foi configurado neste app (veja firebase-config.js).",
    };
    return (
      map[code] || "Não foi possível completar a operação. Tente novamente."
    );
  }

  const GreenShotFirebase = {
    /** true quando firebase-config.js tem chaves reais e o SDK carregou */
    isConfigured: isConfigured && !!auth && !!db,

    /** Assina mudanças de sessão. Chama callback(null) se não configurado. */
    onAuthChange(callback) {
      if (!auth) {
        callback(null);
        return () => {};
      }
      return auth.onAuthStateChanged(callback);
    },

    currentUser() {
      return auth ? auth.currentUser : null;
    },

    async registerWithEmail(name, email, password) {
      if (!auth) throw { code: "not-configured" };
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      if (name) {
        try {
          await cred.user.updateProfile({ displayName: name });
        } catch (e) {}
      }
      await GreenShotFirebase.saveUserData(cred.user.uid, {
        displayName: name || "",
        email: email || "",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      return cred.user;
    },

    async loginWithEmail(email, password) {
      if (!auth) throw { code: "not-configured" };
      const cred = await auth.signInWithEmailAndPassword(email, password);
      return cred.user;
    },

    async loginWithGoogle() {
      if (!auth) throw { code: "not-configured" };
      const provider = new firebase.auth.GoogleAuthProvider();
      const cred = await auth.signInWithPopup(provider);
      return cred.user;
    },

    async resetPassword(email) {
      if (!auth) throw { code: "not-configured" };
      await auth.sendPasswordResetEmail(email);
    },

    async logout() {
      if (!auth) return;
      await auth.signOut();
    },

    /** Lê o documento de progresso do usuário. Retorna null se não existir. */
    async loadUserData(uid) {
      if (!db || !uid) return null;
      try {
        const snap = await db.collection(USERS_COLLECTION).doc(uid).get();
        return snap.exists ? snap.data() : null;
      } catch (err) {
        console.warn("GreenShot/Firebase: falha ao carregar progresso:", err);
        return null;
      }
    },

    /** Salva (mescla) campos no documento de progresso do usuário. */
    async saveUserData(uid, data) {
      if (!db || !uid) return;
      try {
        await db
          .collection(USERS_COLLECTION)
          .doc(uid)
          .set(
            {
              ...data,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
      } catch (err) {
        console.warn(
          "GreenShot/Firebase: falha ao salvar progresso na nuvem:",
          err,
        );
      }
    },

    friendlyAuthError,
  };

  window.GreenShotFirebase = GreenShotFirebase;
})();
