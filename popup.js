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

const setEnvStore = async (data) => {
  const env = await getEnvironment();
  const envStore = await getEnvStore();
  const envData = {...envStore, ...data}
  await chrome.storage.local.set({
    [env]: envData,
  });
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
  const categories = envStore.categories || {};

  const categoriesElement = document.getElementById("categories");
  categoriesElement.innerHTML = "";
  categoriesElement.style.display = 'none';

  const isCategoriesExists = Object.keys(categories)?.length > 0;
  if (isCategoriesExists) categoriesElement.style.display = 'block';

  const categoriesTitleElement = document.createElement("div");
  categoriesTitleElement.innerText = "Saved Impersonations";
  categoriesTitleElement.style.textAlign = 'center';
  categoriesTitleElement.style.marginBottom = '5px';
  categoriesTitleElement.style.paddingBottom = '2px';
  categoriesTitleElement.style.paddingTop = '2px';
  categoriesTitleElement.style.borderBottom = '1px solid black';
  categoriesTitleElement.style.borderTop = '1px solid black';
  categoriesElement.append(categoriesTitleElement);

  for (const [key, value] of Object.entries(categories)) {
    if (value.length > 0) {
      const categoryWrapperElement = document.createElement("div");
      categoryWrapperElement.classList.add('list-group', 'list-group-flush');
      categoryWrapperElement.style.marginTop = '10px';

      const categoryNameElement = document.createElement("div");
      categoryNameElement.innerText = `${key}:`;
      categoryWrapperElement.append(categoryNameElement);

      const emailsButtons = buildCategoryImpersonationsButtons(value);
      categoryWrapperElement.append(...emailsButtons);

      categoriesElement.append(categoryWrapperElement);
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

async function isEmailExistsInSomeCategory(email) {
  const envStore = await getEnvStore();
  const categories = envStore.categories || {};
  alert(JSON.stringify(categories));
  for (const category in categories) {
    alert(category);
    const categoryEmails = categories[category] || [];
    alert(categoryEmails.join(','));
    const isEmailExistInCategory = categoryEmails.some(ce => ce === email);
    if (isEmailExistInCategory) return true;
  }

  return false;
}

async function getCategoryEmails(category) {
  const envStore = await getEnvStore();
  const categories = envStore.categories || {};
  return categories[category] || [];
}

async function setCategoryEmails(category, emails) {
  const envStore = await getEnvStore();
  const categories = envStore.categories || {};
  await setEnvStore({categories: {...categories, [category]: emails}});
}

async function isEmailExistsInCategory(category, email) {
  const categoryEmails = await getCategoryEmails(category);
  return categoryEmails.some(ce => ce === email);
}


async function onClickSaveRecentImpersonation(email) {
  const categoryInput = prompt(`Save "${email}" to category`, email.split('@')[1]);
  if (!categoryInput) return;

  const isEmailExists = await isEmailExistsInCategory(categoryInput, email);
  if (isEmailExists) {
    alert(`"${email}" already exists in category: "${categoryInput}"`);
    return;
  }

  const categoryEmails = await getCategoryEmails(categoryInput);
  categoryEmails.push(email);

  await setCategoryEmails(categoryInput, categoryEmails);
  await renderPopup();
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
  saveImpersonationElement.classList.add("saveImpersonationBtn")
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