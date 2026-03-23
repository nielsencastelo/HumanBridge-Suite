import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, Pressable, Text } from "react-native";
import { useRouter } from "expo-router";

function SettingsIcon() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push("/settings")}
      style={{ marginRight: 4, paddingHorizontal: 10, paddingVertical: 4 }}
    >
      <Text style={{ color: "#54c2ff", fontSize: 22 }}>⚙</Text>
    </Pressable>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#08111f" },
          headerTintColor: "#e8eef7",
          contentStyle: { backgroundColor: "#08111f" },
          headerShadowVisible: false,
          headerRight: () => <SettingsIcon />,
        }}
      >
        <Stack.Screen name="index" options={{ title: "HumanBridge" }} />
        <Stack.Screen name="translator" options={{ title: "BridgeForm" }} />
        <Stack.Screen name="readbuddy" options={{ title: "ReadBuddy" }} />
        <Stack.Screen
          name="settings"
          options={{ title: "Configurações", headerRight: () => null }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#08111f",
  },
});


