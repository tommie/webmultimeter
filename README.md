# Web Multimeter - Web Interface for RuiDeng UM-25C

This is a web frontend that doesn't require Python to run; it uses Web
Serial API to connect directly to the Bluetooth device.

This is a quick hack. It probably leaks memory, and it uses
Local Storage where it should use IndexedDB.

![Screenshot](./docs/media/screenshot.webm.mov)

## Building

The project uses [Vue](https://vuejs.org), [Nuxt](https://nuxt.com), [PrimeVue](https://primevue.org) and [D3](https://d3js.org).
(Using Nuxt is overkill, but is practical for auto-imports for prototyping.)

### Setup

Make sure to install the dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

### Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm run dev

# yarn
yarn dev

# bun
bun run dev
```

### Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm run build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm run preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## See Also

- https://sourceforge.net/projects/ruidengmeter a Qt application.
- https://github.com/sebastianha/um34c for the reverse-engineered protocol (and Python web UI).
- https://github.com/kolinger/rd-usb for another Python web UI.
- https://github.com/smandon/rdumtool for a command line interface.
- https://joy-it.net/files/files/Produkte/JT-UM25C/JT-UM25C_Manual_2021-07-06.pdf the UM25C manual.
- https://play.google.com/store/apps/details?id=com.ruidenggoogle.bluetooth&gl=US the official Ruideng UM Android app.
- https://apkpure.com/um-meter/com.ruideng.um34c, probably an older version of the app; no longer updated.
