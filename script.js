import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { auth, db, isFirebaseConfigured } from "./firebase-config.js";

const DEMO_PUBLICATIONS = [
  {
    id: "demo-1",
    title: "Smart Irrigation Techniques for Sustainable Campus Farming",
    description: "A student-led study on IoT-based irrigation methods for water conservation in institutional farms.",
    category: "Science",
    authorName: "Aarya Kulkarni",
    authorDepartment: "B.Sc. Environmental Science",
    status: "Approved",
    isPublished: true,
    downloadCount: 18,
    fileUrl: "#",
    createdLabel: "March 2026"
  },
  {
    id: "demo-2",
    title: "Microbial Diversity in Urban Freshwater Samples",
    description: "An undergraduate science paper documenting microbial variations across collected city water sources.",
    category: "Science",
    authorName: "Rohan Patil",
    authorDepartment: "B.Sc. Microbiology",
    status: "Approved",
    isPublished: true,
    downloadCount: 11,
    fileUrl: "#",
    createdLabel: "February 2026"
  },
  {
    id: "demo-3",
    title: "Digital Payment Behaviour Among College Students",
    description: "A commerce-focused survey that evaluates changes in digital transaction habits across student groups.",
    category: "Commerce",
    authorName: "Sneha Joshi",
    authorDepartment: "B.Com",
    status: "Approved",
    isPublished: true,
    downloadCount: 9,
    fileUrl: "#",
    createdLabel: "January 2026"
  }
];

const DEMO_SUBMISSIONS = [
  {
    id: "sub-1",
    title: "AI in Regional Language Preservation",
    description: "A paper on using machine learning tools to preserve regional language texts.",
    category: "Arts",
    status: "Pending",
    remarks: "",
    isPublished: false,
    authorName: "Demo Student",
    fileUrl: "https://example.com/sample-arts-paper.pdf",
    pdfLink: "https://example.com/sample-arts-paper.pdf",
    createdLabel: "March 2026"
  },
  {
    id: "sub-2",
    title: "Renewable Energy Adoption in Rural Colleges",
    description: "Research about solar energy implementation and maintenance planning for campus buildings.",
    category: "Science",
    status: "Approved",
    remarks: "Well-structured study. Ready for publication.",
    isPublished: true,
    authorName: "Demo Student",
    fileUrl: "https://example.com/sample-science-paper.pdf",
    pdfLink: "https://example.com/sample-science-paper.pdf",
    createdLabel: "February 2026"
  }
];

const state = {
  currentUser: null,
  currentUserProfile: null,
  isAdmin: false,
  publications: [...DEMO_PUBLICATIONS],
  userSubmissions: [],
  adminSubmissions: [...DEMO_SUBMISSIONS]
};

document.addEventListener("DOMContentLoaded", () => {
  applySavedTheme();
  setupNavigation();
  setupThemeToggle();
  setupAuthTabs();
  setupCategoryField();
  setupContactForm();
  bindSearchAndFilters();
  updateFirebaseNotice();
  initializeApplication();
});

function setupNavigation() {
  const navToggle = document.getElementById("navToggle");
  const siteNav = document.getElementById("siteNav");

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", () => {
      siteNav.classList.toggle("open");
    });
  }
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem("sarhad-theme") || "light";
  document.documentElement.dataset.theme = savedTheme;
  document.body.dataset.theme = savedTheme;
}

function setupThemeToggle() {
  const themeToggle = document.getElementById("themeToggle");
  if (!themeToggle) {
    return;
  }

  updateThemeToggleLabel(themeToggle);
  themeToggle.addEventListener("click", () => {
    const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    document.body.dataset.theme = nextTheme;
    localStorage.setItem("sarhad-theme", nextTheme);
    updateThemeToggleLabel(themeToggle);
  });
}

function updateThemeToggleLabel(themeToggle) {
  const isDark = document.body.dataset.theme === "dark";
  themeToggle.textContent = isDark ? "☀" : "☾";
  themeToggle.title = isDark ? "Switch to light mode" : "Switch to dark mode";
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
}

function setupAuthTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  if (!tabButtons.length) {
    return;
  }

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((tab) => tab.classList.remove("active"));
      document.querySelectorAll(".auth-form").forEach((form) => form.classList.remove("active"));
      button.classList.add("active");
      const activeForm = document.getElementById(`${button.dataset.tab}Form`);
      if (activeForm) {
        activeForm.classList.add("active");
      }
    });
  });
}

function setupContactForm() {
  const contactForm = document.getElementById("contactForm");
  if (!contactForm) {
    return;
  }

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    contactForm.reset();
    showToast("Message noted. You can connect this form to EmailJS or Firestore later.");
  });
}

function setupCategoryField() {
  const categoryField = document.getElementById("articleCategory");
  const otherCategoryGroup = document.getElementById("otherCategoryGroup");
  const otherCategoryInput = document.getElementById("otherCategory");

  if (!categoryField || !otherCategoryGroup || !otherCategoryInput) {
    return;
  }

  const syncOtherCategoryField = () => {
    const showOther = categoryField.value === "Other";
    otherCategoryGroup.classList.toggle("hidden", !showOther);
    otherCategoryInput.required = showOther;
    if (!showOther) {
      otherCategoryInput.value = "";
    }
  };

  syncOtherCategoryField();
  categoryField.addEventListener("change", syncOtherCategoryField);
}

function bindSearchAndFilters() {
  const searchField = document.getElementById("searchPublications");
  const categoryField = document.getElementById("filterCategory");

  if (searchField) {
    searchField.addEventListener("input", renderPublicationsPage);
  }

  if (categoryField) {
    categoryField.addEventListener("change", renderPublicationsPage);
  }
}

function updateFirebaseNotice() {
  return;
}

function initializeApplication() {
  renderHomePage();
  renderPublicationsPage();
  renderSubmissionPage();
  renderAdminPage();
  renderCurrentUserCard();

  if (!isFirebaseConfigured) {
    setupDemoActions();
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    state.currentUser = user;
    updateAuthNav();
    renderSubmissionPage();
    renderAdminPage();
    renderCurrentUserCard();

    if (!user) {
      state.currentUserProfile = null;
      state.isAdmin = false;
      state.userSubmissions = [];
      state.adminSubmissions = [...DEMO_SUBMISSIONS];
      renderSubmissionPage();
      renderAdminPage();
      await loadPublications();
      return;
    }

    try {
      state.currentUserProfile = await fetchUserProfile(user.uid);
      state.isAdmin = state.currentUserProfile?.role === "admin";

      updateAuthNav();
      renderCurrentUserCard();
      renderSubmissionPage();
      renderAdminPage();

      await Promise.all([
        loadPublications(),
        loadUserSubmissions(),
        loadAdminSubmissions()
      ]);
    } catch (error) {
      showToast("Login worked, but some account data could not be loaded yet.");
      console.error(error);
      renderSubmissionPage();
      renderAdminPage();
      renderCurrentUserCard();
    }
  });

  setupAuthHandlers();
  setupSubmissionHandler();
}

function setupDemoActions() {
  updateAuthNav();
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const submissionForm = document.getElementById("submissionForm");

  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      showToast("Login is not available right now.");
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      showToast("Registration is not available right now.");
    });
  }

  if (submissionForm) {
    submissionForm.addEventListener("submit", (event) => {
      event.preventDefault();
      showToast("Submission is not available right now.");
    });
  }
}

