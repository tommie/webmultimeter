export namespace UM25CProtocol {
  export function buildSelectGroup(n: number) {
    if (n < 0 || n > 9) throw new Error(`Group index out of bounds: ${n}`);
    return Uint8Array.of(0xa0 + n);
  }

  export function buildSetRecordCurrentThreshold(mA: number) {
    if (mA < 0 || mA > 31) throw new Error(`Record index out of bounds: ${mA}`);
    return Uint8Array.of(0xb0 + Math.floor(mA));
  }

  export function buildSetScreenBrightness(n: number) {
    if (n < 0 || n > 5) throw new Error(`Brightness out of bounds: ${n}`);
    return Uint8Array.of(0xd0 + n);
  }

  export function buildSetScreenBlankTimeout(minutes: number) {
    if (minutes < 0 || minutes > 9)
      throw new Error(`Screen blank timeout out of bounds: ${minutes}`);
    return Uint8Array.of(0xe0 + minutes);
  }

  export function buildClickButton(btn: UM25CProtocol.Button) {
    return Uint8Array.of(0xf0 + btn);
  }

  const GROUP_PLACEHOLDERS = new Array(10).fill(undefined);

  export function parseResponseData(view: DataView) {
    const rawValues = {
      voltage: view.getUint16(2, false),
      current: view.getUint16(4, false),
      power: view.getUint32(6, false),
      temperatureC: view.getUint16(10, false),
      temperatureF: view.getUint16(12, false),
      groups: GROUP_PLACEHOLDERS.map((_, i) => ({
        charge: view.getUint32(16 + 8 * i, false),
        energy: view.getUint32(20 + 8 * i, false),
      })),
      dataPlusVoltage: view.getUint16(96, false),
      dataMinusVoltage: view.getUint16(98, false),
      screenTimeout: view.getUint16(118, false),
      resistance: view.getUint32(122, false),
      recording: {
        charge: view.getUint32(102, false),
        energy: view.getUint32(106, false),
        currentThreshold: view.getUint16(110, false),
        runtime: view.getUint32(112, false),
      },
    } satisfies UM25CProtocol.RawDataPoint;

    const deviceModel = view.getUint16(0, false) as UM25CProtocol.DeviceModel;
    const voltageDivisor =
      deviceModel === UM25CProtocol.DeviceModel.UM25C ? 1000 : 100;
    const currentDivisor =
      deviceModel === UM25CProtocol.DeviceModel.UM25C ? 10000 : 1000;

    return {
      deviceModel,
      voltage: rawValues.voltage / voltageDivisor,
      current: rawValues.current / currentDivisor,
      power: rawValues.power / 1000,
      temperature: {
        celsius: rawValues.temperatureC,
        fahrenheit: rawValues.temperatureF,
      },
      groups: rawValues.groups.map((group) => ({
        charge: group.charge / 1000 / 3600, // In C.
        energy: group.energy / 1000 / 3600, // In J.
      })),
      dataLines: {
        plusVoltage: rawValues.dataPlusVoltage / 100,
        minusVoltage: rawValues.dataMinusVoltage / 100,
      },
      chargeMode: view.getUint16(100, false) as UM25CProtocol.ChargeMode,
      screen: {
        group: view.getUint16(14, false) & 0xff,
        timeout: rawValues.screenTimeout * 60000,
        brightness: view.getUint16(120, false),
        pageIndex: view.getUint16(126, false),
      },
      resistance: rawValues.resistance / 10,

      recording: {
        charge: rawValues.recording.charge / 1000 / 3600,
        energy: rawValues.recording.energy / 1000 / 3600,
        currentThreshold: rawValues.recording.currentThreshold / 100,
        runtime: rawValues.recording.runtime * 1000,
        enabled: Boolean(view.getUint16(116, false)),
      },

      rawValues,
      rawData: view.buffer,
    } satisfies UM25CProtocol.DataPoint;
  }

  export interface RawGroupDataPoint {
    charge: number; // mAh
    energy: number; // mWh
  }

  export interface RawDataPoint {
    voltage: number; // mV or 10 mV
    current: number; // 0.1 mA or 1 mA
    power: number; // mW
    temperatureC: number;
    temperatureF: number;
    groups: RawGroupDataPoint[];
    dataPlusVoltage: number; // 10 mV
    dataMinusVoltage: number; // 10 mV
    screenTimeout: number; // minutes
    resistance: number; // 100 mOhm
    recording: {
      charge: number; // C
      energy: number; // J
      currentThreshold: number; // 10 mA
      runtime: number; // milliseconds
    };
  }

  // In SI base units: C and J.
  export type GroupDataPoint = RawGroupDataPoint;

  export interface DataPoint {
    deviceModel: DeviceModel;
    voltage: number;
    current: number;
    power: number;
    temperature: {
      celsius: number;
      fahrenheit: number;
    };
    groups: GroupDataPoint[];
    dataLines: {
      plusVoltage: number;
      minusVoltage: number;
    };
    chargeMode: ChargeMode;
    screen: {
      group: number; // [0, 9]
      timeout: number; // milliseconds
      brightness: number; // [0, 5]
      pageIndex: number;
    };
    resistance: number;
    recording: {
      charge: number; // C
      energy: number; // J
      currentThreshold: number;
      runtime: number; // milliseconds
      enabled: boolean;
    };

    rawValues: RawDataPoint;
    rawData: ArrayBuffer;
  }

  export enum DeviceModel {
    UNKNOWN = 0,
    UM24C = 2403,
    UM25C = 2505,
    UM34C = 3404,
  }

  export enum ChargeMode {
    UNKNOWN = 0,
    QC2_0 = 1,
    QC3_0 = 2,
    APPLE_2_4A = 3,
    APPLE_2_1A = 4,
    APPLE_1_0A = 5,
    APPLE_0_5A = 6,
    ANDROID_DCP_1_5A = 7,
    SAMSUNG = 8,
  }

  export enum Button {
    UNKNOWN = 0,
    NEXT = 1,
    ROTATE = 2,
    PREV = 3,
    RESET_GROUP = 4,
  }
}

