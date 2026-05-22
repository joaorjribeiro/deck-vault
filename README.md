# 🃏 Deck Vault

> Organize, classifique e gerencie seus decks competitivos de card games — tudo em um só lugar.

Projeto acadêmico desenvolvido para a disciplina de **Desenvolvimento de Aplicativos Mobile** — UNISUAM.

---

## 📱 Sobre o Projeto

O **Deck Vault** é um aplicativo móvel híbrido para jogadores de card games que querem organizar seus decks competitivos. O usuário pode explorar decks do meta, salvá-los na sua coleção pessoal com tier personalizado (S / A / B / C / meme) e adicionar anotações próprias — tudo sincronizado em tempo real com o Firebase.

---

## ✨ Funcionalidades

* 🔐 Autenticação com e-mail e senha (Firebase Auth)
* 🎮 Listagem de decks do meta por jogo
* 💾 Salvar decks na coleção pessoal com tier personalizado
* 📝 Anotações pessoais por deck
* 🗑️ Remoção de decks da coleção
* 🌙 Interface dark inspirada em Balatro
* 🃏 Suporte a múltiplos card games (Yu-Gi-Oh! disponível, demais em breve)

---

## 🛠️ Tecnologias

* [React Native](https://reactnative.dev/)
* [Expo](https://expo.dev/) — SDK 54
* [Expo Router](https://expo.github.io/router/) — navegação baseada em arquivos
* [Firebase Auth](https://firebase.google.com/) — autenticação
* [Firebase Firestore](https://firebase.google.com/) — banco de dados em tempo real
* [TypeScript](https://www.typescriptlang.org/)
* [@expo/vector-icons](https://docs.expo.dev/guides/icons/)

---

## 📂 Estrutura do Projeto

```
deck-vault/
├── app/
│   ├── _layout.tsx          # Layout raiz
│   ├── index.tsx            # Redirect inicial
│   ├── login.tsx            # Tela de login
│   ├── register.tsx         # Tela de cadastro
│   └── (tabs)/
│       ├── _layout.tsx      # Layout das telas internas
│       ├── home.tsx         # Coleção do usuário
│       ├── game-decks.tsx   # Decks do meta por jogo
│       └── deck-detail.tsx  # Detalhe e salvamento do deck
├── lib/
│   └── firebase.ts          # Configuração do Firebase
├── constants/
│   └── theme.ts             # Paleta de cores
└── assets/                  # Ícones e imagens
```

---

## 🗃️ Estrutura do Firestore

```
meta_decks/              ← Decks do meta
  {deckId}/
    nome, jogo, tier, descricao, imagem, cartas[]

users/
  {uid}/
    decks/               ← Coleção pessoal do usuário
      {deckId}/
        nome, jogo, tier, descricao, criadoEm
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

* Node.js 18+
* Expo Go instalado no celular
* Conta no Firebase

### Instalação

```bash
# Clone o repositório
git clone https://github.com/joaorjribeiro/deck-vault.git
cd deck-vault

# Instale as dependências
npm install --legacy-peer-deps

# Crie o arquivo .env na raiz com suas credenciais do Firebase
EXPO_PUBLIC_API_KEY=...
EXPO_PUBLIC_AUTH_DOMAIN=...
EXPO_PUBLIC_PROJECT_ID=...
EXPO_PUBLIC_STORAGE_BUCKET=...
EXPO_PUBLIC_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_APP_ID=...

# Inicie o projeto
npx expo start
```

Escaneie o QR Code com o Expo Go para abrir no celular.

---

## 👤 Autor

**João Pedro** — Desenvolvimento de Aplicativos Mobile — UNISUAM

---

## 📲 Download do APK

Acesse a aba [Releases](https://github.com/joaorjribeiro/deck-vault/releases/tag/v1.0.0) para baixar o APK Android.
