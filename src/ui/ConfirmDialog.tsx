import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../theme/ThemeProvider";
import { Button } from "./Button";
import { Card } from "./Card";

type Props = {
  visible: boolean;
  title?: string;
  message?: string;
  details?: Array<{ label: string; value: string }>;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title = "Confirmar",
  message = "¿Deseas continuar?",
  details = [],
  confirmText = "Confirmar",
  cancelText = "Editar",
  onConfirm,
  onCancel,
}: Props) {
  const { theme } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={onCancel} />

      <View style={styles.center}>
        <Card style={[styles.dialog, { borderColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.colors.subText }]}>{message}</Text>

          {details.length > 0 && (
            <View style={{ marginTop: 14, gap: 8 }}>
              {details.map((d, idx) => (
                <View key={idx} style={styles.row}>
                  <Text style={[styles.label, { color: theme.colors.subText }]}>{d.label}</Text>
                  <Text style={[styles.value, { color: theme.colors.text }]} numberOfLines={1}>
                    {d.value}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ marginTop: 16, gap: 10 }}>
            <Button title={confirmText} onPress={onConfirm} />
            <Button title={cancelText} variant="ghost" onPress={onCancel} />
          </View>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  center: {
    flex: 1,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dialog: {
    width: "100%",
    maxWidth: 560,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
  },
  message: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    width: 120,
    fontSize: 12,
    fontWeight: "700",
  },
  value: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
  },
});
