import React from "react";
import { Platform, View } from "react-native";

type KeptAliveProps = {
  /** This is the panel on screen. */
  active: boolean;
  /**
   * Build this panel while it is still hidden, so the press that shows it
   * only has to reveal it. False while something is animating: a hidden
   * panel is still mounted, and its mount would land mid-slide.
   */
  warm?: boolean;
  /** Keep its view laid out while another layer hides it (a page transition). */
  visible?: boolean;
  /** For the view the panel is kept in, which stands where its children did. */
  className?: string;
  children: React.ReactNode;
};

// iOS never mounts `display: none` views, so gestures built inside would never attach.
const HIDDEN =
  Platform.OS === "ios"
    ? ({
        position: "absolute",
        left: 0,
        right: 0,
        opacity: 0,
        pointerEvents: "none",
      } as const)
    : ({ display: "none" } as const);

/** Whether the panel this is drawn in is the one on screen. True outside any. */
const OnScreenContext = React.createContext(true);

/**
 * For work that should stop when its panel is put away rather than removed: a
 * voice sample playing, a balance being polled. A kept panel's effects go on
 * running while it is hidden, so nothing stops by itself.
 */
export function useOnScreen(): boolean {
  return React.useContext(OnScreenContext);
}

/**
 * One of several panels that take turns in the same place: the list of
 * Settings and each pane under it, the on-device and cloud halves of
 * Samwell's, one voice engine's carousel or the other's.
 *
 * Swapping such panels by unmounting one and mounting the other made every
 * switch pay for a mount, which on a Galaxy A33 was most of a second for a
 * page of controls: the press sat unanswered while it was built. It also threw
 * away where the reader had been, so the plans opened on their placeholder
 * every time. Here a panel that has been drawn once stays, laid out as nothing
 * while it is not showing, and showing it again is one style changing.
 *
 * `warm` builds a panel before it is first asked for, as work React can put
 * down for a press (a deferred value), so the wait is paid while the reader
 * is looking at something else.
 *
 * A panel appears in place, with no entrance. One was tried (a short fade and
 * slide) and on a Galaxy A33 the frame that first draws a revealed panel took
 * about as long as the fade, so it showed as a few blank frames and then the
 * panel: worse than nothing.
 *
 * Hidden by style rather than by React's `Activity`: that pauses a hidden
 * panel's effects and runs them all again when it is shown, and with a
 * hundred animated views in a pane that was measured at a third to two thirds
 * of a second, most of what mounting it cost in the first place.
 */
export function KeptAlive({
  active,
  warm = false,
  visible = false,
  className,
  children,
}: KeptAliveProps) {
  const warmed = React.useDeferredValue(warm, false);
  const wanted = active || warmed;
  // Latched: once built, a panel stays for as long as its screen does.
  const [built, setBuilt] = React.useState(wanted);
  if (wanted && !built) setBuilt(true);
  const onScreen = useOnScreen() && active;

  if (!built && !wanted) return null;

  return (
    <OnScreenContext.Provider value={onScreen}>
      <View
        className={className}
        style={active || visible ? undefined : HIDDEN}
        accessibilityElementsHidden={!active}
        importantForAccessibility={active ? "auto" : "no-hide-descendants"}
      >
        {children}
      </View>
    </OnScreenContext.Provider>
  );
}
