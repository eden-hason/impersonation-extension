chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (activeInfo.tabId === tabId && changeInfo.url) {
      chrome.tabs.sendMessage(
        activeInfo.tabId,
        { action: "onTabUrlChange" },
        () => chrome.runtime.lastError
      );
    }
  });

  chrome.tabs.sendMessage(
    activeInfo.tabId,
    { action: "onTabChange" },
    () => chrome.runtime.lastError
  );
});
