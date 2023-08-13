chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.sendMessage(
    activeInfo.tabId,
    { action: "onTabChange" },
    () => chrome.runtime.lastError
  );
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.url) {
    chrome.tabs.sendMessage(
      tabId,
      {
        action: "onTabUrlChange",
      },
      () => chrome.runtime.lastError
    );
  }
});
