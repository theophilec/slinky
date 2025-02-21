document.addEventListener("DOMContentLoaded", function () {
  const runButton = document.getElementById("runButton");
  const requiredInput = document.getElementById("required");
  const excludedInput = document.getElementById("excluded");

  // Restore saved values when popup opens
  chrome.storage.local.get(
    ["requiredLinks", "excludedLinks"],
    function (result) {
      if (result.requiredLinks) {
        requiredInput.value = result.requiredLinks;
      }
      if (result.excludedLinks) {
        excludedInput.value = result.excludedLinks;
      }
    },
  );

  // Save input values when they change
  requiredInput.addEventListener("input", function () {
    chrome.storage.local.set({
      requiredLinks: requiredInput.value,
    });
  });

  excludedInput.addEventListener("input", function () {
    chrome.storage.local.set({
      excludedLinks: excludedInput.value,
    });
  });

  runButton.addEventListener("click", function () {
    const requiredLinks = requiredInput.value;
    const excludedLinks = excludedInput.value;

    // Save values when running checks
    chrome.storage.local.set({
      requiredLinks: requiredLinks,
      excludedLinks: excludedLinks,
    });

    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "runChecks",
        requiredLinks: requiredLinks,
        excludedLinks: excludedLinks,
      });
    });
  });
});
