import { Link } from "expo-router";
import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import { colors } from "@/src/theme";

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>MVP completo</Text>
      <Text style={styles.title}>HumanBridge Mobile</Text>
      <Text style={styles.subtitle}>
        Dois módulos prontos: BridgeForm para simplificar burocracia e ReadBuddy para leitura guiada.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>BridgeForm</Text>
        <Text style={styles.cardText}>
          Cole um texto difícil e receba resumo simples, prazo, ações e riscos.
        </Text>
        <Link href="/translator" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Abrir BridgeForm</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>ReadBuddy</Text>
        <Text style={styles.cardText}>
          Crie perfil, analise leitura e gere exercícios prontos para a próxima sessão.
        </Text>
        <Link href="/readbuddy" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Abrir ReadBuddy</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
    backgroundColor: colors.bg,
    flexGrow: 1
  },
  kicker: {
    color: colors.accent,
    marginTop: 12
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "700"
  },
  subtitle: {
    color: colors.muted,
    lineHeight: 22
  },
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 10
  },
  cardTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 20
  },
  cardText: {
    color: colors.muted,
    lineHeight: 22
  },
  button: {
    marginTop: 6,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center"
  },
  buttonText: {
    color: "#06101d",
    fontWeight: "700"
  }
});
