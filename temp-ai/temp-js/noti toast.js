/**
 * Toast Notification System
 * Simple, elegant toast notifications with vanilla JavaScript
 */

// Toast container to hold all notifications
let toastContainer = null;

// Toast configuration defaults
const defaultConfig = {
  duration: 3000, // Display duration in milliseconds
  position: "top-right", // Position on screen: 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'
  maxToasts: 5, // Maximum number of toasts displayed simultaneously
  theme: "light", // 'light' or 'dark'
  permanent: false, // If true, toast won't auto-dismiss
  width: null, // Custom width (e.g., '400px', '80%')
  maxHeight: null, // Custom max height for content area (e.g., '300px')
  id: null, // Optional identifier to update an existing toast
};

// Initialize toast container
function initToastContainer(position = defaultConfig.position) {
  // First, check if there's already a container in the DOM
  let existingContainer = document.getElementById("toast-container");

  // If container exists, use it
  if (existingContainer) {
    toastContainer = existingContainer;

    // Update position if different from current
    if (!toastContainer.className.includes(position)) {
      toastContainer.className = `toast-container toast-${position}`;
    }

    return toastContainer;
  }

  // Create container if it doesn't exist
  if (!toastContainer) {
    // Check if we need to add styles
    if (!document.getElementById("toast-styles")) {
      const style = document.createElement("style");
      style.id = "toast-styles";
      style.textContent = `
        .toast-container {
          position: fixed;
          z-index: 9999;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 450px;
          width: 100%;
        }
        
        .toast-top-right {
          top: 20px;
          right: 20px;
          align-items: flex-end;
        }
        
        .toast-top-left {
          top: 20px;
          left: 20px;
          align-items: flex-start;
        }
        
        .toast-bottom-right {
          bottom: 20px;
          right: 20px;
          align-items: flex-end;
          flex-direction: column-reverse;
        }
        
        .toast-bottom-left {
          bottom: 20px;
          left: 20px;
          align-items: flex-start;
          flex-direction: column-reverse;
        }
        
        .toast-top-center {
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          align-items: center;
        }
        
        .toast-bottom-center {
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          align-items: center;
          flex-direction: column-reverse;
        }
        
        .toast {
          display: flex;
          flex-direction: column;
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          pointer-events: auto;
          max-width: 100%;
          overflow: hidden;
          animation: toast-in 0.3s ease-in-out forwards;
          cursor: pointer;
        }
        
        .toast.toast-light {
          background-color: rgba(250, 250, 250, 0.95);
          color: #333;
          border-left: 4px solid #888;
        }
        
        .toast.toast-dark {
          background-color: rgba(60, 60, 65, 0.95);
          color: #eee;
          border-left: 4px solid #aaa;
        }
        
        .toast-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }
        
        .toast-title {
          font-weight: bold;
          font-size: 16px;
          margin-right: 10px;
        }
        
        .toast-close {
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
          font-size: 18px;
        }
        
        .toast-close:hover {
          opacity: 1;
        }
        
        .toast-content {
          font-size: 14px;
        }
        
        .toast-content pre {
          margin-top: 8px;
          white-space: pre-wrap;
          word-break: break-word;
          padding: 8px;
          border-radius: 4px;
          background-color: rgba(0, 0, 0, 0.05);
          max-height: 200px;
          overflow-y: auto;
        }
        
        .toast.toast-dark .toast-content pre {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .toast-progress {
          height: 3px;
          background-color: rgba(0, 0, 0, 0.2);
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          transition: width linear;
        }
        
        .toast.toast-dark .toast-progress {
          background-color: rgba(255, 255, 255, 0.3);
        }
        
        .toast-permanent-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
          font-size: 10px;
          padding: 2px 5px;
          color: #fff;
          text-transform: uppercase;
        }
        
        .toast.toast-dark .toast-permanent-badge {
          background-color: rgba(255, 255, 255, 0.3);
        }
        
        @keyframes toast-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes toast-out {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        
        @keyframes toast-update {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
      `;
      document.head.appendChild(style);
    }

    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = `toast-container toast-${position}`;
    document.body.appendChild(toastContainer);
  }

  return toastContainer;
}

