import { setupInteractionAudio } from "./interaction-audio.js?v=20260915-90";
import { createScene } from "./scene.js?v=20260915-93";
import { setupEvalTiles } from "./eval-tiles.js?v=20260912-24";

setupInteractionAudio();

const root = document.documentElement;
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let reduceMotion = motionPreference.matches;
motionPreference.addEventListener("change", () => {
  reduceMotion = motionPreference.matches;
  if (reduceMotion) {
    document.querySelectorAll("[data-reveal]").forEach((element) => {
      element.getAnimations().forEach((animation) => animation.finish());
    });
  }
});
const themeToggle = document.querySelector(".theme-toggle");
const themeLabels = { dark: "dark mode", light: "light mode" };
let scene = null;
let savedTheme = null;

try {
  const stored = window.localStorage.getItem("calissa-theme");
  if (Object.hasOwn(themeLabels, stored)) savedTheme = stored;
} catch {}

const setTheme = (theme, persist = true) => {
  if (!Object.hasOwn(themeLabels, theme)) return;
  root.dataset.theme = theme;
  const dark = theme === "dark";
  themeToggle?.setAttribute(
    "aria-label",
    `Switch to ${dark ? "light" : "dark"} mode`,
  );
  themeToggle?.setAttribute("aria-pressed", String(dark));
  themeToggle?.setAttribute("title", `Current: ${themeLabels[theme]}`);
  if (persist) {
    savedTheme = theme;
    try {
      window.localStorage.setItem("calissa-theme", theme);
    } catch {}
  }
};

setTheme(savedTheme || root.dataset.theme || "dark", false);
const header = document.querySelector(".site-header");
const opening = document.querySelector(".shophouse-hero");
if (header && opening) {
  new IntersectionObserver(
    ([entry]) => {
      header.classList.toggle("is-scrolled", !entry.isIntersecting);
    },
    { rootMargin: "-100px 0px 0px 0px" },
  ).observe(opening);
}
themeToggle?.addEventListener("click", () => {
  const theme = root.dataset.theme === "dark" ? "light" : "dark";
  setTheme(theme);
  scene?.setTheme(theme);
});

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        observer.unobserve(target);
        if (reduceMotion) return;
        target.animate(
          [
            { opacity: 0.8, transform: "translateY(14px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 540, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
        );
      });
    },
    { threshold: 0.08 },
  );
  document
    .querySelectorAll("[data-reveal]")
    .forEach((item) => revealObserver.observe(item));
}

setupEvalTiles();

const sgsfModal = document.querySelector(".sgsf-modal");
const sgsfModalCard = document.querySelector(".sgsf-modal-card");
const sgsfModalMeta = document.querySelector("#sgsf-modal-meta");
const sgsfModalTitle = document.querySelector("#sgsf-modal-title");
const sgsfModalBody = document.querySelector("#sgsf-modal-body");
let lastSgsfTrigger = null;

const sgsfNotes = {
  letter: {
    meta: "Bay Garden / SG -> SF",
    title: "A letter between cities",
    body: [
      "Singapore gave me an instinct for efficiency, high trust, and global systems that work for diverse users. San Francisco pulls me toward the future of frontier research, shipping at scale, and ambitious products.",
      "I like bridging the gap between the two: careful enough to mitigate risk, and curious enough to build thoughtfully anyway.",
    ],
  },
  dispatch: {
    meta: "Dispatch / one way",
    title: "SF is calling",
    body: [
      "To the version of me who said she would think about it later: let's stop thinking, let's start building.",
      "A postcard for momentum, taste, and the kind of work that asks me to stay curious while staying careful.",
    ],
  },
  poem: {
    meta: "Field note / poem",
    title: "Field note",
    poem: "somewhere between\nan angsana tree\nand a cable car\n\nI am trying to build\ncloser to the frontier\nwithout forgetting\nwhere my sense of safety\ncame from",
  },
};

const openSgsfModal = (kind, trigger) => {
  const note = sgsfNotes[kind];
  if (
    !note ||
    !sgsfModal ||
    !sgsfModalCard ||
    !sgsfModalMeta ||
    !sgsfModalTitle ||
    !sgsfModalBody
  )
    return;
  lastSgsfTrigger = trigger;
  sgsfModalMeta.textContent = note.meta;
  sgsfModalTitle.textContent = note.title;
  sgsfModalBody.replaceChildren();
  const paragraphs = note.poem ? [note.poem] : note.body;
  paragraphs.forEach((text) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    if (note.poem) paragraph.className = "sgsf-poem-full";
    sgsfModalBody.append(paragraph);
  });
  sgsfModal.showModal();
  document.body.classList.add("modal-open");
  sgsfModalCard.scrollTop = 0;
  sgsfModalCard.focus();
};

