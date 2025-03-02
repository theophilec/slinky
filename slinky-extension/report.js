document.addEventListener("DOMContentLoaded", function () {
  const runButton = document.getElementById("runButton");
  const clearButton = document.getElementById("clearButton");
  const requiredInput = document.getElementById("required");
  const excludedInput = document.getElementById("excluded");
  const resultsContent = document.getElementById("resultsContent");
  const tabSelector = document.getElementById("tab-selector");

  // Function to populate the tab dropdown
  function populateTabDropdown() {
    // Clear existing options
    tabSelector.innerHTML = "";

    // Get all tabs
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(function (tab) {
        const option = document.createElement("option");
        option.value = tab.id;

        // Create a tab title with favicon (limited to 50 chars)
        let tabTitle = tab.title;
        if (tabTitle.length > 50) {
          tabTitle = tabTitle.substring(0, 47) + "...";
        }

        option.textContent = tabTitle;
        tabSelector.appendChild(option);
      });

      // Pre-select current tab if it exists in the list
      chrome.tabs.query(
        { active: true, lastFocusedWindow: true },
        function (currentTabs) {
          if (currentTabs.length > 0) {
            tabSelector.value = currentTabs[0].id;
          }
        },
      );
    });
  }

  // Initialize tab dropdown
  populateTabDropdown();

  // Refresh the tab list when tabs change
  chrome.tabs.onCreated.addListener(populateTabDropdown);
  chrome.tabs.onUpdated.addListener(populateTabDropdown);
  chrome.tabs.onRemoved.addListener(populateTabDropdown);

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
    console.log("Button clicked");
    const requiredLinks = requiredInput.value;
    const excludedLinks = excludedInput.value;
    const selectedTabId = parseInt(tabSelector.value);

    chrome.storage.local.set({
      requiredLinks: requiredLinks,
      excludedLinks: excludedLinks,
    });

    if (selectedTabId) {
      console.log("Sending message to content script");
      chrome.tabs.sendMessage(selectedTabId, {
        action: "runChecks",
        targetTabId: selectedTabId,
        requiredLinks: requiredLinks,
        excludedLinks: excludedLinks,
      });
    }
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
