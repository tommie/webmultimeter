<script setup lang="ts">
import { UM25CConnection } from "../utils/um25c";

const emit = defineEmits<{
  (e: "connecting", port: SerialPort): void;
  (e: "connected", conn: UM25CConnection): void;
  (e: "error", err: Error): void;
}>();

const available = ref<boolean>();
const serialPorts = shallowReactive<SerialPort[]>([]);
let autoConnectRequested = false;
onMounted(async () => {
  available.value = "serial" in navigator;

  if (!available.value) return;

  serialPorts.splice(0, 0, ...(await navigator.serial.getPorts()));

  if (autoConnectRequested) {
    autoConnect();
  }
});

async function autoConnect() {
  if (serialPorts.length === 0) {
    autoConnectRequested = true;
    return;
  }

  if (serialPorts.length === 1) {
    await connect(serialPorts[0]);
  }
  autoConnectRequested = false;
}

const connecting = ref(false);
const error = ref<Error>();
async function connect(port: SerialPort) {
  if (connecting.value) return;

  connecting.value = true;

  try {
    emit("connecting", port);

    if (!port.readable) {
      await port.open({ baudRate: 115200 });
    }

    emit("connected", new UM25CConnection(port));
    error.value = undefined;
  } catch (e) {
    emit("error", e as Error);
    error.value = e as Error;
  } finally {
    connecting.value = false;
  }
}

async function onClickOpen(port: SerialPort) {
  await connect(port);
}

async function onClickOpenOther() {
  try {
    const port = await navigator.serial.requestPort({
      filters: UM25CConnection.SERIAL_FILTERS,
    });
    if (!serialPorts.includes(port)) serialPorts.push(port);
    await connect(port);
  } catch (e) {
    if (e instanceof DOMException && e.name === "NotFoundError") {
      return;
    }

    throw e;
  }
}

function portDescription(port: SerialPort) {
  const info = port.getInfo();

  if (info.bluetoothServiceClassId) {
    const m = /0000(.{4})-0000-1000-8000-00805f9b34fb/i.exec(
      info.bluetoothServiceClassId,
    );
    if (m) {
      switch (m[1]) {
        case "1101":
          return "A Bluetooth device, serial port";

        default:
          return `A Bluetooth device, class ${m[1]}`;
      }
    }

    return `A Bluetooth device, class ${info.bluetoothServiceClassId}`;
  }

  if (info.usbVendorId && info.usbProductId) {
    return `A USB device, ${info.usbVendorId}:${info.usbProductId}`;
  }

  return "An unknown device";
}

defineExpose({
  // Attempt to auto-connect, if that is a reasonable thing to do.
  autoConnect,
});
</script>

<template>
  <div>
    <div v-if="available === undefined">
      Checking for Web Serial API&hellip;
    </div>
    <div v-else-if="!available">
      Web Serial API not available in this browser
    </div>
    <div v-else class="flex flex-column align-items-center">
      <div v-for="(port, index) in serialPorts" :key="index">
        <Button
          class="w-full"
          :disabled="connecting"
          :label="portDescription(port)"
          :title="JSON.stringify(port.getInfo())"
          @click="() => onClickOpen(port)"
        />
      </div>

      <Button
        class="mt-4"
        severity="secondary"
        :disabled="connecting"
        label="Open Other"
        @click="onClickOpenOther"
      />

      <div>
        <span v-if="connecting">Connecting</span>
        <span v-else-if="error">Connection failed: {{ error.toString() }}</span>
      </div>
    </div>
  </div>
</template>
