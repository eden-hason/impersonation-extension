const saveButtonElement = document.querySelector("#save-button");
const styleInputWrapperElement = document.querySelector("#style-input-wrapper");
const labModeInputElement = document.querySelector("#lab-mode-input");
const styleInputElement = document.querySelector("#style-input");
const quickImpersonateInputElement = document.querySelector(
  "#quick-impersonate-input"
);

quickImpersonateInputElement.addEventListener("change", (e) =>
  handleStyleInputDisplay(e.target.checked)
);

saveButtonElement.addEventListener("click", function () {
  const labModeValue = labModeInputElement.checked;
  const quickImpersonateValue = quickImpersonateInputElement.checked;
  const styleValue = styleInputElement.checked;

  chrome.storage.sync.set(
    {
      options: {
        labMode: labModeValue,
        quickImpersonate: quickImpersonateValue,
        style: styleValue,
      },
    },
    () => {
      // Update UI to let user know options were saved.
      const successAlertElement = document.querySelector("#success-alert");
      successAlertElement.style.visibility = "visible";

      setTimeout(() => {
        successAlertElement.style.visibility = "hidden";
      }, 3000);
    }
  );
});

function handleStyleInputDisplay(visible) {
  if (visible) {
    styleInputWrapperElement.style.display = "block";
  } else {
    styleInputElement.checked = false;
    styleInputWrapperElement.style.display = "none";
  }
}

async function handlePageLoad() {
  const { options = {} } = await chrome.storage.sync.get("options");

  labModeInputElement.checked = options.labMode;
  quickImpersonateInputElement.checked = options.quickImpersonate;
  styleInputElement.checked = options.style;

  handleStyleInputDisplay(options.quickImpersonate);
}

// Handle page load
document.addEventListener("DOMContentLoaded", function () {
  handlePageLoad();
});
