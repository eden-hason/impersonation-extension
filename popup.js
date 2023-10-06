async function getEnvironment() {
  return (await chrome.storage.local.get("env"))?.env;
}

async function getEnvStore() {
  const env = await getEnvironment();
  console.log("[qi] environment", env);
  const envStore = (await chrome.storage.local.get(env))?.[env];
  console.log("[qi] envStore",envStore);
  return envStore;
}

function closePopup() {
  window.close();
}

async function renderPopup() {
  await renderList();
  await handleClearRecentImpersonationsDispaly();
}

function onClickImpersonate(email) {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(
        activeTab.id,
        { data: { email, action: "onImpersonate" } },
        () => closePopup()
    );
  });
}

function buildEmptyRecentImpersonations() {
  const noRecordsElement = document.createElement("span");
  noRecordsElement.style.fontStyle = "italic";
  noRecordsElement.style.fontSize = "12px";
  noRecordsElement.innerText = "No records to show";
  return noRecordsElement;
}

function buildRecentImpersonationsButtons(emails) {
  return emails.map(getButtonElement);
}

async function renderList() {
  const envStore = await getEnvStore();
  const emails = envStore.recentImpersonations;

  const emptyListElement = document.getElementById("empty-emails-list");
    emptyListElement.innerHTML = "";
  const emailsListElement = document.getElementById("emails-list");
    emailsListElement.innerHTML = "";

  if (!emails?.length > 0) {
    emptyListElement.append(buildEmptyRecentImpersonations());
  } else {
    emailsListElement.append(...buildRecentImpersonationsButtons(emails));
  }
}

function getButtonElement(email) {
  const button = document.createElement("button");

  button.setAttribute("type", "button");
  button.setAttribute("class", "list-group-item list-group-item-action");
  button.innerText = email;
  button.onclick = (evt) => {
    const selectedEmail = evt.target.innerText;
    onClickImpersonate(selectedEmail)
  }

  return button;
}

async function handleClearRecentImpersonationsDispaly() {
  const envStore = await getEnvStore();
  const emails = envStore.recentImpersonations;

  if (!emails || emails.length === 0) {
    clearRecentImpersonationsElement.style.display = "none";
  }
}

function onClickClearRecentImpersonations() {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: "onClearRecentImpersonations" }, async () =>
        await renderPopup()
    );
  });
}

// Handle clear all button click
const clearRecentImpersonationsElement = document.querySelector("#clear-recent-impersonations-button");
clearRecentImpersonationsElement.onclick = () => {
  onClickClearRecentImpersonations();
}

// Handle options button click
const optionsButtonElement = document.querySelector("#options-button");

optionsButtonElement.addEventListener("click", () =>
  chrome.runtime.openOptionsPage()
);

// Handle page load
document.addEventListener("DOMContentLoaded", async function () {
  await renderPopup();
});