document.querySelectorAll("[data-sgsf-modal]").forEach((trigger) => {
  trigger.addEventListener("click", () =>
    openSgsfModal(trigger.dataset.sgsfModal, trigger),
  );
});
sgsfModal?.querySelectorAll("[data-sgsf-close]").forEach((control) => {
  control.addEventListener("click", () => sgsfModal.close());
});
sgsfModal?.addEventListener("click", (event) => {
  if (event.target === sgsfModal) sgsfModal.close();
});
sgsfModal?.addEventListener("close", () => {
  document.body.classList.remove("modal-open");
  lastSgsfTrigger?.focus();
});

const books = [
  {
    title: "We Are Bellingcat",
    meta: "Eliot Higgins",
    color: "#008d9a",
    review:
      "A book that maps onto my SOCMINT hobby: following traces, finding unlikely sources of knowledge, and learning new hacks or networks. It's the same curiosity I bring to evals: keep asking where the evidence lives, who can see or measure it, and searching for unknown unknowns.",
  },
  {
    title: "The Book of Tea",
    meta: "OKAKURA KAKUZŌ",
    color: "#2f6fba",
    review:
      '"Teaism is the art of concealing beauty that you may discover it, of suggesting what you dare not reveal." I like how Okakura treats taste as attention, humility, and restraint. The line "Those who cannot feel the littleness of great things in themselves are apt to overlook the greatness of little things in others" feels close to how I think about human relationships too.',
  },
  {
    title:
      "The Idea Factory: Bell Labs and the Great Age of American Innovation",
    meta: "Jon Gertner",
    color: "#19b8c7",
    review:
      "A timely reminder about innovation - it's not just lone genius, but through teams, tools, taste, and institutions that make ambitious research possible. The future is won by those who can connect science, engineering, product judgment, and the patience to make bold bets.",
  },
  {
    title: "Build",
    meta: "Tony Fadell",
    color: "#0f4c81",
    review:
      "I like Build as a field manual for turning taste into shipped things (when to trust data, when to use judgment, how to make abstract ideas tangible, and why storytelling matters when you need people to build with you).",
  },
  {
    title: "Aesthetic Intelligence",
    meta: "Pauline Brown",
    color: "#b84442",
    review:
      "Understanding what exact aesthetics move people and compel them to act/consume/support a brand is crucial, and those who can truly define what's hot/not will stand out. Essay in the works!",
  },
];

const bookButtons = Array.from(
  document.querySelectorAll("button[data-book]"),
).filter((button) => books[Number(button.dataset.book)]);
const review = document.querySelector(".book-review");
const reviewTitle = document.querySelector("#review-title");
const reviewMeta = document.querySelector("#review-meta");
const reviewText = document.querySelector("#review-text");

const selectBook = (index, animate = true) => {
  const book = books[index];
  if (!book || !review || !reviewTitle || !reviewMeta || !reviewText) return;
  bookButtons.forEach((button) => {
    const selected = Number(button.dataset.book) === index;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  review.style.setProperty("--active-book-color", book.color);
  review.dataset.book = String(index);
  reviewTitle.textContent = book.title;
  reviewMeta.textContent = book.meta;
  reviewText.textContent = book.review;
  reviewText.hidden = !book.review;
  if (animate && !reduceMotion) {
    review.getAnimations().forEach((animation) => animation.cancel());
    review.animate([{ opacity: 0.6 }, { opacity: 1 }], {
      duration: 230,
      easing: "ease-out",
    });
  }
};

bookButtons.forEach((button) => {
  button.addEventListener("click", () =>
    selectBook(Number(button.dataset.book)),
  );
});
selectBook(0, false);

try {
  scene = await createScene({
    initialTheme: savedTheme,
    onThemeChange: (theme) => setTheme(theme, false),
    onLiveMode: () => {
      savedTheme = null;
      try {
        window.localStorage.removeItem("calissa-theme");
      } catch {}
    },
  });
} catch (error) {
  console.warn(
    "The interactive scene could not load. The image and content remain available.",
    error,
  );
}
if (savedTheme) {
  setTheme(savedTheme, false);
  scene?.setTheme(savedTheme);
}
