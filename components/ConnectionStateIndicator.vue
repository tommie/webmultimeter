<script setup lang="ts">
import {
  type UM25CConnection,
  type UM25CEvent,
  UM25CProtocol,
} from "../utils/um25c";

const props = defineProps<{
  conn: UM25CConnection;
}>();

enum ConnState {
  UNKNOWN = 0,
  UNCONNECTED = 1,
  CONNECTING = 2,
  IDLE = 3,
  RECEIVING = 4,
  FAILED = 5,
}

const connState = ref<ConnState>(ConnState.UNCONNECTED);

function getConnState(conn: UM25CConnection) {
  if (conn.failed) return ConnState.FAILED;
  if (conn.receiving) return ConnState.RECEIVING;
  return ConnState.IDLE;
}

function onConn(e: UM25CEvent) {
  if (!props.conn) {
    connState.value = ConnState.UNCONNECTED;
    return;
  }

  connState.value = getConnState(props.conn);
}

onUnmounted(() => {
  if (!props.conn) return;

  props.conn.removeEventListener("error", onConn);
  props.conn.removeEventListener("receiving", onConn);
});

watch(
  () => props.conn,
  async (conn, oldConn) => {
    if (oldConn) {
      oldConn.removeEventListener("error", onConn);
      oldConn.removeEventListener("receiving", onConn);
    }

    connState.value = getConnState(conn);

    if (!conn) return;

    conn.addEventListener("receiving", onConn);
    conn.addEventListener("error", onConn);
  },
  { immediate: true },
);

function badgeClass(state: ConnState) {
  switch (state) {
    case ConnState.UNCONNECTED:
      return "bg-transparent";
    case ConnState.CONNECTING:
      return "bg-teal-300";
    case ConnState.IDLE:
      return "bg-teal-900";
    case ConnState.RECEIVING:
      return "bg-teal-300 glow";
    case ConnState.FAILED:
      return "bg-red-400 glow";
    default:
      return "";
  }
}
</script>

<template>
  <div>
    <div :class="['round', badgeClass(connState)]">&nbsp;</div>
  </div>
</template>

<style scoped>
.round {
  border-radius: 50%;
  height: 0.25rem;
  width: 0.25rem;
}

.glow {
  box-shadow: 0 0 8px var(--surface-800);
}
</style>
