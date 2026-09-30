import "@/global.css";
// Side-effect import: collapses a library-sourced Reanimated warning that
// would otherwise bury the dev console. See the module for why.
import "@/lib/quiet-reanimated-deps-warning";

import {
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import {
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_500Medium,
    Newsreader_700Bold,
    Newsreader_700Bold_Italic,
} from "@expo-google-fonts/newsreader";
import { useFonts } from "expo-font";
import * as Linking from "expo-linking";
import type { ErrorBoundaryProps } from "expo-router";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "expo-router/react-navigation";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useReducedMotion, useSharedValue } from "react-native-reanimated";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";

import { ApprovalSheet } from "@/components/approval-sheet";
import { useGuestLink } from "@/features/billing/hooks/use-guest-link";
import { usePlanSync } from "@/features/billing/hooks/use-plan-sync";
import { useJourneyWriter } from "@/hooks/use-journey-writer";
import { useAppUpdates } from "@/hooks/use-app-updates";
import { ToastProvider } from "@/components/toast/toast-provider";
import { PanelUIProvider } from "@/components/ui/panel-ui-provider";
import { runMigrations } from "@/db/migrations";
import { ThemeTokensProvider } from "@/hooks/use-theme-tokens";
import { queryClient } from "@/lib/query-client";
import { TransitionStack } from "@/navigation/stack";
import {
    drawerTransition,
    playerTransition,
    fadeTransition,
    hubTransition,
    sideTransition,
} from "@/navigation/transitions";
import { importIncomingFile } from "@/services/book-import";
import {
    startModelLifecycle,
    stopModelLifecycle,
} from "@/services/model-lifecycle";
import { reanchorLocalPaths } from "@/services/path-reanchor";
import {
    registerTTSBackgroundHandler,
    setupTTSMediaSession,
} from "@/services/tts-media-session";
import { usePodcastLifecycle } from "@/features/podcasts/hooks/use-podcast-lifecycle";
import { registerPodcastBackgroundHandler } from "@/services/podcasts/player";
import { usePodcastPrefs } from "@/stores/podcast-prefs";
import { useAccountStore } from "@/stores/account";
import { useGuestStore } from "@/stores/guest";
import { useBooksStore } from "@/stores/books";
import { useModelStore } from "@/stores/model";
import { useSettingsStore } from "@/stores/settings";
import { Uniwind, useCSSVariable } from "uniwind";

import { asColor } from "@/utils/colors";

SplashScreen.preventAutoHideAsync();

// Register Android background event handler at module level (before app renders)
registerTTSBackgroundHandler();
// Podcasts save positions and move through Up Next from the player's events,
// which on Android arrive through the same headless task while backgrounded.
registerPodcastBackgroundHandler();

