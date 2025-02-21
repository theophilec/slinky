chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "runChecks") {
    run(request.requiredLinks, request.excludedLinks).then((results) => {
      chrome.runtime.sendMessage({
        action: "displayResults",
        results: results,
      });
    });
  }
});
async function run(requiredLinks, excludedLinks) {
  console.log("Required links:", requiredLinks);
  console.log("Excluded links:", excludedLinks);
  try {
    console.log("Loading WASM module...");
    const moduleUrl = chrome.runtime.getURL("pkg/slinky.js");
    console.log("Module URL:", moduleUrl);

    const module = await import(moduleUrl);
    console.log("Module loaded:", Object.keys(module));

    await module.default();
    console.log("WASM initialized");

    const links = module.gather_links(requiredLinks, excludedLinks);
    console.log("Output from gather_links:", links);
    return links;
  } catch (error) {
    console.error("Detailed error:", error.message, error.stack);
  }
}
