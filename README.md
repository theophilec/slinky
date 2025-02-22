# Slinky - send newsletters with the right links, all the links and nothing but those links !

<img src="slinky.webp" alt="Slinky logo generated by Dall-E" width="200"/>


Slinky is a browser extension that analyses links on webpages (link checking, counting, validation, ...) using WebAssembly (Rust).

The end use case is to compare a newsletter preview to the spec of expected links. Future features include :
- checking for duplicate links
- checking for missing links
- checking for broken links.


## Building
```
wasm-pack build --target web --out-dir slinky-extension/pkg
```

Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `slinky-extension` directory

## Structure

- `src/lib.rs` - Rust code that implements the link gathering functionality
- `slinky-extension/` - Chrome extension files
  - `manifest.json` - Extension configuration
  - `content.js` - Content script that loads and runs the WASM module
