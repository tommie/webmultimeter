interface SerialPortFilter {
  bluetoothServiceClassId?: string;
}

interface SerialPortInfo {
  bluetoothServiceClassId?: string;
}

interface ArrayBufferConstructor {
  new (byteLength: number, options: { maxByteLength?: number }): ArrayBuffer;
}

interface ArrayBuffer {
  resize(byteLength: number): void;
}

interface SharedArrayBuffer {
  resize(byteLength: number): void;
}
