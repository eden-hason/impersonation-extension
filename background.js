const MAX_EMAILS_TO_STORE = 5;

chrome.runtime.onMessage.addListener(async function (
  message,
  sender,
  sendResponse
) {
  if (message.data) {
    await setEmailToLocalStorage(message.data.email, message.data.env);
  }

  sendResponse();
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.sendMessage(
    activeInfo.tabId,
    { action: "open_dialog_box" },
    () => chrome.runtime.lastError
  );
});

async function setEmailToLocalStorage(email, env) {
  let emailsToStore;

  const result = await chrome.storage.local.get("emails");

  if (!result.emails?.[env]) {
    emailsToStore = { [env]: [email] };
  } else {
    const emailsSet = new Set([email, ...result.emails[env]]);
    emailsToStore = {
      [env]: Array.from(emailsSet).splice(0, MAX_EMAILS_TO_STORE),
    };
  }

  chrome.storage.local.set({
    env,
    emails: emailsToStore,
  });
}
