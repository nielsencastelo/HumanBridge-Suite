import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from "react-native";
import { analyzeReading, createProfile, listProfiles } from "@/src/services/api";
import { colors } from "@/src/theme";

type Profile = {
  id: number;
  full_name: string;
  grade_level?: string;
};

export default function ReadBuddyScreen() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | undefined>(undefined);
  const [profileName, setProfileName] = useState("");
  const [profileAge, setProfileAge] = useState("8");

  const [expectedText, setExpectedText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("25");
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  async function refreshProfiles() {
    const data = await listProfiles();
    setProfiles(data.items);
  }

  useEffect(() => {
    refreshProfiles().catch(console.error);
  }, []);

  async function handleCreateProfile() {
    setError("");
    try {
      const created = await createProfile({
        full_name: profileName,
        age: Number(profileAge),
        grade_level: "3º ano",
        language: "pt-BR"
      });
      setSelectedProfileId(created.id);
      setProfileName("");
      await refreshProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar perfil.");
    }
  }

  async function handleAnalyze() {
    setError("");
    setResult(null);

    try {
      const data = await analyzeReading({
        profile_id: selectedProfileId,
        expected_text: expectedText,
        transcript,
        duration_seconds: Number(durationSeconds),
        language: "pt-BR"
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao analisar.");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
        />
        <Pressable style={styles.button} onPress={handleAnalyze}>
          <Text style={styles.buttonText}>Analisar leitura</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {result ? (
        <View style={styles.card}>
          <Text style={styles.section}>Resultado</Text>
          <Text style={styles.text}>Precisão: {result.accuracy_score.toFixed(1)}%</Text>
          <Text style={styles.text}>PPM: {result.words_per_minute.toFixed(1)}</Text>
          <Text style={styles.text}>Nível: {result.reading_level}</Text>
          <Text style={styles.text}>{result.parent_feedback}</Text>

          <Text style={styles.section}>Exercícios</Text>
          {result.exercises.map((item: any, index: number) => (
            <Text key={index} style={styles.text}>• {item.title}: {item.target_words.join(", ")}</Text>
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
  error: {
    color: colors.danger
  }
});
