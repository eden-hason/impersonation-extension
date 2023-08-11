const SCAN_INTERVAL_MS = 1000; // TODO: MAKE THIS CHANGEABLE THROUGH SOME HIDDEN SETTINGS PANEL
const ELEMENT_STYLE = { textDecoration: "underline" };
const MAX_EMAILS_TO_STORE = 5;

let intervalId = null;
let userOptions = {};

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  switch (message?.action) {
    case "onTabChange":
      handleCurrentImpersonation();
      handleApprovalFlowTableImpersonation();
      break;
    case "clear-all":
      handleClearAll();
      break;
  }

  if (message?.data?.email) {
    impersonate(message.data.email);
  }

  sendResponse();
});

function impersonate(email) {
  localStorage.setItem("forceCustomer", email);
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
          (e) => {
            e.stopPropagation();
            impersonate(email);
          },
          { once: true }
        ); // Once triggered, removing the listener.
      });
    }
  }, SCAN_INTERVAL_MS);
}

function handleCurrentImpersonation() {
  const email = localStorage.getItem("forceCustomer");
  const env = parseHostnameToEnv();

  if (!email || !env) return;

  setEmailToLocalStorage(email, env);
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
  } else {
    env = "production";
  }

  return env;
}

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

async function handleClearAll() {
  const storeResult = await chrome.storage.local.get("emails");
  const storedEmails = storeResult.emails || {};
  const env = parseHostnameToEnv();

  storedEmails[env] = null;

  chrome.storage.local.set({
    emails: storedEmails,
  });
}

document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.sync.get("options", (res) => {
    userOptions = res.options;
    handleApprovalFlowTableImpersonation();
    handleCurrentImpersonation();
  });
});
