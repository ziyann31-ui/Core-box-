import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { MiniPlayer } from "@/components/MiniPlayer";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "music.note", selected: "music.note" }} />
        <Label>Library</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="downloads">
        <Icon sf={{ default: "arrow.down.circle", selected: "arrow.down.circle.fill" }} />
        <Label>Downloads</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="player">
        <Icon sf={{ default: "headphones", selected: "headphones" }} />
        <Label>Player</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: isIOS ? "transparent" : colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            elevation: 0,
            ...(isWeb ? { height: 84 } : {}),
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            ) : isWeb ? (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
            ) : null,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Library",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="music.note" tintColor={color} size={22} />
              ) : (
                <Feather name="music" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="downloads"
          options={{
            title: "Downloads",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="arrow.down.circle" tintColor={color} size={22} />
              ) : (
                <Feather name="download-cloud" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="player"
          options={{
            title: "Player",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="headphones" tintColor={color} size={22} />
              ) : (
                <Feather name="headphones" size={22} color={color} />
              ),
          }}
        />
      </Tabs>
      <MiniPlayer />
    </View>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