// Create a toast element
function createToast(options = {}) {
  const {
    title = "",
    message = "",
    data = null,
    duration = defaultConfig.duration,
    theme = defaultConfig.theme,
    permanent = defaultConfig.permanent,
    width = defaultConfig.width,
    maxHeight = defaultConfig.maxHeight,
    id = defaultConfig.id,
  } = options;

  const toast = document.createElement("div");
  toast.className = `toast toast-${theme}`;

  // Set ID if provided
  if (id) {
    toast.dataset.toastId = id;
  }

  // Apply custom width if provided
  if (width) {
    toast.style.width = width;
  }

  // Header with title and close button
  const header = document.createElement("div");
  header.className = "toast-header";

  if (title) {
    const titleEl = document.createElement("div");
    titleEl.className = "toast-title";
    titleEl.textContent = title;
    header.appendChild(titleEl);
  }

  const closeBtn = document.createElement("div");
  closeBtn.className = "toast-close";
  closeBtn.innerHTML = "&times;";
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    removeToast(toast);
  };
  header.appendChild(closeBtn);

  toast.appendChild(header);

  // Toast content
  const content = document.createElement("div");
  content.className = "toast-content";

  // Apply custom max-height if provided
  if (maxHeight) {
    content.style.maxHeight = maxHeight;
    content.style.overflow = "auto";
  }

  if (message) {
    const messageP = document.createElement("p");
    messageP.textContent = message;
    content.appendChild(messageP);
  }

  // If data is provided, render it as pretty JSON with bold values
  if (data) {
    const pre = document.createElement("pre");

    if (typeof data === "object") {
      // Format JSON with bold values
      let jsonString = JSON.stringify(data, null, 2);

      // Replace values with bold values (match patterns like "key": "value" or "key": number)
      jsonString = jsonString.replace(
        /"([^"]+)":\s*"([^"]+)"/g,
        '"$1": <strong>"$2"</strong>'
      );
      jsonString = jsonString.replace(
        /"([^"]+)":\s*([^,}\n"]+)/g,
        '"$1": <strong>$2</strong>'
      );

      pre.innerHTML = jsonString;
    } else {
      pre.innerHTML = `<strong>${String(data)}</strong>`;
    }

    content.appendChild(pre);
  }

  toast.appendChild(content);

  // Progress bar (only for non-permanent toasts)
  if (!permanent) {
    const progressBar = document.createElement("div");
    progressBar.className = "toast-progress";
    toast.appendChild(progressBar);

    // Animate progress bar
    if (duration && duration > 0) {
      progressBar.style.transition = `width ${duration}ms linear`;
      setTimeout(() => {
        progressBar.style.width = "100%";
      }, 10); // Small delay to ensure transition works

      // Auto dismiss after duration
      setTimeout(() => {
        removeToast(toast);
      }, duration);
    }
  } else {
    // Add a badge to indicate this is a permanent toast
    const permanentBadge = document.createElement("div");
    permanentBadge.className = "toast-permanent-badge";
    permanentBadge.textContent = "Permanent";
    toast.appendChild(permanentBadge);
  }

  return toast;
}

// Find an existing toast by ID
function findToastById(id) {
  if (!id || !toastContainer) return null;
  return toastContainer.querySelector(`[data-toast-id="${id}"]`);
}

