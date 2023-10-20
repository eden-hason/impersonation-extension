const SCAN_INTERVAL_MS = 1000; // TODO: MAKE THIS CHANGEABLE THROUGH SOME HIDDEN SETTINGS PANEL
const ELEMENT_STYLE = { textDecoration: "underline" };
const MAX_EMAILS_TO_STORE = 5;

let intervalId = null;
let userOptions = {};

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  switch (message?.action) {
    case "onTabActivate":
      await handleEnvChange();
      break;
    case "onTabUrlChange":
      handleApprovalFlowTableImpersonation();
      break;
    case "onImpersonate":
      if (message?.data?.email) {
        await handleImpersonate(message.data.email);
      }
      break;
    case "onClearRecentImpersonations":
      await handleClearRecentImpersonations();
      break;
  }

  sendResponse();
});

const defaultEnvStore = () => {
  return {
    categories: {},
    recentImpersonations: []
  }
}

const getEnvStore = async () => {
  const env = parseHostnameToEnv();
  return (await chrome.storage.local.get(env))?.[env] || defaultEnvStore();
}

const setEnvStore = async (data) => {
  const env = parseHostnameToEnv();
  const envStore = await getEnvStore();
  const envData = {...envStore, ...data}
  await chrome.storage.local.set({
    [env]: envData,
  });
}

async function handleEnvChange() {
  const env = parseHostnameToEnv();
  await chrome.storage.local.set({ env });
}

async function handleImpersonate(email) {
  localStorage.setItem("forceCustomer", email);
  await handleCurrentImpersonation();
  location.reload();
}

function handleApprovalFlowTableImpersonation() {
  if (!userOptions.quickImpersonate) return;

  if (intervalId) clearInterval(intervalId);

  intervalId = setInterval(() => {
    const approvalFlowTableLines = document.querySelector(
      ".approval-flow-table"
    );
    if (approvalFlowTableLines) {
      if (!userOptions.testMode) clearInterval(intervalId); // We found the approval flow table. stop searching for it. in test-mode it lets you play with the dom and see the effects (for example, set data-email to some approvalName and see how it changes on-the-fly)

      approvalFlowTableLines.childNodes.forEach((line) => {
        const elementWithDataEmail = line.querySelector("[data-email]");
        if (!elementWithDataEmail) return;

        const email = elementWithDataEmail.dataset.email; // FYI, you could also use: line.getAttribute('data-email')
        elementWithDataEmail.removeAttribute("data-email"); //remove data-email attribute. that will force elementWithDataEmail to be undefined in the next intervals. It means that we won't handle it again and waste resources (for example: register a lot of click events).
        elementWithDataEmail.style.cursor = "pointer";

        if (userOptions.style) {
          Object.assign(elementWithDataEmail.style, ELEMENT_STYLE);
        }

        elementWithDataEmail.addEventListener(
          "click",
          async (e) => {
            e.stopPropagation();
            await handleImpersonate(email);
          },
          { once: true }
        ); // Once triggered, removing the listener.
      });
    }
  }, SCAN_INTERVAL_MS);
}

async function isEmailExists(email) {
  // TODO: Control through the settings (the way email added to the recent impersonations list)
  //const envStore = await getEnvStore();

  // If we check recentImpersonation here, if the email was already in recentImpersonation it will not pop to the top..
  // const recentImpersonationEmails = envStore.recentImpersonations || [];
  // const isEmailExistInRecentImpersonation = recentImpersonationEmails.some(rie => rie === email);
  // if (isEmailExistInRecentImpersonation) return true;

  // We don't save email that already saved to some category to the recentImpersonation list
  // const categories = envStore.categories || {};
  // for (const category in categories) {
  //   const categoryEmails = categories[category] || [];
  //   const isEmailExistInCategory = categoryEmails.some(ce => ce === email);
  //   if (isEmailExistInCategory) return true;
  // }
  return false;
}

async function handleCurrentImpersonation() {
  const email = localStorage.getItem("forceCustomer");
  const env = parseHostnameToEnv();
  if (!email || !env || await isEmailExists(email)) return;

  await setEmailToLocalStorage(email, env);
}

function parseHostnameToEnv(_hostname) {
  const hostname = _hostname || location.hostname;
  const splitHostname = hostname.split(".");
  let env;

  if (splitHostname.includes("dev")) {
    env = "development";
  } else if (splitHostname.includes("sandbox")) {
    env = "sandbox";
  } else if (splitHostname.includes("localhost")) {
    env = "local";
  } else if (splitHostname.includes("rc")) {
    env = "rc";
  } else {
    env = "production";
  }

  return env;
}

async function setEmailToLocalStorage(email) {
  const envStore = await getEnvStore();
  const prevRecentImpersonations = envStore.recentImpersonations || [];
  const uniqRecentImpersonations = new Set([email, ...prevRecentImpersonations]);
  const recentImpersonations = Array.from(uniqRecentImpersonations).splice(0, MAX_EMAILS_TO_STORE);
  await setEnvStore({recentImpersonations});
}

async function handleClearRecentImpersonations() {
  await setEnvStore({recentImpersonations: []});
}

document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.sync.get("options", async (res) => {
    userOptions = res.options;
    handleApprovalFlowTableImpersonation();
    await handleCurrentImpersonation(); // TODO: Can do another mechanisem? something that listen to the impersonate modal event firing? this way we could keep the recent impersonate list really empty all the time until someone really doing impersonation
  });
});
