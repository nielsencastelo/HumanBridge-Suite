import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from "react-native";
import { analyzeBureaucracyText } from "@/src/services/api";
import { colors } from "@/src/theme";

export default function TranslatorScreen() {
  const [rawText, setRawText] = useState("");
  const [contextNotes, setContextNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  async function handleAnalyze() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await analyzeBureaucracyText(rawText, contextNotes);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>BridgeForm</Text>
      <Text style={styles.subtitle}>Cole o texto do documento para simplificar a linguagem.</Text>

      <TextInput
        style={[styles.input, styles.textarea]}
        multiline
        value={rawText}
        onChangeText={setRawText}
        placeholder="Cole aqui o documento..."
        placeholderTextColor={colors.muted}
      />
      <TextInput
        style={[styles.input, styles.textarea]}
        multiline
        value={contextNotes}
        onChangeText={setContextNotes}
        placeholder="Observações de contexto"
        placeholderTextColor={colors.muted}
      />
      <Pressable style={styles.button} onPress={handleAnalyze} disabled={loading || !rawText.trim()}>
        <Text style={styles.buttonText}>{loading ? "Analisando..." : "Analisar"}</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {result ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{result.detected_document_type}</Text>
          <Text style={styles.text}>{result.plain_language_summary}</Text>

          <Text style={styles.section}>Ações</Text>
          {result.what_you_need_to_do_now.map((item: any, index: number) => (
            <Text key={index} style={styles.text}>• {item.title}</Text>
          ))}

          <Text style={styles.section}>Prazos</Text>
          {result.deadlines.length ? (
            result.deadlines.map((item: any, index: number) => (
              <Text key={index} style={styles.text}>• {item.raw_text}</Text>
            ))
          ) : (
            <Text style={styles.text}>Nenhum prazo detectado.</Text>
          )}

          <Text style={styles.section}>Riscos</Text>
          {result.risks_if_ignored.map((item: string, index: number) => (
            <Text key={index} style={styles.text}>• {item}</Text>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    minHeight: "100%",
    padding: 18,
    gap: 12
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700"
  },
  subtitle: {
    color: colors.muted
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#0b1626",
    color: colors.text,
    padding: 14
  },
  textarea: {
    minHeight: 120,
    textAlignVertical: "top"
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center"
  },
  buttonText: {
    color: "#06101d",
    fontWeight: "700"
  },
  error: {
    color: colors.danger
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 20,
    borderColor: colors.line,
    borderWidth: 1,
    padding: 16,
    gap: 8
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700"
  },
  text: {
    color: colors.text,
    lineHeight: 22
  },
  section: {
    color: colors.accent2,
    marginTop: 8,
    fontWeight: "700"
  }
});
