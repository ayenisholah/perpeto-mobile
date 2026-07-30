import type { PropsWithChildren } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { radius, space, useReduceMotion, useTheme } from "@/theme";

import { IconButton } from "./Button";
import { Text } from "./Text";

interface BottomSheetProps extends PropsWithChildren {
  readonly visible: boolean;
  readonly title: string;
  readonly onClose: () => void;
}

/**
 * Phones stack cards and use bottom sheets (section 12.1). Detail views,
 * filters and step-up prompts all present through this so they share dismissal
 * behaviour: tapping the scrim or the close control, and the hardware back
 * gesture on Android.
 */
export function BottomSheet({ children, visible, title, onClose }: BottomSheetProps) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();

  return (
    <Modal
      animationType={reduceMotion ? "none" : "slide"}
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityLabel="Dismiss"
        accessibilityRole="button"
        onPress={onClose}
        style={[styles.scrim, { backgroundColor: theme.overlay }]}
      />
      <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.header}>
          <Text style={styles.title} variant="heading">
            {title}
          </Text>
          <IconButton label="Close" name="close" onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    left: 0,
    maxHeight: "88%",
    position: "absolute",
    right: 0,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.xs,
    paddingLeft: space.md,
    paddingRight: space.xs,
    paddingTop: space.sm,
  },
  title: {
    flex: 1,
  },
  content: {
    gap: space.sm,
    paddingBottom: space.xl,
    paddingHorizontal: space.md,
    paddingTop: space.xs,
  },
});
