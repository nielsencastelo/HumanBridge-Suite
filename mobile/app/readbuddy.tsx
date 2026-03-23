import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from "react-native";
import { analyzeReading, createProfile, listProfiles } from "@/src/services/api";
import { colors } from "@/src/theme";

type Profile = {
  id: number;
  full_name: string;
  grade_level?: string;
};

function toErrorString(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try { return JSON.stringify(err); } catch { return "Erro desconhecido."; }
}

export default function ReadBuddyScreen() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | undefined>(undefined);
  const [profileName, setProfileName] = useState("");
  const [profileAge, setProfileAge] = useState("8");

  const [expectedText, setExpectedText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("25");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  async function refreshProfiles() {
    try {
      const data = await listProfiles();
      setProfiles(data.items ?? []);
    } catch (err) {
      console.error("Erro ao carregar perfis:", toErrorString(err));
    }
  }

  useEffect(() => {
    refreshProfiles();
  }, []);

  async function handleCreateProfile() {
    if (!profileName.trim()) {
      setError("Informe o nome do aluno.");
      return;
    }
    setError("");
    try {
      const created = await createProfile({
        full_name: profileName.trim(),
        age: Number(profileAge),
        grade_level: "3º ano",
        language: "pt-BR"
      });
      setSelectedProfileId(created.id);
      setProfileName("");
      await refreshProfiles();
    } catch (err) {
      setError(toErrorString(err));
    }
  }

  async function handleAnalyze() {
    if (!expectedText.trim()) {
      setError("Informe o texto esperado.");
      return;
    }
    if (!transcript.trim()) {
      setError("Informe a transcrição do que foi lido.");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const data = await analyzeReading({
        profile_id: selectedProfileId,
        expected_text: expectedText,
        transcript,
        duration_seconds: Number(durationSeconds) || 25,
        language: "pt-BR"
      });
      setResult(data);
    } catch (err) {
      setError(toErrorString(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>ReadBuddy</Text>
      <Text style={styles.subtitle}>Perfil rápido + análise de leitura.</Text>

      <View style={styles.card}>
        <Text style={styles.section}>Criar perfil</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome do aluno"
          placeholderTextColor={colors.muted}
          value={profileName}
          onChangeText={setProfileName}
        />
        <TextInput
          style={styles.input}
          placeholder="Idade"
          placeholderTextColor={colors.muted}
          value={profileAge}
          onChangeText={setProfileAge}
          keyboardType="numeric"
        />
        <Pressable style={styles.button} onPress={handleCreateProfile}>
          <Text style={styles.buttonText}>Salvar perfil</Text>
        </Pressable>

        <Text style={styles.section}>Perfis disponíveis</Text>
        {profiles.length ? (
          profiles.map((profile) => (
            <Pressable
              key={profile.id}
              style={[
                styles.profileItem,
                selectedProfileId === profile.id && { borderColor: colors.accent }
              ]}
              onPress={() => setSelectedProfileId(profile.id)}
            >
              <Text style={styles.text}>
                {profile.full_name} {profile.grade_level ? `· ${profile.grade_level}` : ""}
              </Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.text}>Nenhum perfil ainda.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Analisar leitura</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          multiline
          placeholder="Texto esperado"
          placeholderTextColor={colors.muted}
          value={expectedText}
          onChangeText={setExpectedText}
        />
        <TextInput
          style={[styles.input, styles.textarea]}
          multiline
          placeholder="Transcrição do que foi lido"
          placeholderTextColor={colors.muted}
          value={transcript}
          onChangeText={setTranscript}
        />
        <TextInput
          style={styles.input}
          placeholder="Duração em segundos"
          placeholderTextColor={colors.muted}
          value={durationSeconds}
          onChangeText={setDurationSeconds}
          keyboardType="numeric"
        />
        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAnalyze}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? "Analisando..." : "Analisar leitura"}</Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}

      {result ? (
        <View style={styles.card}>
          <Text style={styles.section}>Resultado</Text>
          <Text style={styles.text}>Precisão: {Number(result.accuracy_score).toFixed(1)}%</Text>
          <Text style={styles.text}>PPM: {Number(result.words_per_minute).toFixed(1)}</Text>
          <Text style={styles.text}>Nível: {result.reading_level}</Text>
          <Text style={styles.text}>{result.parent_feedback}</Text>

          {result.exercises?.length ? (
            <>
              <Text style={styles.section}>Exercícios</Text>
              {result.exercises.map((item: any, index: number) => (
                <Text key={index} style={styles.text}>
                  • {item.title}: {Array.isArray(item.target_words) ? item.target_words.join(", ") : ""}
                </Text>
              ))}
            </>
          ) : null}
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
    gap: 14
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700"
  },
  subtitle: {
    color: colors.muted
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 10
  },
  section: {
    color: colors.accent2,
    fontWeight: "700"
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
  buttonDisabled: {
    opacity: 0.5
  },
  buttonText: {
    color: "#06101d",
    fontWeight: "700"
  },
  profileItem: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12
  },
  text: {
    color: colors.text,
    lineHeight: 22
  },
  errorBox: {
    backgroundColor: "#2a0a0a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: 12
  },
  error: {
    color: colors.danger
  }
});
