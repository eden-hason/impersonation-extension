chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.sendMessage(
    activeInfo.tabId,
    { action: "onTabChange" },
    () => chrome.runtime.lastError
  );
});