// Update an existing toast's content
function updateToast(toast, options = {}) {
  const { title = "", message = "", data = null } = options;

  // Update title if it exists
  const titleEl = toast.querySelector(".toast-title");
  if (titleEl && title) {
    titleEl.textContent = title;
  }

  // Update or create message
  let messageEl = toast.querySelector(".toast-content p");
  if (message) {
    if (messageEl) {
      messageEl.textContent = message;
    } else {
      messageEl = document.createElement("p");
      messageEl.textContent = message;
      toast.querySelector(".toast-content").appendChild(messageEl);
    }
  }

  // Update or create data display
  let preEl = toast.querySelector(".toast-content pre");
  if (data !== null) {
    let formattedContent = "";

    if (typeof data === "object") {
      // Format JSON with bold values
      let jsonString = JSON.stringify(data, null, 2);

      // Replace values with bold values
      jsonString = jsonString.replace(
        /"([^"]+)":\s*"([^"]+)"/g,
        '"$1": <strong>"$2"</strong>'
      );
      jsonString = jsonString.replace(
        /"([^"]+)":\s*([^,}\n"]+)/g,
        '"$1": <strong>$2</strong>'
      );

      formattedContent = jsonString;
    } else {
      formattedContent = `<strong>${String(data)}</strong>`;
    }

    if (preEl) {
      preEl.innerHTML = formattedContent;
    } else {
      preEl = document.createElement("pre");
      preEl.innerHTML = formattedContent;
      toast.querySelector(".toast-content").appendChild(preEl);
    }
  }

  // Add highlight animation
  toast.style.animation = "none";
  toast.offsetHeight; // Trigger reflow to restart animation
  toast.style.animation = "toast-update 0.5s ease-in-out";

  return toast;
}

// Add toast to container
function showToast(options = {}) {
  const container = initToastContainer(
    options.position || defaultConfig.position
  );

  // Check if we should update an existing toast
  if (options.id) {
    const existingToast = findToastById(options.id);
    if (existingToast) {
      return updateToast(existingToast, options);
    }
  }

  const toast = createToast(options);

  // Limit number of toasts
  const maxToasts = options.maxToasts || defaultConfig.maxToasts;
  const toasts = container.querySelectorAll(".toast:not([data-toast-id])"); // Don't count identified toasts towards limit

  if (toasts.length >= maxToasts) {
    removeToast(toasts[0]);
  }

  container.appendChild(toast);
  return toast;
}

// Remove toast with animation
function removeToast(toast) {
  if (!toast || toast.classList.contains("removing")) return;

  toast.classList.add("removing");
  toast.style.animation = "toast-out 0.3s forwards";

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300); // Match animation duration
}

// Main toast function to be exported
function toast(options) {
  if (typeof options === "string") {
    options = { message: options };
  }
  return showToast(options);
}

// Create a cleaner function to prevent duplicate toasts when pasting in console
toast.cleanDuplicates = () => {
  // Remove duplicate containers (keep only the first one)
  const containers = document.querySelectorAll("#toast-container");
  if (containers.length > 1) {
    for (let i = 1; i < containers.length; i++) {
      containers[i].parentNode.removeChild(containers[i]);
    }
  }

  // Reset the toastContainer reference to the remaining one
  toastContainer = document.getElementById("toast-container");

  // Handle duplicate toasts with the same ID
  const toasts = document.querySelectorAll("[data-toast-id]");
  const ids = {};

  toasts.forEach((toast) => {
    const id = toast.dataset.toastId;
    if (ids[id]) {
      // This is a duplicate, remove it
      toast.parentNode.removeChild(toast);
    } else {
      ids[id] = true;
    }
  });
};

// Call the cleanup function when script runs
toast.cleanDuplicates();

/**
 * Improved version of permanent toast function that updates existing toasts with the same ID
 * This allows repeatedly pasting the same code in F12 console to update toast content
 */
