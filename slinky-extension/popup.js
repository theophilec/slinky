document.addEventListener("DOMContentLoaded", function () {
  const runButton = document.getElementById("runButton");
  const clearButton = document.getElementById("clearButton");
  const requiredInput = document.getElementById("required");
  const excludedInput = document.getElementById("excluded");
  const resultsContent = document.getElementById("resultsContent");

  // Restore saved values and previous results when popup opens
  chrome.storage.local.get(
    ["requiredLinks", "excludedLinks", "resultsHistory"],
    function (result) {
      if (result.requiredLinks) {
        requiredInput.value = result.requiredLinks;
      }
      if (result.excludedLinks) {
        excludedInput.value = result.excludedLinks;
      }
      if (result.resultsHistory) {
        displayResultsHistory(result.resultsHistory);
      }
    },
  );

  // Listen for results from content script
  chrome.runtime.onMessage.addListener(function (message) {
    if (message.action === "displayResults") {
      saveAndDisplayResults(message.results);
    }
  });

  runButton.addEventListener("click", function () {
    const requiredLinks = requiredInput.value;
    const excludedLinks = excludedInput.value;

    chrome.storage.local.set({
      requiredLinks: requiredLinks,
      excludedLinks: excludedLinks,
    });

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "runChecks",
        requiredLinks: requiredLinks,
        excludedLinks: excludedLinks,
      });
    });
  });

  clearButton.addEventListener("click", function () {
    chrome.storage.local.remove("resultsHistory", function () {
      resultsContent.innerHTML = "";
    });
  });

  function saveAndDisplayResults(results) {
    const timestamp = new Date().toLocaleString();
    const resultItem = {
      timestamp: timestamp,
      data: results,
    };

    chrome.storage.local.get("resultsHistory", function (data) {
      let history = data.resultsHistory || [];
      history.unshift(resultItem); // Add new results at the beginning
      // Keep only last 10 results
      history = history.slice(0, 10);

      chrome.storage.local.set({ resultsHistory: history }, function () {
        displayResultsHistory(history);
      });
    });
  }

  function displayResultsHistory(history) {
    resultsContent.innerHTML = "";
    history.forEach((item) => {
      const resultDiv = document.createElement("div");
      resultDiv.className = "result-item";

      const timestampDiv = document.createElement("div");
      timestampDiv.className = "timestamp";
      timestampDiv.textContent = item.timestamp;

      const contentDiv = document.createElement("div");
      contentDiv.className = "content";
      if (item.data.error) {
        contentDiv.textContent = `Error: ${item.data.error}`;
        contentDiv.style.color = "red";
      } else {
        contentDiv.textContent = JSON.stringify(item.data, null, 2);
      }

      resultDiv.appendChild(timestampDiv);
      resultDiv.appendChild(contentDiv);
      resultsContent.appendChild(resultDiv);
    });
  }
});
