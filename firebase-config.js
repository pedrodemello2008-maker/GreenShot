/*
 * GreenShot — Configuração do Firebase
 * =====================================
 * Este é o ÚNICO arquivo que você precisa editar para ligar o app ao seu
 * projeto Firebase. Todo o resto (login, cadastro, salvar progresso na
 * nuvem etc.) já está pronto em firebase.js e app.js.
 *
 * PASSO A PASSO
 * -------------
 * 1. Acesse https://console.firebase.google.com e crie um projeto
 *    (ou use um que já exista).
 *
 * 2. Dentro do projeto: ⚙️ Configurações do projeto → aba "Geral" →
 *    role até "Seus apps" → clique no ícone Web "</>" → dê um nome
 *    (ex.: "GreenShot Web") → "Registrar app".
 *    O Firebase vai te mostrar um objeto `firebaseConfig` — copie os
 *    valores dele e cole nos campos abaixo, substituindo os textos
 *    "SUA_..._AQUI".
 *
 * 3. No menu lateral do console, em "Build":
 *      • Authentication → aba "Sign-in method" → ative "E-mail/senha".
 *        (Opcional: ative também "Google" para o botão de login rápido.)
 *      • Firestore Database → "Criar banco de dados" → escolha uma
 *        região próxima → inicie em modo produção.
 *        Depois, na aba "Regras", cole o conteúdo do arquivo
 *        firestore.rules deste projeto e publique.
 *
 * 4. Salve este arquivo. Pronto — abra o app, crie uma conta pela tela
 *    de cadastro e o progresso (XP, tokens, nível, ecossistema) passa a
 *    ser salvo automaticamente na nuvem, por usuário.
 *
 * ENQUANTO VOCÊ NÃO PREENCHER AS CHAVES ABAIXO:
 * O app continua funcionando normalmente em "modo local" (exatamente como
 * antes), salvando o progresso só no localStorage do navegador — nada
 * quebra. O Firebase só entra em ação quando os valores reais forem
 * colados aqui.
 */

window.GREENSHOT_FIREBASE_CONFIG = {
 apiKey: "AIzaSyDK5kqCDPVyuB3Wre0z2GTcNulw3F5IVtU",
  authDomain: "greenshot-c8fef.firebaseapp.com",
  projectId: "greenshot-c8fef",
  storageBucket: "greenshot-c8fef.firebasestorage.app",
  messagingSenderId: "201979402256",
  appId: "1:201979402256:web:43745a1d3935787f2b5295",
  measurementId: "G-VVB42JZK2S"
  // measurementId é opcional — só existe se você ativou o Google Analytics
  // ao criar o app. Pode remover esta linha se não tiver.
  // measurementId: "SEU_MEASUREMENT_ID_AQUI",
};