toast.permanent = (message, data = null, title = "Thông báo", options = {}) => {
  // Clean up duplicates when called
  toast.cleanDuplicates();

  // Ensure options is an object
  options = options || {};

  // Make it permanent by default, unless timeout is specified
  options.permanent = options.timeout === undefined;

  // Set duration if timeout is specified
  if (options.timeout !== undefined && options.timeout > 0) {
    options.duration = options.timeout;
    options.permanent = false; // Not permanent if timeout is set
  }

  // Handle different types (error, success, info) with corresponding styles
  if (options.type) {
    switch (options.type.toLowerCase()) {
      case "error":
        options.theme = "dark";
        // Add error styling
        options.borderColor = "#e74c3c";
        break;
      case "success":
        options.theme = "light";
        // Add success styling
        options.borderColor = "#2ecc71";
        break;
      case "info":
        options.theme = "light";
        // Add info styling
        options.borderColor = "#3498db";
        break;
      case "warning":
        options.theme = "light";
        // Add warning styling
        options.borderColor = "#f39c12";
        break;
      default:
        // Default styling
        if (!options.theme) {
          options.theme = "light";
        }
    }
  } else if (!options.theme) {
    // If no type and no theme specified, use light
    options.theme = "light";
  }

  // Check if a toast with this ID already exists
  if (options.id) {
    const existingToast = findToastById(options.id);
    if (existingToast) {
      // Apply border color if specified
      if (options.borderColor) {
        existingToast.style.borderLeftColor = options.borderColor;
      }

      // If we're updating a toast and a new timeout is specified,
      // we need to handle the auto-dismiss
      if (options.timeout !== undefined && options.timeout > 0) {
        // Remove existing progress bar if any
        const existingProgressBar =
          existingToast.querySelector(".toast-progress");
        if (existingProgressBar) {
          existingProgressBar.remove();
        }

        // Remove permanent badge if any
        const existingBadge = existingToast.querySelector(
          ".toast-permanent-badge"
        );
        if (existingBadge) {
          existingBadge.remove();
        }

        // Add new progress bar
        const progressBar = document.createElement("div");
        progressBar.className = "toast-progress";
        existingToast.appendChild(progressBar);

        // Animate progress bar
        progressBar.style.transition = `width ${options.timeout}ms linear`;
        setTimeout(() => {
          progressBar.style.width = "100%";
        }, 10);

        // Set timeout to remove toast
        setTimeout(() => {
          removeToast(existingToast);
        }, options.timeout);
      }

      // Update the existing toast and return
      return updateToast(existingToast, {
        title,
        message,
        data,
        ...options,
      });
    }
  }

  // Create a new toast
  const newToast = toast({
    title,
    message,
    data,
    permanent: options.permanent,
    theme: options.theme,
    duration: options.duration,
    ...options,
  });

  // Apply border color if specified
  if (options.borderColor) {
    newToast.style.borderLeftColor = options.borderColor;
  }

  return newToast;
};

// Update method that has similar behavior - creates toast if it doesn't exist
toast.update = (id, message, data = null, title = null, options = {}) => {
  // Clean up duplicates when called
  toast.cleanDuplicates();

  // Check if toast exists
  const existingToast = findToastById(id);

  if (existingToast) {
    // Update existing toast
    return updateToast(existingToast, {
      title: title || undefined,
      message,
      data,
      ...options,
    });
  } else {
    // Create new toast with the given ID if it doesn't exist
    return toast({
      id,
      title: title || "Thông báo",
      message,
      data,
      ...options,
    });
  }
};

//  show toast data
// const perAction = Number.parseFloat("$perAction") * 100 + "%";
// const randomValue = Number.parseFloat("$randomValue") * 100 + "%";

// const text =
//   perAction <= randomValue
//     ? "Thực hiện action thông báo"
//     : "Không thực hiện action thông báo";

const data = {
  "Khoảng rd dòng for": "$rangeStr",
  "Số dòng random được": "$countForFullActions",
};

// toast.permanent(text, data, "Nimo server", {
//   id: "server-status",
//   width: "400px",
//   maxHeight: "250px",
//   type: "info", // Can be: 'error', 'success', 'info', 'warning',
//   //   timeout: 5000,
// });

// // Example of a truly permanent toast (default)
const textNotification = "Smooth";
toast.permanent(textNotification, data, "Nimo Server", {
  id: "server-status",
  width: "400px",
  type: "info",
});
