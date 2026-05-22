import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLORS } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type MetaDeck = {
  id: string;
  nome: string;
  jogo: string;
  tier: string;
  descricao: string;
  imagem: string;
};

const TIER_COLORS: Record<string, string> = {
  S: COLORS.tier.S,
  A: COLORS.tier.A,
  B: COLORS.tier.B,
  C: COLORS.tier.C,
  meme: COLORS.tier.meme,
};

export default function GameDecks() {
  const { jogoNome } = useLocalSearchParams<{
    jogoId: string;
    jogoNome: string;
  }>();
  const [decks, setDecks] = useState<MetaDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMetaDecks();
  }, []);

  async function fetchMetaDecks() {
    try {
      const snap = await getDocs(collection(db, "meta_decks"));
      const data = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as MetaDeck,
      );
      setDecks(data);
    } catch {
      setError("Erro ao carregar decks.");
    } finally {
      setLoading(false);
    }
  }

  function renderDeck({ item }: { item: MetaDeck }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/deck-detail",
            params: {
              deckId: item.id,
              deckNome: item.nome,
              deckDesc: item.descricao,
              deckImg: item.imagem,
              deckTier: item.tier,
              isUserDeck: "false",
            },
          })
        }
      >
        <Image
          source={{ uri: item.imagem }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <View style={styles.cardInfo}>
          <View
            style={[
              styles.tierBadge,
              { backgroundColor: TIER_COLORS[item.tier] || "#888" },
            ]}
          >
            <Text style={styles.tierText}>{item.tier}</Text>
          </View>
          <Text style={styles.cardName} numberOfLines={2}>
            {item.nome}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={COLORS.text}
          />
        </TouchableOpacity>
        <Text style={styles.title}>{decodeURIComponent(jogoNome ?? "")}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={decks}
          keyExtractor={(item) => item.id}
          renderItem={renderDeck}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
    paddingTop: 56,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  title: { color: COLORS.text, fontSize: 20, fontWeight: "bold" },
  row: { justifyContent: "space-between", marginBottom: 12 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    width: "48%",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardImage: { width: "100%", height: 140 },
  cardInfo: { padding: 10 },
  tierBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  tierText: { fontWeight: "bold", fontSize: 11, color: "#000" },
  cardName: { color: COLORS.text, fontWeight: "bold", fontSize: 13 },
  error: { color: "#ff4444", textAlign: "center", marginTop: 40 },
});
