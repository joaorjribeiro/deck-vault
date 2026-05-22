import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { router } from "expo-router";
import { COLORS } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Regras senha
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = (password.match(/\d/g) || []).length >= 2;
  const hasSpecial = /[@$!%*?&.#_\-]/.test(password);

  const isPasswordValid =
    hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;

  async function handleRegister() {
    setError("");

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Preencha todos os campos.");
      return;
    }

    if (!isPasswordValid) {
      setError("Sua senha não atende os requisitos.");
      return;
    }

    if (!passwordsMatch) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);

      router.replace("/(tabs)/home");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Esse email já está em uso.");
      } else if (err.code === "auth/invalid-email") {
        setError("Email inválido.");
      } else {
        setError("Erro ao criar conta.");
      }
    } finally {
      setLoading(false);
    }
  }

  function Requirement({ valid, text }: { valid: boolean; text: string }) {
    return (
      <View style={styles.requirementRow}>
        <MaterialCommunityIcons
          name={valid ? "check-circle" : "close-circle"}
          size={16}
          color={valid ? "#D4AF37" : "#6B657D"}
        />

        <Text
          style={[styles.requirementText, valid && styles.requirementTextValid]}
        >
          {text}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>🃏 Deck Vault</Text>

        <Text style={styles.sub}>Crie sua conta e organize seus decks.</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={COLORS.subtext}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* Senha */}
        <View style={styles.passwordWrapper}>
          <TextInput
            style={styles.inputPassword}
            placeholder="Senha"
            placeholderTextColor={COLORS.subtext}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />

          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <MaterialCommunityIcons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={COLORS.subtext}
            />
          </TouchableOpacity>
        </View>

        {/* Requisitos */}
        <View style={styles.requirementsBox}>
          <Requirement valid={hasMinLength} text="8 caracteres" />
          <Requirement valid={hasUpper} text="1 letra maiúscula" />
          <Requirement valid={hasLower} text="1 letra minúscula" />
          <Requirement valid={hasNumber} text="2 números" />
          <Requirement valid={hasSpecial} text="1 símbolo" />
        </View>

        {/* Confirmar senha */}
        <View style={styles.passwordWrapper}>
          <TextInput
            style={styles.inputPassword}
            placeholder="Confirmar senha"
            placeholderTextColor={COLORS.subtext}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />

          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <MaterialCommunityIcons
              name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={COLORS.subtext}
            />
          </TouchableOpacity>
        </View>

        {passwordsMatch && (
          <Text style={styles.matchText}>✓ Senhas coincidem</Text>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[
            styles.btn,
            (!isPasswordValid || !passwordsMatch) && styles.btnDisabled,
          ]}
          onPress={handleRegister}
          disabled={loading || !isPasswordValid || !passwordsMatch}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Criar Conta</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>
            Já possui conta? <Text style={styles.linkHighlight}>Entrar</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    padding: 24,
  },

  card: {
    backgroundColor: "#161122",
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: "#ffffff08",
  },

  logo: {
    fontSize: 34,
    fontWeight: "bold",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },

  sub: {
    fontSize: 14,
    color: COLORS.subtext,
    textAlign: "center",
    marginBottom: 28,
  },

  input: {
    backgroundColor: COLORS.card,
    color: COLORS.text,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#ffffff10",
  },

  passwordWrapper: {
    position: "relative",
    marginBottom: 14,
  },

  inputPassword: {
    backgroundColor: COLORS.card,
    color: COLORS.text,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 52,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#ffffff10",
  },

  eyeButton: {
    position: "absolute",
    right: 14,
    top: 14,
  },

  requirementsBox: {
    backgroundColor: "#120E1C",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ffffff08",
  },

  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },

  requirementText: {
    color: "#6B657D",
    fontSize: 13,
  },

  requirementTextValid: {
    color: "#D4AF37",
  },

  matchText: {
    color: "#D4AF37",
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
    fontWeight: "600",
  },

  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 6,
  },

  btnDisabled: {
    opacity: 0.45,
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  error: {
    color: "#ff5c5c",
    marginBottom: 12,
    textAlign: "center",
    fontSize: 13,
  },

  link: {
    color: COLORS.subtext,
    textAlign: "center",
    marginTop: 22,
    fontSize: 14,
  },

  linkHighlight: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
});
