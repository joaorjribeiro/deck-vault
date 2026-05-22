import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";

import { router, useFocusEffect } from "expo-router";

import { COLORS } from "@/constants/theme";

import { MaterialCommunityIcons } from "@expo/vector-icons";

/* ---------------- DATA ---------------- */

const GAMES = [
  { id: "yugioh", name: "Yu-Gi-Oh!", icon: "eye", available: true },
  { id: "snap", name: "Marvel Snap", icon: "cards", available: false },
  { id: "hearthstone", name: "Hearthstone", icon: "fire", available: false },
  { id: "pokemon", name: "Pokémon TCG", icon: "pokeball", available: false },
  {
    id: "magic",
    name: "Magic: The Gathering",
    icon: "magic-staff",
    available: false,
  },
];

type Deck = {
  id: string;
  nome: string;
  jogo: string;
  tier: string;
  descricao: string;
};

const TIER_COLORS: Record<string, string> = {
  S: COLORS.tier.S,
  A: COLORS.tier.A,
  B: COLORS.tier.B,
  C: COLORS.tier.C,
  meme: COLORS.tier.meme,
};

/* ---------------- SCREEN ---------------- */

export default function Home() {
  const insets = useSafeAreaInsets();

  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);

  /* DELETE STATE */
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

  /* ---------------- FIREBASE ---------------- */

  async function fetchDecks() {
    setLoading(true);

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const snap = await getDocs(collection(db, "users", uid, "decks"));

      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Deck[];

      setDecks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchDecks();
    }, []),
  );

  async function handleLogout() {
    await signOut(auth);
    router.replace("/login");
  }

  /* ---------------- DELETE FLOW ---------------- */

  function openDeleteModal(deck: Deck) {
    setSelectedDeck(deck);
    setDeleteModalVisible(true);
  }

  async function confirmDelete() {
    if (!selectedDeck) return;

    const uid = auth.currentUser?.uid;
    if (!uid) return;

    await deleteDoc(doc(db, "users", uid, "decks", selectedDeck.id));

    setDeleteModalVisible(false);
    setSelectedDeck(null);
    fetchDecks();
  }

  /* ---------------- NAV ---------------- */

  function handleSelectGame(game: (typeof GAMES)[0]) {
    setModalVisible(false);

    if (!game.available) return;

    router.push(
      `/(tabs)/game-decks?jogoId=${game.id}&jogoNome=${encodeURIComponent(
        game.name,
      )}`,
    );
  }

  /* ---------------- RENDER ---------------- */

  function renderDeck({ item }: { item: Deck }) {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/deck-detail",
            params: {
              deckId: item.id,
              isUserDeck: "true",
            },
          })
        }
      >
        <View style={styles.cardTop}>
          <View
            style={[
              styles.tierBadge,
              { backgroundColor: TIER_COLORS[item.tier] || "#888" },
            ]}
          >
            <Text style={styles.tierText}>{item.tier}</Text>
          </View>

          <TouchableOpacity onPress={() => openDeleteModal(item)}>
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={18}
              color={COLORS.subtext}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.cardName}>{item.nome}</Text>
        <Text style={styles.cardGame}>{item.jogo}</Text>
        <Text style={styles.cardDesc} numberOfLines={3}>
          {item.descricao}
        </Text>
      </TouchableOpacity>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Deck Vault</Text>
            <Text style={styles.subtitle}>
              Sua coleção de decks competitivos
            </Text>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <MaterialCommunityIcons
              name="logout"
              size={18}
              color={COLORS.subtext}
            />
            <Text style={styles.logout}>Sair</Text>
          </TouchableOpacity>
        </View>

        {/* CONTENT */}
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : decks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="cards-outline"
              size={70}
              color={COLORS.subtext}
            />
            <Text style={styles.empty}>
              Nenhum deck salvo ainda.{"\n"}
              Toque no + para começar.
            </Text>
          </View>
        ) : (
          <FlatList
            data={decks}
            keyExtractor={(item) => item.id}
            renderItem={renderDeck}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={{ paddingBottom: 140 }}
          />
        )}

        {/* FAB */}
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 24 }]}
          onPress={() => setModalVisible(true)}
        >
          <MaterialCommunityIcons name="plus" size={32} color="#fff" />
        </TouchableOpacity>

        {/* GAME MODAL */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalBox, { paddingBottom: insets.bottom + 24 }]}
            >
              <Text style={styles.modalTitle}>Escolha o jogo</Text>

              {GAMES.map((game) => (
                <TouchableOpacity
                  key={game.id}
                  style={[
                    styles.gameOption,
                    !game.available && styles.gameOptionDisabled,
                  ]}
                  onPress={() => handleSelectGame(game)}
                >
                  <MaterialCommunityIcons
                    name={game.icon as any}
                    size={28}
                    color={game.available ? COLORS.text : COLORS.subtext}
                    style={{ marginRight: 14 }}
                  />

                  <Text
                    style={[
                      styles.gameName,
                      !game.available && { color: COLORS.subtext },
                    ]}
                  >
                    {game.name}
                  </Text>

                  {!game.available && (
                    <Text style={styles.comingSoon}>Em breve</Text>
                  )}
                </TouchableOpacity>
              ))}

              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancel}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* DELETE MODAL */}
        <Modal visible={deleteModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.deleteBox}>
              <Text style={styles.modalTitle}>Excluir deck</Text>

              <Text style={styles.deleteText}>
                Tem certeza que deseja excluir:
              </Text>

              <Text style={styles.deleteDeckName}>{selectedDeck?.nome}</Text>

              <Text style={styles.deleteMeta}>
                {selectedDeck?.jogo} • Tier {selectedDeck?.tier}
              </Text>

              <View style={styles.deleteActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setDeleteModalVisible(false)}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={confirmDelete}
                >
                  <Text style={styles.deleteBtnText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    marginBottom: 28,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: 0.5,
  },

  subtitle: {
    color: COLORS.subtext,
    fontSize: 13,
    marginTop: 4,
  },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  logout: {
    color: COLORS.subtext,
    fontSize: 14,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 120,
  },

  empty: {
    color: COLORS.subtext,
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    lineHeight: 28,
  },

  row: {
    justifyContent: "space-between",
    marginBottom: 14,
  },

  card: {
    backgroundColor: COLORS.card,

    borderRadius: 22,

    padding: 16,

    width: "48%",

    borderWidth: 1,
    borderColor: COLORS.cardBorder,

    shadowColor: "#000",

    shadowOpacity: 0.35,

    shadowRadius: 10,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 8,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    marginBottom: 14,
  },

  tierBadge: {
    borderRadius: 8,

    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  tierText: {
    fontWeight: "800",
    fontSize: 12,
    color: "#000",
  },

  cardName: {
    color: COLORS.text,

    fontWeight: "800",

    fontSize: 16,

    marginBottom: 4,
  },

  cardGame: {
    color: COLORS.subtext,
    fontSize: 12,
    marginBottom: 10,
  },

  cardDesc: {
    color: COLORS.subtext,
    fontSize: 12,
    lineHeight: 18,
  },

  fab: {
    position: "absolute",

    right: 24,

    backgroundColor: COLORS.primary,

    width: 68,
    height: 68,

    borderRadius: 34,

    justifyContent: "center",
    alignItems: "center",

    shadowColor: COLORS.primary,

    shadowOpacity: 0.5,

    shadowRadius: 12,

    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },

  modalBox: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },

  modalTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 20,
  },

  gameOption: {
    flexDirection: "row",

    alignItems: "center",

    paddingVertical: 18,

    borderBottomWidth: 1,

    borderBottomColor: "#ffffff10",
  },

  gameOptionDisabled: {
    opacity: 0.45,
  },

  gameName: {
    color: COLORS.text,
    fontSize: 16,
    flex: 1,
    fontWeight: "600",
  },

  comingSoon: {
    fontSize: 10,
    color: "#fff",
    backgroundColor: "#ff001e",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  cancel: {
    color: COLORS.subtext,

    textAlign: "center",

    marginTop: 24,

    fontSize: 15,
  },
  deleteBox: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 22,
  },

  deleteText: {
    color: COLORS.subtext,
    marginTop: 10,
  },

  deleteDeckName: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 8,
  },

  deleteMeta: {
    color: COLORS.subtext,
    fontSize: 12,
    marginTop: 4,
  },

  deleteActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },

  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
  },

  deleteBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#ff3b3b",
    alignItems: "center",
  },

  cancelText: {
    color: COLORS.text,
    fontWeight: "600",
  },

  deleteBtnText: {
    color: "#fff",
    fontWeight: "800",
  },
});
