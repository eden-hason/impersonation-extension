const SCAN_INTERVAL_MS = 1000; // TODO: MAKE THIS CHANGEABLE THROUGH SOME HIDDEN SETTINGS PANEL
const TEST_MODE = true;  // TODO: MAKE THIS CHANGEABLE THROUGH SOME HIDDEN SETTINGS PANEL
let intervalId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message?.action) {
    case "onTabChange":
      handleCurrentImpersonation();
      return;
    case "onTabUrlChange":
      handleApprovalFlowTableImpersonation();
      return;
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
  if (intervalId)
    clearInterval(intervalId);

  intervalId = setInterval(() => {
    const approvalFlowTableLines = document.querySelector('.approval-flow-table');
    if (approvalFlowTableLines) {

      if (!TEST_MODE) clearInterval(intervalId); // We found the approval flow table. stop searching for it. in test-mode it lets you play with the dom and see the effects (for example, set data-email to some approvalName and see how it changes on-the-fly)

      approvalFlowTableLines.childNodes.forEach(line => {
        const elementWithDataEmail = line.querySelector("[data-email]");
        if (!elementWithDataEmail) return;

        const email = elementWithDataEmail.dataset.email; // FYI, you could also use: line.getAttribute('data-email')
        elementWithDataEmail.removeAttribute("data-email"); //remove data-email attribute. that will force elementWithDataEmail to be undefined in the next intervals. It means that we won't handle it again and waste resources (for example: register a lot of click events).
        elementWithDataEmail.style.cursor = 'pointer';
        elementWithDataEmail.addEventListener('click', (e) => {
          e.stopPropagation();
          impersonate(email);
        }, {once: true}); // Once triggered, removing the listener.
      });
    }
  }, SCAN_INTERVAL_MS)
}

// Send the current impersonation to background
function handleCurrentImpersonation() {
  const email = localStorage.getItem("forceCustomer");
  const env = parseHostnameToEnv();

  if (!email || !env) return;

  chrome.runtime.sendMessage({
    data: {
      env,
      email: localStorage.getItem("forceCustomer"),
    },
  });
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

document.addEventListener("DOMContentLoaded", function () {
  handleApprovalFlowTableImpersonation();
  handleCurrentImpersonation();
});
