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
    <div v-else>
      <ol>
        <li v-for="(port, index) in serialPorts" :key="index">
          {{ port.getInfo() }}
          <button @click="() => onClickOpen(port)" :disabled="connecting">
            Open
          </button>
        </li>
      </ol>
      <button @click="onClickOpenOther" :disabled="connecting">
        Open Other
      </button>

      <div>
        <span v-if="connecting">Connecting</span>
        <span v-else-if="error">Connection failed: {{ error.toString() }}</span>
      </div>
    </div>
  </div>
</template>
