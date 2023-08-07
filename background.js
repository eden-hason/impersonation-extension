const MAX_EMAILS_TO_STORE = 5;

chrome.runtime.onMessage.addListener(async function (
  message,
  sender,
  sendResponse
) {
  if (message?.data) {
    await setEmailToLocalStorage(message.data.email, message.data.env);
  }

  sendResponse();
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.sendMessage(
    activeInfo.tabId,
    { action: "onTabChange" },
    () => chrome.runtime.lastError
  );
});

async function setEmailToLocalStorage(email, env) {
  const storeResult = await chrome.storage.local.get("emails");
  const storedEmails = storeResult.emails || {};

  if (!storedEmails[env]) {
    storedEmails[env] = [email];
  } else {
    const emailsSet = new Set([email, ...storedEmails[env]]);
    storedEmails[env] = Array.from(emailsSet).splice(0, MAX_EMAILS_TO_STORE);
  }

  chrome.storage.local.set({
    env,
    emails: storedEmails,
  });
}
