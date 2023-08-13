// Handle render of the list
async function renderList() {
  const emailsResult = await chrome.storage.local.get("emails");
  const envResult = await chrome.storage.local.get("env");

  const emails = emailsResult.emails;
  const env = envResult.env;

  const emailsListElement = document.getElementById("emails-list");
  const emptyListElement = document.getElementById("empty-emails-list");

  if (!emails[env]) {
    const noRecordsElement = document.createElement("span");
    noRecordsElement.style.fontStyle = "italic";
    noRecordsElement.style.fontSize = "12px";
    noRecordsElement.innerText = "No records to show";
    emptyListElement.append(noRecordsElement);
    emailsListElement.innerHTML = "";
  } else {
    const buttonsElements = emails[env].map(getButtonElement);
    emailsListElement.append(...buttonsElements);
    emptyListElement.innerHTML = "";
  }
}

function getButtonElement(email) {
  const button = document.createElement("button");

  button.setAttribute("type", "button");
  button.setAttribute("class", "list-group-item list-group-item-action");
  button.innerText = email;

  return button;
}

async function handleClearAllButtonDispaly() {
  const emailsResult = await chrome.storage.local.get("emails");
  const envResult = await chrome.storage.local.get("env");

  const emails = emailsResult.emails;
  const env = envResult.env;

  if (!emails[env]) {
    clearAllElement.style.display = "none";
  }
}

// Handle list item click
const emailsListElement = document.getElementById("emails-list");

emailsListElement.addEventListener("click", function (e) {
  const selectedEmail = e.target.innerText;

  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(
      activeTab.id,
      { data: { email: selectedEmail } },
      () => window.close()
    );
  });
});

// Handle clear all button click
const clearAllElement = document.querySelector("#clear-all-button");

clearAllElement.addEventListener("click", function () {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: "clear-all" }, () =>
      window.close()
    );
  });
});

// Handle options button click
const optionsButtonElement = document.querySelector("#options-button");

optionsButtonElement.addEventListener("click", () =>
  chrome.runtime.openOptionsPage()
);

// Handle page load
document.addEventListener("DOMContentLoaded", function () {
  renderList();
  handleClearAllButtonDispaly();
});
