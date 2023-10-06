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
  await renderCategories();
  await renderRecentImpersonations();
  await handleClearRecentImpersonationsDispaly();
}

const onClickImpersonate = (email) => {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    chrome.tabs.sendMessage(
        tabs[0].id,
        { data: { email: email }, action: "onImpersonate" },
        async () => await renderPopup() // TODO: also close the popup? if closing, we dont need to renderPopup()
    );
  });
}

async function renderCategories() {
  const envStore = await getEnvStore();
  const categories = envStore.categories;

  const categoriesElement = document.getElementById("categories");
  categoriesElement.innerHTML = "";

  for (const [key, value] of Object.entries(categories)) {
    if (value.length > 0) {
      const categoryName = key;
      const emailsButtons = buildCategoryImpersonationsButtons(value);
      categoriesElement.append(categoryName);
      categoriesElement.append(...emailsButtons);
    }
  }
}

function buildCategoryImpersonationsButtons(emails) {
  return emails.map(email => {
    return getCategoryImpersonationButtonElement(email);
  });
}

function buildRecentImpersonationsButtons(emails) {
  return emails.map(getRecentImpersonationButtonElement);
}

function buildEmptyRecentImpersonations() {
  const noRecordsElement = document.createElement("span");
  noRecordsElement.style.fontStyle = "italic";
  noRecordsElement.style.fontSize = "12px";
  noRecordsElement.innerText = "No records to show";
  return noRecordsElement;
}


async function renderRecentImpersonations() {
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

function getCategoryImpersonationButtonElement(email) {
  const button = document.createElement("button");

  button.setAttribute("type", "button");
  button.setAttribute("class", "list-group-item list-group-item-action");
  button.innerText = email;
  button.onclick = (evt) => {
    evt.stopPropagation();
    onClickImpersonate(email)
  }

  return button;
}

function onClickSaveRecentImpersonation(email) {
  alert("TODO: Save to categories logic. remove from recents after. email to save: " + email);
}

function getRecentImpersonationButtonElement(email) {
  const button = document.createElement("button");
  button.setAttribute("type", "button");
  button.setAttribute("class", "list-group-item list-group-item-action");
  button.style.display = 'flex';
  button.style.justifyContent = 'space-between';

  const emailElement = document.createElement('div');
  emailElement.innerText = email;

  button.onclick = (evt) => {
    evt.stopPropagation();
    onClickImpersonate(email);
  }

  button.append(emailElement);

  const saveImpersonationElement = document.createElement('div');
  saveImpersonationElement.innerText = "Save";

  saveImpersonationElement.onclick = (evt) => {
    evt.stopPropagation();
    onClickSaveRecentImpersonation(email);
  }

  button.append(saveImpersonationElement);

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