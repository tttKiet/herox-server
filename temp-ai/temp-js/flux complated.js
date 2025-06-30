console.log("Start");
const myUsername = "$xUser"; // Đại diện username của tôi
const isOnlyVerified = $modeFilterUserReplly; // đại diện 0 or 1
const userInteracted = `$userInteracted`; // đại diện các user đã tương tác cách nhau bới dâu |, vd: user1|user2

console.log("Start log: ", {
  myUsername,
  isOnlyVerified,
  userInteracted,
});

const sleep = (ms = 3000) => new Promise((res) => setTimeout(res, ms));

// Bước 1: Lấy tất cả cellInnerDiv
const allCells = Array.from(
  document.querySelectorAll('div[data-testid="cellInnerDiv"]')
);

// Dừng lại nếu gặp Discover more
let stopIndex = allCells.findIndex((cell) =>
  cell.querySelector("span")?.textContent?.includes("Discover more")
);
if (stopIndex === -1) stopIndex = allCells.length;

const validCells = allCells.slice(1, stopIndex);

// Phân tích comment từ validCells
const comments = [];

validCells.forEach((cell, index) => {
  const article = cell.querySelector("article");
  if (article) {
    const targetDiv = article.querySelector("div > div > div > div");
    const childCount = targetDiv ? targetDiv.children.length : 0;

    const isReply = childCount === 2;
    const isMine = !!article.querySelector(`a[href="/${myUsername}"]`);
    const isVerified = !!article.querySelector('[data-testid="icon-verified"]');

    comments.push({
      index,
      element: article,
      isReply,
      isMine,
      isVerified,
      repliedToIndex: null,
    });
  }
});

// Bước 2: Gán mối quan hệ reply
for (let i = 0; i < comments.length; i++) {
  if (comments[i].isReply) {
    for (let j = i - 1; j >= 0; j--) {
      if (!comments[j].isReply) {
        comments[i].repliedToIndex = j;
        break;
      }
    }
  }
}

// Bước 3: Lọc ra các comment chưa được bạn reply

const interactedUsers = userInteracted
  .split("|")
  .map((u) => u.trim().toLowerCase())
  .filter(Boolean);

const unrepliedComments = [];

comments.forEach((comment, idx) => {
  if (comment.isReply || comment.isMine) return;
  if (isOnlyVerified && !comment.isVerified) return;

  const hasMyReply = comments.some(
    (c) => c.isReply && c.isMine && c.repliedToIndex === idx
  );

  // Lấy username của comment này
  const userLink =
    comment.element?.querySelector('div[data-testid="User-Name"] a[href]') ||
    null;

  const username =
    userLink?.getAttribute("href")?.replace("/", "")?.toLowerCase() || null;

  if (!username || interactedUsers.includes(username)) return;

  if (!hasMyReply) {
    // Tránh trùng element
    if (!unrepliedComments.some((c) => c.element === comment.element)) {
      unrepliedComments.push(comment);
    }
  }
});

// Nếu không có comment nào phù hợp
if (unrepliedComments.length === 0) {
  console.log("⛔ Không tìm thấy comment nào bạn chưa reply.");
  console.log("return 0");
  return 0;
} else {
  // Bước 4: Random 1 comment và hiện toast
  const randomIndex = Math.floor(Math.random() * unrepliedComments.length);
  const selectedComment = unrepliedComments[randomIndex];

  selectedComment.element.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  // Tạo toast
  const toast = document.createElement("div");
  toast.innerText = "<- Bạn chưa trả lời comment này 👀";
  toast.style.cssText = `
    background-color: #facc15;
    color: #000;
    padding: 8px 16px;
    border-radius: 8px;
    position: relative;
    margin-top: 8px;
    font-size: 14px;
    max-height: 150px;
    font-weight: bold;
    animation: fadeInOut 3s ease-in-out forwards;
    width: fit-content;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  `;

  // Thêm animation CSS nếu chưa có
  if (!document.getElementById("toast-style")) {
    const style = document.createElement("style");
    style.id = "toast-style";
    style.innerHTML = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-5px); }
        10% { opacity: 1; transform: translateY(0); }
        90% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-5px); }
      }
    `;
    document.head.appendChild(style);
  }

  // Gắn toast vào comment
  selectedComment.element.appendChild(toast);

  // Xoá toast sau 3 giây
  setTimeout(() => {
    toast.remove();
  }, 3000);

  await sleep(2300);

  // get user comment
  const userLink = selectedComment.element.querySelector(
    'div[data-testid="User-Name"] a[href]'
  );

  const usernameHref = userLink.getAttribute("href"); // ví dụ: "/user123"
  const username = usernameHref.replace("/", ""); // bỏ dấu "/" đầu
  console.log("👤 Username:", username);

  selectedComment.element.click();

  console.log("return username");
  return username.toLowerCase();
}
