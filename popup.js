const emailsListElement = document.getElementById("emails-list");

emailsListElement.addEventListener("click", function (e) {
  const selectedEmail = e.target.innerText;

  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, { data: { email: selectedEmail } });
  });
});

async function renderList() {
  const emailsResult = await chrome.storage.local.get("emails");
  const envResult = await chrome.storage.local.get("env");

  const emails = emailsResult.emails;
  const env = envResult.env;

  const emailsListElement = document.getElementById("emails-list");

  if (!emails[env]) return;

  const buttonsElements = emails[env].map(getButtonElement);
  emailsListElement.append(...buttonsElements);
}

function getButtonElement(email) {
  const button = document.createElement("button");

  button.setAttribute("type", "button");
  button.setAttribute("class", "list-group-item list-group-item-action");
  button.innerText = email;

  return button;
}

document.addEventListener("DOMContentLoaded", function () {
  renderList();
});
