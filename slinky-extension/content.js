async function run() {
  console.log("Loading WASM module...");
  try {
    const moduleUrl = chrome.runtime.getURL("pkg/slinky.js");
    console.log("Module URL:", moduleUrl);

    const module = await import(moduleUrl);
    console.log("Module loaded:", Object.keys(module));

    await module.default();
    console.log("WASM initialized");

    const links = module.gather_links();
    console.log("Links:", links);
  } catch (error) {
    console.error("Detailed error:", error.message, error.stack);
  }
}

run();
