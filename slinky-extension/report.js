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
      resultDiv.appendChild(timestampDiv);

      if (item.data.error) {
        // Create an error message element
        const errorDiv = document.createElement("div");
        errorDiv.className = "error-message";
        errorDiv.textContent = `Error: ${item.data.error}`;
        resultDiv.appendChild(errorDiv);
      } else {
        // Create a table to display the URLs
        const table = document.createElement("table");
        table.className = "url-table";

        // Create table header
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        const headerCell = document.createElement("th");
        headerCell.textContent = "URL";
        headerRow.appendChild(headerCell);
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create table body
        const tbody = document.createElement("tbody");

        // Parse the string data with newline separators
        let urlList = [];
        let currentSection = "";

        // Handle the string data format
        if (typeof item.data === "string") {
          // Split the string by lines
          const lines = item.data.split("\n");

          lines.forEach((line) => {
            // Identify section headers
            if (line.endsWith(":")) {
              currentSection = line.trim();
            }
            // Extract URLs (lines with http or https that have been indented)
            else if (line.trim().startsWith("http")) {
              urlList.push({
                url: line.trim(),
                section: currentSection,
              });
            }
          });
        }
        // Fallback for other data structures
        else if (Array.isArray(item.data)) {
          urlList = item.data.map((url) => ({ url }));
        } else if (item.data && typeof item.data === "object") {
          // Try to extract URLs from object format
          try {
            if (Array.isArray(item.data.urls)) {
              urlList = item.data.urls.map((url) => ({ url }));
            } else if (item.data.links && Array.isArray(item.data.links)) {
              urlList = item.data.links.map((url) => ({ url }));
            }
          } catch (e) {
            console.error("Failed to parse object data:", e);
          }
        }

        // If we have URLs to display
        if (urlList.length > 0) {
          let lastSection = null;

          urlList.forEach((item) => {
            // If we're starting a new section, add a header row
            if (item.section && item.section !== lastSection) {
              const sectionRow = document.createElement("tr");
              const sectionCell = document.createElement("td");
              sectionCell.textContent = item.section;
              sectionCell.style.fontWeight = "bold";
              sectionCell.style.backgroundColor = "#f0f0f0";
              sectionRow.appendChild(sectionCell);
              tbody.appendChild(sectionRow);
              lastSection = item.section;
            }

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.textContent = typeof item === "object" ? item.url : item;

            row.appendChild(cell);
            tbody.appendChild(row);
          });
        } else {
          // No URLs found - add a message row
          const row = document.createElement("tr");
          const cell = document.createElement("td");
          cell.textContent = "No URLs found or data is not in expected format";
          row.appendChild(cell);
          tbody.appendChild(row);
        }

        table.appendChild(tbody);
        resultDiv.appendChild(table);
      }

      resultsContent.appendChild(resultDiv);
    });
  }
});
