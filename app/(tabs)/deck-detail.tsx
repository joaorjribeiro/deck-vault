import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { doc, getDoc, setDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { COLORS } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const TIERS = ["S", "A", "B", "C", "meme"];

const TIER_COLORS: Record<string, string> = {
  S: COLORS.tier.S,
  A: COLORS.tier.A,
  B: COLORS.tier.B,
  C: COLORS.tier.C,
  meme: COLORS.tier.meme,
};

export default function DeckDetail() {
  const insets = useSafeAreaInsets();

  const { deckId, deckNome, deckDesc, deckImg } = useLocalSearchParams<{
    deckId?: string;
    deckNome?: string;
    deckDesc?: string;
    deckImg?: string;
  }>();

  const [deck, setDeck] = useState<any>(null);

  const [cartas, setCartas] = useState<string[]>([]);
  const [cardImages, setCardImages] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(true);

  const [tier, setTier] = useState("A");
  const [descricao, setDescricao] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [isUserDeck, setIsUserDeck] = useState(false);

  useEffect(() => {
    async function fetchDeck() {
      if (!deckId) {
        setLoading(false);
        return;
      }

      try {
        const uid = auth.currentUser?.uid;

        let data: any = null;

        // Primeiro tenta buscar nos decks do usuário
        if (uid) {
          const userDeckRef = doc(db, "users", uid, "decks", deckId);

          const userSnapshot = await getDoc(userDeckRef);

          if (userSnapshot.exists()) {
            data = userSnapshot.data();
            setIsUserDeck(true);
          }
        }

        // Se não encontrar, busca no meta_decks
        if (!data) {
          const metaDeckRef = doc(db, "meta_decks", deckId);

          const metaSnapshot = await getDoc(metaDeckRef);

          if (metaSnapshot.exists()) {
            data = metaSnapshot.data();
          }
        }

        if (!data) {
          setLoading(false);
          return;
        }

        setDeck(data);

        // só tier salva automaticamente
        setTier(data.tier || "A");

        let cartasArray: string[] = [];

        if (Array.isArray(data.cartas)) {
          cartasArray = data.cartas;
        } else if (typeof data.cartas === "string") {
          let str = data.cartas.trim();

          try {
            const parsed = JSON.parse(str);

            cartasArray = Array.isArray(parsed) ? parsed : [];
          } catch {
            str = str.replace(/[\[\]"']/g, "");

            cartasArray = str
              .split(",")
              .map((c: string) => c.trim())
              .filter((c: string) => c.length > 0);
          }
        }

        setCartas(cartasArray);

        if (cartasArray.length > 0) {
          await fetchCardImages(cartasArray);
        } else {
          setImagesLoading(false);
        }
      } catch (error) {
        console.error("Erro ao buscar deck:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDeck();
  }, [deckId]);

  async function fetchCardImages(cardNames: string[]) {
    setImagesLoading(true);

    try {
      const imagesMap: Record<string, string> = {};

      await Promise.all(
        cardNames.map(async (name: string) => {
          try {
            const response = await fetch(
              `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(name)}`,
            );

            const result = await response.json();

            const card = result.data?.[0];

            if (card?.card_images?.[0]?.image_url_small) {
              imagesMap[name] = card.card_images[0].image_url_small;
            }
          } catch {
            console.log("Erro ao buscar imagem da carta:", name);
          }
        }),
      );

      setCardImages(imagesMap);
    } catch (error) {
      console.error("Erro ao buscar imagens:", error);
    } finally {
      setImagesLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);

    try {
      const uid = auth.currentUser?.uid;

      if (!uid || !deckId) return;

      await setDoc(doc(db, "users", uid, "decks", deckId), {
        nome: deck?.nome || decodeURIComponent(deckNome ?? ""),

        jogo: deck?.jogo || "Yu-Gi-Oh!",

        tier,

        descricao,

        imagem: deck?.imagem || decodeURIComponent(deckImg ?? ""),

        cartas,

        atualizadoEm: new Date().toISOString(),
      });

      setSaved(true);

      setTimeout(() => {
        router.replace("/(tabs)/home");
      }, 1000);
    } catch (error) {
      console.error("Erro ao salvar deck:", error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={COLORS.text}
            />
          </TouchableOpacity>

          <Text style={styles.title}>
            {deck?.nome || decodeURIComponent(deckNome ?? "")}
          </Text>
        </View>

        <Image
          source={{
            uri: deck?.imagem || decodeURIComponent(deckImg ?? ""),
          }}
          style={styles.image}
          resizeMode="contain"
        />

        <Text style={styles.desc}>
          {deck?.descricao || decodeURIComponent(deckDesc ?? "")}
        </Text>

        <Text style={styles.sectionTitle}>
          Cartas do Deck ({cartas.length})
        </Text>

        {imagesLoading ? (
          <ActivityIndicator
            style={{ marginVertical: 30 }}
            color={COLORS.primary}
          />
        ) : (
          <FlatList
            data={cartas}
            keyExtractor={(item, index) => `${item}-${index}`}
            numColumns={4}
            scrollEnabled={false}
            contentContainerStyle={styles.cardsGrid}
            renderItem={({ item: cardName }) => {
              const imageUrl = cardImages[cardName];

              return (
                <View style={styles.cardItem}>
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.cardImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.cardPlaceholder}>
                      <Text style={styles.placeholderText} numberOfLines={2}>
                        {cardName}
                      </Text>
                    </View>
                  )}

                  <Text style={styles.cardName} numberOfLines={2}>
                    {cardName}
                  </Text>
                </View>
              );
            }}
          />
        )}

        <Text style={styles.label}>Seu Tier</Text>

        <View style={styles.tierRow}>
          {TIERS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.tierBtn,
                tier === t && {
                  backgroundColor: TIER_COLORS[t],
                },
              ]}
              onPress={() => setTier(t)}
            >
              <Text
                style={[
                  styles.tierBtnText,
                  tier === t && {
                    color: "#000",
                  },
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Suas notas</Text>

        <TextInput
          style={styles.input}
          placeholder="Como você usa esse deck?"
          placeholderTextColor={COLORS.subtext}
          value={descricao}
          onChangeText={setDescricao}
          multiline
        />

        <TouchableOpacity
          style={[
            styles.btn,
            saved && {
              backgroundColor: "#22c55e",
            },
          ]}
          onPress={handleSave}
          disabled={saving || saved}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : saved ? (
            <Text style={styles.btnText}>
              ✓ {isUserDeck ? "Deck atualizado!" : "Deck salvo!"}
            </Text>
          ) : (
            <Text style={styles.btnText}>
              {isUserDeck ? "Atualizar Deck" : "Salvar na Minha Coleção"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    padding: 20,
    paddingTop: 56,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },

  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },

  image: {
    width: "100%",
    height: 200,
    marginBottom: 16,
    borderRadius: 12,
  },

  desc: {
    color: COLORS.subtext,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 12,
  },

  cardsGrid: {
    gap: 8,
  },

  cardItem: {
    flex: 1 / 4,
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  cardImage: {
    width: "100%",
    aspectRatio: 0.68,
    borderRadius: 6,
  },

  cardPlaceholder: {
    width: "100%",
    aspectRatio: 0.68,
    backgroundColor: "#1f1f1f",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    padding: 6,
  },

  placeholderText: {
    color: COLORS.subtext,
    fontSize: 10,
    textAlign: "center",
    lineHeight: 12,
  },

  cardName: {
    marginTop: 4,
    fontSize: 10,
    color: COLORS.subtext,
    textAlign: "center",
    lineHeight: 12,
  },

  label: {
    color: COLORS.subtext,
    fontSize: 13,
    marginBottom: 8,
    marginTop: 24,
  },

  tierRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },

  tierBtn: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },

  tierBtnText: {
    color: COLORS.text,
    fontWeight: "bold",
    fontSize: 14,
  },

  input: {
    backgroundColor: COLORS.card,
    color: COLORS.text,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },

  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
