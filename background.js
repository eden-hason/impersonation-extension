chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.query({
    active: true,
  },()=>{
    chrome.tabs.sendMessage(
        activeInfo.tabId,
        {
          action: "onTabActivate",
        },
        () => chrome.runtime.lastError
    );
  })
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo)=> {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  },(tabs)=>{
    if(changeInfo.url && tabId === tabs[0].id) {
      chrome.tabs.sendMessage(
          tabId,
          {
            action: "onTabUrlChange",
          },
          () => chrome.runtime.lastError
      );
    }
})})