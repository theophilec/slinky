chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: "report.html" });
});