function setupAuthHandlers() {
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
  const logoutButton = document.getElementById("logoutButton");
  const resetPasswordButton = document.getElementById("resetPasswordButton");
  const editNameToggle = document.getElementById("editNameToggle");
  const editNameForm = document.getElementById("editNameForm");
  const editNameInput = document.getElementById("editNameInput");

  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const name = document.getElementById("registerName").value.trim();
      const department = document.getElementById("registerDepartment").value.trim();
      const email = document.getElementById("registerEmail").value.trim();
      const password = document.getElementById("registerPassword").value;

      try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", credential.user.uid), {
          name,
          department,
          email,
          role: "author",
          createdAt: serverTimestamp()
        });
        registerForm.reset();
        showToast("Account created successfully.");
      } catch (error) {
        showToast(getFriendlyErrorMessage(error, "register"));
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      try {
        await signInWithEmailAndPassword(auth, email, password);
        loginForm.reset();
        showToast("Logged in successfully.");
      } catch (error) {
        showToast(getFriendlyErrorMessage(error, "login"));
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      await signOut(auth);
      showToast("Logged out.");
    });
  }

  if (resetPasswordButton) {
    resetPasswordButton.addEventListener("click", async () => {
      const email = document.getElementById("loginEmail").value.trim();

      if (!email) {
        showToast("Enter your email address first to reset the password.");
        return;
      }

      try {
        const response = await fetch(`${getApiBaseUrl()}/api/auth/reset-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Password reset failed.");
        }

        showToast("Password reset link sent to your email.");
      } catch (error) {
        showToast(getFriendlyErrorMessage(error, "reset"));
      }
    });
  }

  if (editNameToggle && editNameForm && editNameInput) {
    editNameToggle.addEventListener("click", () => {
      if (!state.currentUser) {
        showToast("Please log in to edit your name.");
        return;
      }

      editNameInput.value = state.currentUserProfile?.name || "";
      editNameForm.classList.toggle("hidden");
    });

    editNameForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!state.currentUser) {
        showToast("Please log in to edit your name.");
        return;
      }

      const updatedName = editNameInput.value.trim();
      if (!updatedName) {
        showToast("Please enter a valid name.");
        return;
      }

      try {
        await updateDoc(doc(db, "users", state.currentUser.uid), {
          name: updatedName
        });
        state.currentUserProfile = {
          ...state.currentUserProfile,
          name: updatedName
        };
        renderCurrentUserCard();
        editNameForm.classList.add("hidden");
        showToast("Name updated successfully.");
      } catch (error) {
        showToast(getFriendlyErrorMessage(error, "profile"));
      }
    });
  }
}

function setupSubmissionHandler() {
  const submissionForm = document.getElementById("submissionForm");
  if (!submissionForm) {
    return;
  }

  submissionForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!state.currentUser) {
      showToast("Please log in before submitting your article.");
      return;
    }

    const title = document.getElementById("articleTitle").value.trim();
    const categorySelection = document.getElementById("articleCategory").value;
    const otherCategoryValue = document.getElementById("otherCategory")?.value.trim() || "";
    const description = document.getElementById("articleDescription").value.trim();
    const pdfLink = document.getElementById("articlePdfLink").value.trim();
    const category = categorySelection === "Other" ? otherCategoryValue : categorySelection;

    if (!category) {
      showToast("Please choose a category or specify another one.");
      return;
    }

    if (!isValidUrl(pdfLink)) {
      showToast("Please enter a valid public PDF link.");
      return;
    }

    try {
      await addDoc(collection(db, "submissions"), {
        title,
        category,
        description,
        pdfLink,
        fileUrl: pdfLink,
        status: "Pending",
        remarks: "",
        isPublished: false,
        downloadCount: 0,
        authorId: state.currentUser.uid,
        authorName: state.currentUserProfile?.name || state.currentUser.email,
        authorDepartment: state.currentUserProfile?.department || "Department not added",
        authorEmail: state.currentUser.email,
        createdAt: serverTimestamp()
      });

      submissionForm.reset();
      setupCategoryField();
      showToast("Article submitted for review.");
      await loadUserSubmissions();
      await loadPublications();
    } catch (error) {
      showToast(getFriendlyErrorMessage(error, "submit"));
    }
  });
}

async function loadPublications() {
  if (!isFirebaseConfigured) {
    renderHomePage();
    renderPublicationsPage();
    return;
  }

  const publicationQuery = query(
    collection(db, "submissions"),
    where("isPublished", "==", true)
  );
  const snapshot = await getDocs(publicationQuery);
  state.publications = snapshot.docs
    .map((item) => ({
      id: item.id,
      ...item.data(),
      createdLabel: formatDate(item.data().createdAt)
    }))
    .sort((a, b) => getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt));

  renderHomePage();
  renderPublicationsPage();
}

async function loadUserSubmissions() {
  if (!isFirebaseConfigured || !state.currentUser) {
    state.userSubmissions = [];
    renderSubmissionPage();
    return;
  }

  const submissionQuery = query(
    collection(db, "submissions"),
    where("authorId", "==", state.currentUser.uid)
  );
  const snapshot = await getDocs(submissionQuery);
  state.userSubmissions = snapshot.docs
    .map((item) => ({
      id: item.id,
      ...item.data(),
      createdLabel: formatDate(item.data().createdAt)
    }))
    .sort((a, b) => getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt));

  renderSubmissionPage();
}

async function loadAdminSubmissions() {
  const list = document.getElementById("adminSubmissionList");
  if (!list) {
    return;
  }

  if (!isFirebaseConfigured || !state.isAdmin) {
    renderAdminPage();
    return;
  }

  const adminQuery = query(collection(db, "submissions"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(adminQuery);
  state.adminSubmissions = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
    createdLabel: formatDate(item.data().createdAt)
  }));

  renderAdminPage();
}

async function fetchUserProfile(uid) {
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? snapshot.data() : null;
}

function renderHomePage() {
  const featuredContainer = document.getElementById("featuredPublications");
  const authorContainer = document.getElementById("topAuthors");

  if (!featuredContainer && !authorContainer) {
    updateHomeStats();
    return;
  }

  const featuredItems = state.publications.slice(0, 3);
  if (featuredContainer) {
    featuredContainer.innerHTML = featuredItems.length
      ? featuredItems.map((publication) => publicationCardTemplate(publication, true)).join("")
      : emptyStateTemplate("No published articles yet.", "Approved work will appear here.");
  }

  if (authorContainer) {
    const authorMap = new Map();
    state.publications.forEach((item) => {
      const count = authorMap.get(item.authorName) || { name: item.authorName, department: item.authorDepartment || "Academic Author", total: 0 };
      count.total += 1;
      authorMap.set(item.authorName, count);
    });

    const topAuthors = [...authorMap.values()].sort((a, b) => b.total - a.total).slice(0, 4);
    authorContainer.innerHTML = topAuthors.length
      ? topAuthors.map((author) => `
          <article class="author-card">
            <p class="eyebrow">Top Author</p>
            <h3>${author.name}</h3>
            <p>${author.department}</p>
            <div class="meta-row">
              <span>${author.total} publication(s)</span>
            </div>
          </article>
        `).join("")
      : emptyStateTemplate("Author statistics will appear here.", "Publish more articles to build the leaderboard.");
  }

  updateHomeStats();
}

function renderSubmissionPage() {
  const submitAuthMessage = document.getElementById("submitAuthMessage");
  const submissionForm = document.getElementById("submissionForm");
  const submissionList = document.getElementById("userSubmissionList");

  if (!submissionList) {
    return;
  }

  const showForm = !isFirebaseConfigured || !!state.currentUser;
  if (submissionForm) {
    submissionForm.classList.toggle("hidden", !showForm);
  }
  if (submitAuthMessage) {
    submitAuthMessage.classList.toggle("hidden", showForm);
  }

  submissionList.innerHTML = state.userSubmissions.length
    ? state.userSubmissions.map((submission) => submissionTemplate(submission)).join("")
    : emptyStateTemplate("No submissions found.", "Your submitted articles will appear here.");

  bindCertificateButtons();
}

function renderPublicationsPage() {
  const publicationsGrid = document.getElementById("publicationsGrid");
  if (!publicationsGrid) {
    return;
  }

  const searchField = document.getElementById("searchPublications");
  const categoryField = document.getElementById("filterCategory");
  const searchValue = searchField ? searchField.value.trim().toLowerCase() : "";
  const categoryValue = categoryField ? categoryField.value : "All";

  const filteredPublications = state.publications.filter((publication) => {
    const matchesSearch =
      publication.title.toLowerCase().includes(searchValue) ||
      (publication.authorName || "").toLowerCase().includes(searchValue);
    const matchesCategory = categoryValue === "All" || publication.category === categoryValue;
    return matchesSearch && matchesCategory;
  });

  publicationsGrid.innerHTML = filteredPublications.length
    ? filteredPublications.map((publication) => publicationCardTemplate(publication, false)).join("")
    : emptyStateTemplate("No publications match your search.", "Try a different title, author, or category.");

  bindPublicationButtons();
}

function renderAdminPage() {
  const adminAccessMessage = document.getElementById("adminAccessMessage");
  const adminList = document.getElementById("adminSubmissionList");

  if (!adminList) {
    return;
  }

  const allowAccess = !isFirebaseConfigured || state.isAdmin;
  adminAccessMessage?.classList.toggle("hidden", allowAccess);
  adminList.classList.toggle("hidden", !allowAccess);

  if (!allowAccess) {
    return;
  }

  adminList.innerHTML = state.adminSubmissions.length
    ? state.adminSubmissions.map((submission) => adminSubmissionTemplate(submission)).join("")
    : emptyStateTemplate("No submissions available.", "Articles submitted by authors will appear here.");

  updateAdminSummary();
  bindAdminButtons();
}

function renderCurrentUserCard() {
  const currentUserCard = document.getElementById("currentUserCard");
  const logoutButton = document.getElementById("logoutButton");
  const editNameToggle = document.getElementById("editNameToggle");
  const editNameForm = document.getElementById("editNameForm");
  if (!currentUserCard) {
    return;
  }

  if (!state.currentUser) {
    currentUserCard.innerHTML = `
      <div class="remarks-box">
        <p class="helper-text">No user is currently logged in.</p>
      </div>
    `;
    if (logoutButton) {
      logoutButton.classList.add("hidden");
    }
    if (editNameToggle) {
      editNameToggle.classList.add("hidden");
    }
    if (editNameForm) {
      editNameForm.classList.add("hidden");
    }
    return;
  }

  currentUserCard.innerHTML = `
    <div class="remarks-box">
      <p><strong>Name:</strong> ${state.currentUserProfile?.name || "Not available"}</p>
      <p><strong>Email:</strong> ${state.currentUser.email}</p>
      <p><strong>Role:</strong> ${state.currentUserProfile?.role || "author"}</p>
      <p><strong>Department:</strong> ${state.currentUserProfile?.department || "Not added"}</p>
    </div>
  `;
  if (logoutButton) {
    logoutButton.classList.remove("hidden");
  }
  if (editNameToggle) {
    editNameToggle.classList.remove("hidden");
  }
}

function updateAuthNav() {
  const authNavLink = document.getElementById("authNavLink");
  if (!authNavLink) {
    return;
  }

  if (state.currentUser) {
    authNavLink.textContent = "My Account";
    authNavLink.href = "auth.html";
  } else {
    authNavLink.textContent = "Login / Register";
    authNavLink.href = "auth.html";
  }
}

function updateHomeStats() {
  const totalSubmissions = Math.max(state.userSubmissions.length, state.adminSubmissions.length);
  setText("heroSubmissionCount", `${Math.max(totalSubmissions, 12)}+`);
  setText("heroPublicationCount", `${Math.max(state.publications.length, 6)}+`);

  const authors = new Set(state.publications.map((item) => item.authorName));
  setText("heroAuthorCount", `${Math.max(authors.size, 4)}+`);
}

function updateAdminSummary() {
  const pending = state.adminSubmissions.filter((item) => item.status === "Pending").length;
  const approved = state.adminSubmissions.filter((item) => item.status === "Approved").length;
  const rejected = state.adminSubmissions.filter((item) => item.status === "Rejected").length;
  const published = state.adminSubmissions.filter((item) => item.isPublished).length;

  setText("pendingCount", pending);
  setText("approvedCount", approved);
  setText("rejectedCount", rejected);
  setText("publishedCount", published);
}

function bindPublicationButtons() {
  document.querySelectorAll("[data-download-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const submissionId = button.dataset.downloadId;
      const submission = state.publications.find((item) => item.id === submissionId);

      if (!submission || !submission.fileUrl || submission.fileUrl === "#") {
        showToast("PDF link is not available for this publication yet.");
        return;
      }

      if (isFirebaseConfigured) {
        await updateDoc(doc(db, "submissions", submissionId), {
          downloadCount: increment(1)
        });
        await loadPublications();
      }

      window.open(submission.fileUrl, "_blank", "noopener,noreferrer");
    });
  });
}

function bindCertificateButtons() {
  document.querySelectorAll("[data-certificate-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const submissionId = button.dataset.certificateId;
      const submission = state.userSubmissions.find((item) => item.id === submissionId);
      if (!submission) {
        return;
      }

      generateCertificate(submission);
    });
  });
}

function bindAdminButtons() {
  document.querySelectorAll("[data-admin-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!isFirebaseConfigured) {
        showToast("Admin actions will work after Firebase is configured.");
        return;
      }

      const card = button.closest(".admin-item");
      const submissionId = button.dataset.id;
      const action = button.dataset.adminAction;
      const remarkInput = card.querySelector("textarea");
      const remarks = remarkInput.value.trim();

      const payload = { remarks };

      if (action === "approve") {
        payload.status = "Approved";
      }

      if (action === "reject") {
        payload.status = "Rejected";
        payload.isPublished = false;
      }

      if (action === "publish") {
        payload.status = "Approved";
        payload.isPublished = true;
        payload.publishedAt = serverTimestamp();
      }

      try {
        await updateDoc(doc(db, "submissions", submissionId), payload);
        const actionLabel = action === "approve" ? "approved" : action === "reject" ? "rejected" : "published";
        showToast(`Submission ${actionLabel} successfully.`);
        await Promise.all([loadAdminSubmissions(), loadPublications()]);
      } catch (error) {
        showToast(getFriendlyErrorMessage(error, "admin"));
      }
    });
  });
}

function generateCertificate(submission) {
  const certificateWindow = window.open("", "_blank", "width=900,height=700");
  if (!certificateWindow) {
    showToast("Please allow popups to open the certificate preview.");
    return;
  }

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  certificateWindow.document.write(`
    <html>
      <head>
        <title>Publication Certificate</title>
        <style>
          body {
            font-family: Georgia, serif;
            padding: 40px;
            color: #1b2a41;
            background: #f7f2e8;
          }
          .certificate {
            border: 10px solid #a86d2a;
            padding: 40px;
            text-align: center;
            background: #fffdf8;
          }
          h1 {
            font-size: 48px;
            margin-bottom: 10px;
          }
          h2 {
            font-size: 32px;
            margin: 16px 0;
          }
          p {
            font-size: 18px;
            line-height: 1.7;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <h1>Certificate of Publication</h1>
          <p>This certifies that</p>
          <h2>${submission.authorName || "Author"}</h2>
          <p>has successfully published the academic work titled</p>
          <h2>${submission.title}</h2>
          <p>through Sarhad International Publisher.</p>
          <p>Category: ${submission.category}</p>
          <p>Date: ${today}</p>
        </div>
      </body>
    </html>
  `);
  certificateWindow.document.close();
}

function submissionTemplate(submission) {
  const canGenerateCertificate = submission.status === "Approved";
  return `
    <article class="submission-item">
      <div class="meta-row">
        <span class="category-chip">${submission.category}</span>
        <span class="status-badge ${statusClass(submission.status)}">${submission.status}</span>
      </div>
      <h3>${submission.title}</h3>
      <p>${submission.description}</p>
      <div class="meta-row">
        <span>Submitted: ${submission.createdLabel || "Recently"}</span>
        <span>PDF Link: ${submission.fileUrl ? "Added" : "Not added"}</span>
      </div>
      ${submission.remarks ? `<div class="remarks-box"><strong>Admin remarks:</strong> ${submission.remarks}</div>` : ""}
      ${canGenerateCertificate ? `
        <div class="certificate-box">
          <p>Your article has been approved. You can generate a publication certificate.</p>
          <button class="button button-secondary" data-certificate-id="${submission.id}">Generate Certificate</button>
        </div>
      ` : ""}
    </article>
  `;
}

function adminSubmissionTemplate(submission) {
  return `
    <article class="admin-item">
      <div class="meta-row">
        <span class="category-chip">${submission.category}</span>
        <span class="status-badge ${statusClass(submission.status)}">${submission.status}</span>
        <span>${submission.authorName || "Unknown author"}</span>
      </div>
      <h3>${submission.title}</h3>
      <p>${submission.description}</p>
      <div class="meta-row">
        <span>Email: ${submission.authorEmail || "Not available"}</span>
        <span>Published: ${submission.isPublished ? "Yes" : "No"}</span>
      </div>
      <div class="input-group">
        <label>Add Remarks</label>
        <textarea rows="4" placeholder="Write admin remarks">${submission.remarks || ""}</textarea>
      </div>
      <div class="admin-actions">
        <button class="button button-success" data-admin-action="approve" data-id="${submission.id}">Approve</button>
        <button class="button button-danger" data-admin-action="reject" data-id="${submission.id}">Reject</button>
        <button class="button button-secondary" data-admin-action="publish" data-id="${submission.id}">Publish</button>
        <a class="button button-secondary" href="${submission.fileUrl || "#"}" target="_blank" rel="noopener noreferrer">View PDF</a>
      </div>
    </article>
  `;
}

function publicationCardTemplate(publication, compact) {
  return `
    <article class="publication-card">
      <div class="meta-row">
        <span class="category-chip">${publication.category}</span>
        <span>${publication.createdLabel || "Recently added"}</span>
      </div>
      <h3>${publication.title}</h3>
      <p>${publication.description}</p>
      <div class="meta-row">
        <span>Author: ${publication.authorName || "Academic Author"}</span>
        <span>${publication.authorDepartment || "Student Researcher"}</span>
      </div>
      <div class="meta-row">
        <span>Downloads: ${publication.downloadCount || 0}</span>
      </div>
      <div class="publication-actions">
        <a class="button button-secondary" href="${publication.fileUrl || "#"}" target="_blank" rel="noopener noreferrer">Read PDF</a>
        ${compact ? "" : `<button class="button button-primary" data-download-id="${publication.id}">Download</button>`}
      </div>
    </article>
  `;
}

function emptyStateTemplate(title, text) {
  return `
    <div class="empty-state">
      <h3>${title}</h3>
      <p>${text}</p>
    </div>
  `;
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getApiBaseUrl() {
  const { protocol, hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${protocol}//${hostname}:3001`;
  }

  return window.location.origin;
}

function getFriendlyErrorMessage(error, context) {
  const errorCode = error?.code || "";

  if (context === "register") {
    if (errorCode === "auth/email-already-in-use") {
      return "This email is already registered. Please log in instead.";
    }
    if (errorCode === "auth/invalid-email") {
      return "Please enter a valid email address.";
    }
    if (errorCode === "auth/weak-password") {
      return "Password is too weak. Please use at least 6 characters.";
    }
    return "We could not create your account right now. Please try again.";
  }

  if (context === "login") {
    if (errorCode === "auth/invalid-credential" || errorCode === "auth/wrong-password" || errorCode === "auth/user-not-found") {
      return "Incorrect email or password. Please try again.";
    }
    if (errorCode === "auth/invalid-email") {
      return "Please enter a valid email address.";
    }
    return "We could not log you in right now. Please try again.";
  }

  if (context === "reset") {
    const message = error?.message || "";
    if (message.includes("valid email")) {
      return "Please enter a valid email address.";
    }
    if (message.includes("No account was found")) {
      return "No account was found with that email address.";
    }
    if (message.includes("Failed to fetch")) {
      return "Password reset service is not running right now.";
    }
    return "We could not send the password reset link right now. Please try again.";
  }

  if (context === "profile") {
    return "We could not update your name right now. Please try again.";
  }

  if (context === "submit") {
    return "We could not submit your article right now. Please try again.";
  }

  if (context === "admin") {
    return "The update could not be completed right now. Please try again.";
  }

  return "Something went wrong. Please try again.";
}

function formatDate(timestamp) {
  if (!timestamp?.seconds) {
    return "Recently";
  }

  return new Date(timestamp.seconds * 1000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getTimestampValue(timestamp) {
  if (!timestamp?.seconds) {
    return 0;
  }

  return timestamp.seconds * 1000;
}

function statusClass(status) {
  const value = (status || "").toLowerCase();
  if (value === "approved") {
    return "status-approved";
  }
  if (value === "rejected") {
    return "status-rejected";
  }
  return "status-pending";
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => toast.classList.remove("show"), 2800);
}
