document.addEventListener("DOMContentLoaded", function () {
  const runButton = document.getElementById("runButton");

  runButton.addEventListener("click", function () {
    const requiredLinks = document.getElementById("required").value;
    const excludedLinks = document.getElementById("excluded").value;

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
