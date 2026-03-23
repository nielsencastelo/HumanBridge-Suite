/**
 * settings.tsx  –  Tela de configurações de IA e servidor
 */
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  ActivityIndicator,
  Switch,
  useWindowDimensions,
} from "react-native";
import {
  AiCredentials,
  AiProvider,
  PROVIDER_DEFAULTS,
  clearCredentials,
  loadApiBaseUrl,
  loadCredentials,
  saveApiBaseUrl,
  saveCredentials,
} from "@/src/services/aiCredentials";
import { validateAiCredentials } from "@/src/services/api";
import { colors } from "@/src/theme";

const PROVIDERS = Object.entries(PROVIDER_DEFAULTS) as [
  AiProvider,
  (typeof PROVIDER_DEFAULTS)[AiProvider]
][];

export default function SettingsScreen() {
  const { width } = useWindowDimensions();
  // 2 colunas em telas >= 360px, 1 coluna em telas menores
  const numCols = width >= 360 ? 2 : 1;
  const chipWidth = (width - 36 - 16 - (numCols - 1) * 8) / numCols;

  // ─── Server URL ──────────────────────────────────────────────────────────
  const [apiBaseUrl, setApiBaseUrl] = useState("");

  // ─── AI Provider ─────────────────────────────────────────────────────────
  const [provider, setProvider] = useState<AiProvider>("openai");
  const [baseUrl, setBaseUrl] = useState(PROVIDER_DEFAULTS.openai.baseUrl);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(PROVIDER_DEFAULTS.openai.modelPlaceholder);
  const [showToken, setShowToken] = useState(false);

  // ─── Status ───────────────────────────────────────────────────────────────
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  // ─── Load persisted values ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const savedUrl = await loadApiBaseUrl();
      if (savedUrl) setApiBaseUrl(savedUrl);

      const creds = await loadCredentials();
      if (creds) {
        setProvider(creds.provider);
        setBaseUrl(creds.baseUrl);
        setApiKey(creds.apiKey);
        setModel(creds.model);
      }
      setLoaded(true);
    })();
  }, []);

  function handleProviderChange(p: AiProvider) {
    setProvider(p);
    const def = PROVIDER_DEFAULTS[p];
    setBaseUrl(def.baseUrl);
    setModel(def.modelPlaceholder);
    setStatusMsg(null);
  }

  async function handleValidate() {
    if (!baseUrl || !model) {
      setStatusMsg({ ok: false, text: "Preencha URL base e modelo." });
      return;
    }
    setValidating(true);
    setStatusMsg(null);
    try {
      const result = await validateAiCredentials({
        provider,
        base_url: baseUrl,
        api_key: apiKey,
        model,
      });
      setStatusMsg({ ok: result.ok, text: result.message });
    } catch (e) {
      setStatusMsg({ ok: false, text: e instanceof Error ? e.message : "Erro ao validar." });
    } finally {
      setValidating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setStatusMsg(null);
    try {
      if (apiBaseUrl.trim()) await saveApiBaseUrl(apiBaseUrl.trim());
      const creds: AiCredentials = {
        provider,
        baseUrl,
        apiKey,
        model,
        label: PROVIDER_DEFAULTS[provider].label,
      };
      await saveCredentials(creds);
      setStatusMsg({ ok: true, text: "Configurações salvas no dispositivo!" });
    } catch {
      setStatusMsg({ ok: false, text: "Falha ao salvar." });
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    await clearCredentials();
    setApiKey("");
    setModel(PROVIDER_DEFAULTS[provider].modelPlaceholder);
    setBaseUrl(PROVIDER_DEFAULTS[provider].baseUrl);
    setStatusMsg({ ok: true, text: "Credenciais removidas." });
  }

  if (!loaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const def = PROVIDER_DEFAULTS[provider];
  const isEditableUrl =
    provider === "custom" || provider === "ollama" || provider === "lmstudio";

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.pageTitle}>Configurações</Text>

      {/* ── Servidor ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌐 Servidor da API</Text>
        <Text style={styles.label}>URL base da API</Text>
        <TextInput
          style={styles.input}
          value={apiBaseUrl}
          onChangeText={setApiBaseUrl}
          placeholder="https://meuservidor.com/api/v1"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="url"
        />
        <Text style={styles.hint}>
          Deixe em branco para usar o padrão definido no app.
        </Text>
      </View>

      {/* ── Provedor de IA ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🤖 Provedor de IA</Text>
        <Text style={styles.label}>Selecione o provedor</Text>

        {/* Grid de 2 colunas — nome completo sempre visível */}
        <View style={styles.providerGrid}>
          {PROVIDERS.map(([key, info]) => {
            const isActive = provider === key;
            return (
              <Pressable
                key={key}
                style={[
                  styles.providerChip,
                  { width: chipWidth },
                  isActive && styles.providerChipActive,
                ]}
                onPress={() => handleProviderChange(key)}
              >
                <Text
                  style={[
                    styles.providerChipText,
                    isActive && styles.providerChipTextActive,
                  ]}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {info.label}
                </Text>
                {isActive && (
                  <View style={styles.activeDot} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* URL base */}
        <Text style={[styles.label, { marginTop: 12 }]}>URL base</Text>
        <TextInput
          style={[styles.input, !isEditableUrl && styles.inputDisabled]}
          value={baseUrl}
          onChangeText={setBaseUrl}
          placeholder={def.baseUrl || "https://api.example.com/v1"}
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="url"
          editable={isEditableUrl}
        />

        {/* Modelo */}
        <Text style={styles.label}>Modelo</Text>
        <TextInput
          style={styles.input}
          value={model}
          onChangeText={setModel}
          placeholder={def.modelPlaceholder}
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
        />

        {/* Token */}
        {def.requiresKey && (
          <>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Token / API Key</Text>
              <View style={styles.toggleRow}>
                <Text style={styles.hint}>Mostrar  </Text>
                <Switch
                  value={showToken}
                  onValueChange={setShowToken}
                  thumbColor={colors.accent}
                  trackColor={{ false: colors.line, true: colors.accent + "55" }}
                />
              </View>
            </View>
            <TextInput
              style={styles.input}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Cole aqui sua chave de API..."
              placeholderTextColor={colors.muted}
              secureTextEntry={!showToken}
              autoCapitalize="none"
            />
            <Text style={styles.hint}>
              O token é armazenado apenas neste dispositivo e nunca enviado a terceiros.
            </Text>
          </>
        )}
      </View>

      {/* ── Status ── */}
      {statusMsg && (
        <View
          style={[
            styles.statusBox,
            { borderColor: statusMsg.ok ? colors.success : colors.danger },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: statusMsg.ok ? colors.success : colors.danger },
            ]}
          >
            {statusMsg.ok ? "✓  " : "✗  "}
            {statusMsg.text}
          </Text>
        </View>
      )}

      {/* ── Ações ── */}
      <Pressable
        style={[styles.button, styles.buttonOutline]}
        onPress={handleValidate}
        disabled={validating}
      >
        {validating ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <Text style={[styles.buttonText, { color: colors.accent }]}>
            Testar conexão com a IA
          </Text>
        )}
      </Pressable>

      <Pressable
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#06101d" />
        ) : (
          <Text style={styles.buttonText}>Salvar configurações</Text>
        )}
      </Pressable>

      <Pressable style={styles.buttonDanger} onPress={handleClear}>
        <Text style={[styles.buttonText, { color: colors.danger }]}>
          Remover credenciais salvas
        </Text>
      </Pressable>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  container: {
    backgroundColor: colors.bg,
    padding: 18,
    gap: 14,
  },
  pageTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700",
    marginTop: 4,
  },
  section: {
    backgroundColor: colors.panel,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    color: colors.accent2,
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 4,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#0b1626",
    color: colors.text,
    padding: 12,
    fontSize: 14,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  hint: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },

  /* ── Provider grid ── */
  providerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  providerChip: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: "#0b1626",
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    position: "relative",
  },
  providerChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + "18",
  },
  providerChipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  providerChipTextActive: {
    color: colors.accent,
    fontWeight: "700",
  },
  activeDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },

  /* ── Buttons ── */
  statusBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  buttonDanger: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.danger + "66",
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#06101d",
    fontWeight: "700",
    fontSize: 15,
  },
});