// Catches throws from route module evaluation / rendering that would otherwise
// crash the app with an unhandled JS exception on startup.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 p-6">
      <Text className="text-center text-[16px]">{error.message}</Text>
      <Pressable onPress={retry} className="px-4 py-2">
        <Text className="text-[14px] font-semibold">Try again</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_500Medium,
    Newsreader_700Bold,
    Newsreader_700Bold_Italic,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  const [dbReady, setDbReady] = useState(false);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const theme = useSettingsStore((s) => s.theme);
  const [background, card, foreground, primary, scrim] = useCSSVariable([
    "--color-background",
    "--color-card",
    "--color-foreground",
    "--color-primary",
    "--color-scrim",
  ]);
  // Spatial screen motion is exactly what Reduce Motion asks us to drop, so
  // every screen cross-fades in place instead. Read here rather than per
  // screen so one switch covers the whole navigator.
  const reduceMotion = useReducedMotion();
  // The server's plan for this account, kept current here rather than by
  // whichever screen is up, so offline mode is checked as promptly as cloud.
  usePlanSync();
  useGuestLink();
  // Samwell's journal: what he writes down about them once a conversation
  // goes quiet, for him to recall in later chats.
  useJourneyWriter();
  // Over-the-air updates: checked on return as well as launch, and offered
  // with a toast once one is downloaded.
  useAppUpdates(fontsLoaded && dbReady);
  // The mini player's episode back, interrupted downloads resumed, new
  // episodes looked for on launch and on return.
  usePodcastLifecycle(dbReady);

  // The app's own theme setting is the single source of truth; Uniwind (and
  // therefore every PanelUI token class in the app) follows the OS color
  // scheme by default and knows nothing about it. Bridging here — in a layout
  // effect, before first paint — pins the whole class-driven layer to the
  // setting, and `setTheme` also forces the native `Appearance` to match so
  // platform surfaces (dialogs, sheets) agree with it. Without this, a device
  // in dark mode running the app set to light renders half-dark: class-styled
  // surfaces resolve the OS scheme while anything still themed in JS resolves
  // the setting. `setTheme('light' | 'dark')` also switches off Uniwind's
  // adaptive (follow-the-OS) mode, which is exactly the intent — the user
  // chose a side. A future 'system' setting would call `setTheme('system')`.
  // Applied synchronously, before paint. This must NOT be wrapped in
  // `startTransition`: `Uniwind.setTheme` notifies an external store, and every
  // `useCSSVariable`/`useUniwind` subscriber answers with its own `setState`.
  // Deferring that fan-out to a Transition both delays the repaint (the theme
  // visibly lagging the switch) and drops React's tearing guarantee for the
  // store — which showed up as a blank screen, and as React's own warning
  // "Detected a large number of updates inside startTransition ... concurrent
  // mode guarantees are off the table". The fan-out is the cost to attack (see
  // `hooks/use-theme-tokens`), not the scheduling.
  useLayoutEffect(() => {
    Uniwind.setTheme(theme);
  }, [theme]);

  // Free the on-device engine + image memory when the OS is under pressure or
  // the app is backgrounded — the guard against the long-session black screen.
  useEffect(() => {
    startModelLifecycle();
    return () => stopModelLifecycle();
  }, []);

  useEffect(() => {
    runMigrations()
      // Path repair and settings load both only need the migrated schema, not
      // each other — settings never touches book paths — so they overlap here
      // rather than chaining. `setDbReady` still waits for both, so nothing
      // reads a book/cover before the paths are repaired.
      .then(() =>
        Promise.all([
          reanchorLocalPaths(),
          loadSettings(),
          // Before first paint, so the Library opens on the side it was left on.
          usePodcastPrefs.getState().load(),
        ]),
      )
      .then(() => {
        setupTTSMediaSession();
        setDbReady(true);
        // Hydrate the local model list at startup — previously only the
        // Settings screen loaded it, so the chat tab's first open saw an
        // empty store and claimed Samwell wasn't set up. Fire-and-forget:
        // the store's modelsHydrated flag carries the completion signal.
        useModelStore
          .getState()
          .loadModels()
          .catch((err) => {
            console.error("Model hydration failed:", err);
          });
        // Read the account left on this device, on the same terms: fire and
        // forget, never in front of the splash. It is a local storage read,
        // and nothing that sends a request reads its result anyway (see
        // `services/account`), so there is nothing here worth waiting for.
        void useAccountStore.getState().restore();
        // And whether this device bought a plan on its own, which is the
        // other half of the same question. Also a local read, also fired and
        // forgotten, and `usePlanSync` below waits on neither: it runs again
        // the moment either one lands.
        void useGuestStore.getState().restore();
      })
      .catch((err) => {
        console.error("Startup failed:", err);
        setDbReady(true);
      });
    // `loadSettings` is a stable zustand action; listed to satisfy the lint
    // rule without changing the run-once-on-mount behaviour.
  }, [loadSettings]);

  const navTheme = useMemo(
    () => ({
      ...(theme === "light" ? DefaultTheme : DarkTheme),
      colors: {
        ...(theme === "light" ? DefaultTheme.colors : DarkTheme.colors),
        background: asColor(background)!,
        card: asColor(card)!,
        text: asColor(foreground)!,
        border: "transparent",
        primary: asColor(primary)!,
      },
    }),
    [theme, background, card, foreground, primary],
  );

  useEffect(() => {
    if (fontsLoaded && dbReady) {
      SplashScreen.setOptions({ fade: true, duration: 400 });
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady]);

  // iOS: import EPUBs opened into the app ("Open in Open Citadel", share sheet,
  // AirDrop). iOS hands us a file:// URL; copy it into the owned folder and sync.
  // Gated on dbReady so syncBooks() has a migrated database.
  useEffect(() => {
    if (process.env.EXPO_OS !== "ios" || !dbReady) return;

    const handleUrl = async (url: string | null) => {
      if (!url || !url.startsWith("file://")) return;
      const dest = await importIncomingFile(url);
      if (!dest) return;
      const store = useBooksStore.getState();
      await store.initLibrary();
      await store.syncBooks();
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [dbReady]);

  // An interpolator is a worklet and cannot read a CSS variable, so the scrim
  // it dims with is resolved here — into a shared value rather than closed over
  // as a string. Closing over the string made every transition config a
  // function of the live theme, so a theme switch rebuilt all four and the
  // navigator re-registered every screen's options in the same commit as the
  // token cascade. The worklet reads `.value` on the frame it runs instead, so
  // the configs below are built once for the life of the app.
  const scrimValue = useSharedValue("transparent");
  useEffect(() => {
    scrimValue.value = asColor(scrim) ?? "transparent";
  }, [scrim, scrimValue]);

  const screenTransitions = useMemo(() => {
    const fade = fadeTransition();
    if (reduceMotion) {
      return { hub: fade, side: fade, sideEdge: fade, drawer: fade, player: fade, fade };
    }
    return {
      hub: hubTransition({ scrim: scrimValue }),
      side: sideTransition({ side: 1, scrim: scrimValue }),
      sideEdge: sideTransition({ side: 1, scrim: scrimValue, edgeOnly: true }),
      drawer: drawerTransition({ scrim: scrimValue }),
      // The player grows out of the mini player (see `playerTransition`).
      player: playerTransition({ scrim: scrimValue }),
      // Onboarding's own, and it is a fade in both branches: the first screen
      // anyone sees has nowhere to slide in from. It belongs in this memo
      // rather than being built inline at the call site for the reason spelled
      // out above `scrimValue` — a fresh config object per render makes the
      // navigator re-register that screen's options on every theme cascade.
      fade,
    };
  }, [reduceMotion, scrimValue]);
  // Every screen stays attached while covered: see the note on the stack.
  // Memoized with the transitions, for the same reason they are.
  const stackOptions = useMemo(
    () => ({ ...screenTransitions.side, inactiveBehavior: "keep" as const }),
    [screenTransitions],
  );

  if (!fontsLoaded || !dbReady) return null;

  return (
    // The query cache is outermost: it draws nothing, and anything below may
    // read through it. ThemeTokensProvider wraps everything else, PanelUIProvider
    // included, so the portal host that sheets present into resolves its tokens
    // from the same single subscription as the rest of the tree.
    <QueryClientProvider client={queryClient}>
      <ThemeTokensProvider>
        {/* PanelUIProvider owns the gesture handler root every gesture recognizer
          in the app needs, plus PanelUI's own portal/toast host and the keyboard
          controller provider. */}
        <PanelUIProvider>
          {/* Toasts portal into PanelUIProvider's host so they draw above every
            sheet, so this has to sit inside it. */}
          <ToastProvider>
            {/* Every sheet in the app is a @gorhom/bottom-sheet modal (see
            components/ui/sheet), and they present into this provider's own
            portal host. It sits above the navigator rather than inside it, so a
            sheet is drawn over whatever screen opened it and is never clipped by
            that screen's transition. */}
            <BottomSheetModalProvider>
              <ThemeProvider value={navTheme}>
                <StatusBar style={theme === "light" ? "dark" : "light"} />
                {/* Hub and spokes. The hub is one route — Timeline, Library and
                Samwell are pages of a pager inside it (`components/hub/hub-pager`),
                because they are peers and a swipe between peers should track the
                finger rather than push a route. Everything else here is a spoke
                that rises or slides over whichever page is showing.
                `navigation/transitions` holds the choreography; these options only
                say where each screen belongs. */}
                {/* `inactiveBehavior: "keep"` for every screen. The library's
                default, `hide`, detaches and pauses a screen once it is two
                below the top, and re-attaches it when the screen above closes:
                that re-attach (layout plus every effect in the tree) landed in
                the first frames of the back slide and froze it, wherever the
                stack was three deep (Explore under a show under an episode, the
                hub under anything opened from Explore). Settings and the reader
                found it first: Settings' open measured three times its close's
                jank, and the reader's container stopped receiving its animated
                style on re-attach, sat invisible two viewports down and still
                swallowed every touch. `keep` never detaches, so there is nothing
                to re-attach. Work a covered screen would do is settle-gated
                (`useSettledOnce`), so nothing hidden runs. */}
                <TransitionStack screenOptions={stackOptions}>
                  <TransitionStack.Screen
                    name="index"
                    options={screenTransitions.hub}
                  />
                  {/* The first run. A cross-fade rather than a slide: this is the
                  first thing anyone sees and there is nowhere for it to come in
                  from. It leaves by `router.replace`, so it is never on the
                  stack behind the hub and the system Back button cannot walk
                  into it. */}
                  <TransitionStack.Screen
                    name="onboarding"
                    options={screenTransitions.fade}
                  />
                  <TransitionStack.Screen
                    name="settings"
                    options={screenTransitions.drawer}
                  />
                  {/* Edge-only: the reader turns pages with the same horizontal
                  swipe, so a screen-wide back gesture would eat every page turn. */}
                  <TransitionStack.Screen
                    name="reader/[id]"
                    options={screenTransitions.sideEdge}
                  />
                  <TransitionStack.Screen
                    name="section/[type]"
                    options={screenTransitions.drawer}
                  />
                  <TransitionStack.Screen
                    name="collection/[id]"
                    options={screenTransitions.drawer}
                  />
                  {/* Podcasts. A show and an episode are places you go into, so
                  they come in from the side like a chat. The player grows out
                  of the mini player's artwork and shrinks back into it.
                  Explore and a "View all" list rise from the bottom over
                  whatever opened them, like the books side's lists. */}
                  <TransitionStack.Screen
                    name="podcasts/show/[id]"
                    options={screenTransitions.side}
                  />
                  <TransitionStack.Screen
                    name="podcasts/episode/[id]"
                    options={screenTransitions.side}
                  />
                  <TransitionStack.Screen
                    name="podcasts/player"
                    options={screenTransitions.player}
                  />
                  <TransitionStack.Screen
                    name="podcasts/explore"
                    options={screenTransitions.drawer}
                  />
                  <TransitionStack.Screen
                    name="podcasts/section/[type]"
                    options={screenTransitions.drawer}
                  />
                  <TransitionStack.Screen
                    name="podcasts/genre/[id]"
                    options={screenTransitions.side}
                  />
                  <TransitionStack.Screen
                    name="free-books/explore"
                    options={screenTransitions.drawer}
                  />
                  <TransitionStack.Screen
                    name="free-books/shelf/[id]"
                    options={screenTransitions.side}
                  />
                  <TransitionStack.Screen
                    name="free-books/book/[id]"
                    options={screenTransitions.side}
                  />
                  {/* Blogs, laid out as podcasts are: a blog is a place you go
                  into, from the side; Explore and a "View all" rise from the
                  bottom. A post opens in the reader, like a book. */}
                  <TransitionStack.Screen
                    name="blogs/blog/[id]"
                    options={screenTransitions.side}
                  />
                  <TransitionStack.Screen
                    name="blogs/explore"
                    options={screenTransitions.drawer}
                  />
                  <TransitionStack.Screen
                    name="blogs/section/[type]"
                    options={screenTransitions.drawer}
                  />
                </TransitionStack>
                <ApprovalSheet />
              </ThemeProvider>
            </BottomSheetModalProvider>
          </ToastProvider>
        </PanelUIProvider>
      </ThemeTokensProvider>
    </QueryClientProvider>
  );
}
