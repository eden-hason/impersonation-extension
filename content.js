chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action) {
    handleCurrentImpersonation();
    return;
  }
  const email = message.data.email;

  if (!email) return;

  localStorage.setItem("forceCustomer", email);
  location.reload();

  sendResponse();
});

// Send the current impersonation to background
function handleCurrentImpersonation() {
  const env = parseHostnameToEnv();

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
  handleCurrentImpersonation();
});