export class UM25CEvent extends Event {
  public error?: Error;
  public receiving?: boolean;

  constructor(name: "close", conn: UM25CConnection, fields: {});
  constructor(name: "error", conn: UM25CConnection, fields: { error: Error });
  constructor(
    name: "receiving",
    conn: UM25CConnection,
    fields: { receiving: boolean },
  );
  constructor(
    name: string,
    public conn: UM25CConnection,
    fields: { error?: Error; receiving?: boolean },
    eventInitDict?: EventInit,
  ) {
    super(name, eventInitDict);
    Object.assign(this, fields);
  }
}

type EventName = "close" | "error" | "receiving";

interface UM25CEventTarget {
  dispatchEvent(e: UM25CEvent): void;

  addEventListener(
    e: EventName,
    callback: (e: UM25CEvent) => void,
    options?: boolean | EventListenerOptions,
  ): void;
  addEventListener(
    e: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void;

  removeEventListener(
    e: EventName,
    callback: (e: UM25CEvent) => void,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    e: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void;
}

const UM25CEventTarget = EventTarget as { new (): UM25CEventTarget };

export class UM25CConnection extends UM25CEventTarget {
  public static readonly SERIAL_FILTERS: SerialPortFilter[] = [
    { bluetoothServiceClassId: "00001101-0000-1000-8000-00805f9b34fb" },
  ];

  private readonly reader: ReadableStreamDefaultReader;
  private readonly writer: WritableStreamDefaultWriter;
  private readonly dataAcceptors: [
    (data: Uint8Array) => [number, boolean],
    number,
  ][] = [];
  private failure_: Error | undefined;

  constructor(
    private readonly port: SerialPort,
    private readonly options = { readTimeout: 800 },
  ) {
    super();

    if (!port.readable || !port.writable) {
      throw new Error("The serial port object is not open");
    }

    this.reader = port.readable.getReader();
    this.writer = port.writable.getWriter();

    this.runRead().catch((e) => {
      this.failure_ = e;
      this.dispatchEvent(new UM25CEvent("error", this, { error: e }));
    });
  }

  public async close() {
    await this.writer.close();
    await this.reader.cancel();
    await this.port.close();

    this.dispatchEvent(new UM25CEvent("close", this, {}));
  }

  public get failed() {
    return Boolean(this.failure_);
  }

  public get receiving() {
    return this.dataAcceptors.length > 0;
  }

  public async selectGroup(n: number) {
    await this.sendCommand(UM25CProtocol.buildSelectGroup(n));
  }

  public async setRecordCurrentThreshold(mA: number) {
    await this.sendCommand(UM25CProtocol.buildSetRecordCurrentThreshold(mA));
  }

  public async setScreenBrightness(n: number) {
    await this.sendCommand(UM25CProtocol.buildSetScreenBrightness(n));
  }

  public async setScreenBlankTimeout(ms: number) {
    await this.sendCommand(
      UM25CProtocol.buildSetScreenBlankTimeout(Math.round(ms / 60000)),
    );
  }

  public async clickButton(btn: UM25CProtocol.Button) {
    await this.sendCommand(UM25CProtocol.buildClickButton(btn));
  }

  public async readData(): Promise<UM25CConnection.TimestampedDataPoint> {
    await this.sendCommand(Uint8Array.of(0xf0));

    return {
      timestamp: new Date().getTime(),
      ...UM25CProtocol.parseResponseData(
        new DataView((await this.receiveResponse(130)).buffer),
      ),
    };
  }

  protected async sendCommand(cmd: Uint8Array) {
    if (this.failure_) throw this.failure_;

    await this.writer.write(cmd);
  }

  protected async receiveResponse(numBytes: number) {
    return new Promise<Uint8Array>(async (resolve, reject) => {
      let timeout: ReturnType<typeof setTimeout> | undefined;

      const acceptor = [
        (data: Uint8Array) => {
          try {
            if (this.failure_) throw this.failure_;

            resolve(data);

            return [data.byteLength, true];
          } catch (e) {
            reject(e);

            return [0, true];
          } finally {
            if (timeout) {
              clearTimeout(timeout);
              timeout = undefined;
            }
          }
        },
        numBytes,
      ] satisfies [(data: Uint8Array) => [number, boolean], number];

      timeout = setTimeout(() => {
        timeout = undefined;

        const i = this.dataAcceptors.indexOf(acceptor);
        if (i >= 0) {
          this.deleteAcceptor(i);
          reject(new Error("Read timed out"));
        }
      }, this.options.readTimeout);

      this.pushAcceptor(acceptor);
    });
  }

  protected async runRead() {
    const MAX_BUF_LENGTH = 1 << 20;
    const buf = new Uint8Array(
      new ArrayBuffer(0, { maxByteLength: MAX_BUF_LENGTH }),
    );
    let n = 0;
    let frontHasAccepted = false;

    for (;;) {
      const { value, done } = await this.reader.read();
      if (done) {
        this.failure_ = new DOMException("Connection closed", "AbortError");
        while (this.dataAcceptors.length > 0) {
          this.dataAcceptors[0][0](new Uint8Array());
          this.deleteAcceptor(0);
        }
        break;
      }

      buf.buffer.resize(n + value.byteLength);
      buf.set(value, n);
      n += value.byteLength;

      if (n > MAX_BUF_LENGTH) {
        throw new Error("Too much unhandled data received: read loop bailing");
      }

      while (this.dataAcceptors.length > 0 && n > 0) {
        const [fn, minBytes] = this.dataAcceptors[0];
        if (!frontHasAccepted && n < minBytes) break;

        const [naccepted, fulfilled] = fn(buf.slice(0, n));

        if (naccepted < n || fulfilled) {
          this.deleteAcceptor(0);
          frontHasAccepted = false;
        } else {
          frontHasAccepted = true;
        }

        buf.copyWithin(0, naccepted);
        n -= naccepted;
      }
    }
  }

  private pushAcceptor(acceptor: UM25CConnection["dataAcceptors"][0]) {
    this.dataAcceptors.push(acceptor);
    if (this.dataAcceptors.length === 1) {
      this.dispatchEvent(
        new UM25CEvent("receiving", this, { receiving: true }),
      );
    }
  }

  private deleteAcceptor(index: number) {
    this.dataAcceptors.splice(index, 1);
    if (this.dataAcceptors.length === 0) {
      this.dispatchEvent(
        new UM25CEvent("receiving", this, { receiving: false }),
      );
    }
  }
}

export namespace UM25CConnection {
  export interface TimestampedDataPoint extends UM25CProtocol.DataPoint {
    timestamp: number; // milliseconds
  }
}
