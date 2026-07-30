import { useCallback, useState, type PropsWithChildren } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import { space, useTheme } from "@/theme";

import { Text } from "./Text";

interface ScreenProps extends PropsWithChildren {
  readonly title?: string;
  /** One sentence on what the surface is for. Plain language, not marketing. */
  readonly subtitle?: string;
  readonly onRefresh?: () => void | Promise<void>;
}

/**
 * Scrolling content container for a tab or detail route. Pull-to-refresh is
 * wired here rather than per screen so every surface that can reload gets the
 * gesture — the build this replaces offered a small "Refresh" text link on two
 * screens and nothing anywhere else.
 */
export function Screen({ children, title, subtitle, onRefresh }: ScreenProps) {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(() => {
    if (onRefresh === undefined) return;
    setRefreshing(true);
    void (async () => {
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    })();
  }, [onRefresh]);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh === undefined ? undefined : (
          <RefreshControl onRefresh={refresh} refreshing={refreshing} tintColor={theme.textSecondary} />
        )
      }
      style={{ backgroundColor: theme.background }}
    >
      {title === undefined ? null : (
        <View style={styles.heading}>
          <Text variant="display">{title}</Text>
          {subtitle === undefined ? null : <Text variant="body" tone="textSecondary">{subtitle}</Text>}
        </View>
      )}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: space.md,
    paddingBottom: space.xxl,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
  },
  heading: {
    gap: space.xs,
  },
});
