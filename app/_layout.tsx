import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, Text, ActivityIndicator } from "react-native";
import { ThemeProvider } from "@/store/themeStore";
import { DataUpdateProvider } from "@/store/dataUpdateContext";
import { useDatabaseInitialization } from "@/services/databaseInit";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ presentation: "modal" }} />
      <Stack.Screen name="allocation" options={{ presentation: "modal" }} />
      <Stack.Screen name="categories" options={{ presentation: "modal" }} />
      <Stack.Screen name="expense-details" />
    </Stack>
  );
}

export default function RootLayout() {
  const { isLoading, error } = useDatabaseInitialization();

  useEffect(() => {
    if (!isLoading && !error) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, error]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>Initializing Database...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 20 }}>
        <Text style={{ fontSize: 18, color: '#FF6B6B', textAlign: 'center', marginBottom: 16 }}>Database Error</Text>
        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DataUpdateProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </DataUpdateProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}