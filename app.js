// =====================================================
// SUPABASE
// =====================================================
const SUPABASE_URL = "https://ijnetiyxrxxfhurlsnbc.supabase.co";
const SUPABASE_KEY = "sb_publishable_dnjsWgsrPMUQov5JTJuthw_KEAqjMfK";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =====================================================
// ESTADO
// =====================================================
let currentUser = null;
let currentProfile = null;
let projects = [];
let tasks = [];
let profiles = [];
let projectMembers = [];
let taskMembers = [];
let editingProject = null;
let editingTask = null;
let activeModalMode = null;
let selectedTeamProfile = null;
let selectedProject = null;
let isSavingModal = false;
let avatarUploadInFlight = false;
let autoPriorityInterval = null;
let liveColorInterval = null;
const PAGES = ["dashboard", "projects", "tasks", "team", "organization"];
const AVATAR_MAX_DIMENSION = 240;
const AVATAR_JPEG_QUALITY = 0.72;

// =====================================================
// ELEMENTOS
// =====================================================
const loginScreen = document.getElementById("loginScreen");
const app = document.getElementById("app");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const loginSubmitButton = document.getElementById("loginSubmitButton");
const loginSubmitLabel = document.getElementById("loginSubmitLabel");
const sidebar = document.getElementById("sidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const menuToggle = document.getElementById("menuToggle");
const closeSidebarButton = document.getElementById("closeSidebar");
const backButton = document.getElementById("backButton");
const logoutButton = document.getElementById("logoutButton");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalFields = document.getElementById("modalFields");
const modalForm = document.getElementById("modalForm");
const closeModal = document.getElementById("closeModal");
const cancelModal = document.getElementById("cancelModal");
const teamList = document.getElementById("teamList");
const teamOverview = document.getElementById("teamOverview");
const teamProfileView = document.getElementById("teamProfileView");
const teamProfileContent = document.getElementById("teamProfileContent");
const teamBackButton = document.getElementById("teamBackButton");
const projectDetail = document.getElementById("projectDetail");
const projectDetailContent = document.getElementById("projectDetailContent");
const projectDetailBack = document.getElementById("projectDetailBack");
const avatarFileInput = document.getElementById("avatarFileInput");
const sidebarAvatarButton = document.getElementById("sidebarAvatarButton");
const topAvatarButton = document.getElementById("topAvatarButton");

// =====================================================
// MÓDULOS: TAREAS INTELIGENTES / ORGANIZACIÓN / PRESENCIA
// =====================================================
let taskTemplates = [];
let taskOccurrences = [];
let organizationAreas = [];
let responsibilities = [];
let activityLogs = [];
let presenceChannel = null;
let currentCallSession = null;
let currentCallTemplate = null;
let currentCallOccurrence = null;
const presenceStrip = document.getElementById("presenceStrip");
const recurringTasksList = document.getElementById("recurringTasksList");
const callSessionPanel = document.getElementById("callSessionPanel");
const callSessionTitle = document.getElementById("callSessionTitle");
const callSessionStatus = document.getElementById("callSessionStatus");
const startCallSessionButton = document.getElementById("startCallSessionButton");
const endCallSessionButton = document.getElementById("endCallSessionButton");
const registerCallButton = document.getElementById("registerCallButton");
const callProgressLabel = document.getElementById("callProgressLabel");
const callProgressPercent = document.getElementById("callProgressPercent");
const callProgressBar = document.getElementById("callProgressBar");
const organizationChart = document.getElementById("organizationChart");

// =====================================================
// UTILIDADES
// =====================================================
function escapeHTML(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function initials(name) {
  if (!name) {
    return "?";
  }
  return String(name).trim().charAt(0).toUpperCase();
}
// Devuelve el contenido interno del círculo de avatar: la foto si
// existe, o la inicial del nombre como respaldo.
function avatarMarkup(profile) {
  if (profile?.avatar_url) {
    return `<img src="${profile.avatar_url}" alt="" data-avatar-view="${profile.avatar_url}">`;
  }
  return escapeHTML(initials(profile?.name));
}
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}
function canManage(profile) {
  return profile?.role === "admin" || profile?.role === "producer";
}
function isAdmin(profile) {
  return profile?.role === "admin";
}
function roleLabel(role) {
  if (role === "admin") {
    return "Administrador";
  }
  if (role === "producer") {
    return "Productor";
  }
  if (role === "junior_producer") {
    return "Productor junior";
  }
  return "Miembro";
}
const PROJECT_STATUS_LABELS = {
  pending: "Pendiente",
  active: "En producción",
  completed: "Completado",
};
const TASK_STATUS_LABELS = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completada",
};
const PRIORITY_LABELS = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
};
function formatDate(value) {
  if (!value) {
    return "Sin fecha";
  }
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
// Acepta tanto fechas simples ("2026-01-05") como timestamps con
// hora ("2026-01-05T10:23:00+00:00"), para poder usarla también
// con columnas como created_at.
function dateOnly(value) {
  if (!value) {
    return null;
  }
  const raw = String(value).includes("T") ? String(value) : `${value}T00:00:00`;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
}
function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}
function isPastDate(value) {
  const date = dateOnly(value);
  if (!date) {
    return false;
  }
  return date < startOfToday();
}
function isDueToday(value) {
  const date = dateOnly(value);
  if (!date) {
    return false;
  }
  return date.getTime() === startOfToday().getTime();
}
function daysUntil(value) {
  const date = dateOnly(value);
  if (!date) {
    return null;
  }
  const difference = date.getTime() - startOfToday().getTime();
  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}
function toISODate(date) {
  if (!(date instanceof Date)) {
    return null;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}
function weekdayNumber(date) {
  return date.getDay();
}
function parseWeekdays(value) {
  if (Array.isArray(value)) {
    return value
      .map(Number)
      .filter((number) => Number.isInteger(number) && number >= 0 && number <= 6);
  }
  return [];
}
function weekdaysLabel(days) {
  const labels = {
    0: "Dom",
    1: "Lun",
    2: "Mar",
    3: "Mié",
    4: "Jue",
    5: "Vie",
    6: "Sáb",
  };
  return parseWeekdays(days)
    .sort((a, b) => a - b)
    .map((day) => labels[day])
    .join(" · ");
}
function normalizeNumericValue(value) {
  const number = Number(value);
  if (Number.isNaN(number)) {
    return 0;
  }
  return number;
}
function formatNumber(value) {
  const number = normalizeNumericValue(value);
  return Number.isInteger(number) ? String(number) : number.toFixed(2);
}

// =====================================================
// URGENCIA POR TIEMPO (colores de barras/franjas)
// =====================================================
// 00:00–16:00 verde · 16:00–21:00 naranja · 21:00–23:59 rojo.
function getDayTimeProgress() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}
function getDayUrgencyStage() {
  const hour = new Date().getHours();
  if (hour < 16) {
    return "time-green";
  }
  if (hour < 21) {
    return "time-orange";
  }
  return "time-red";
}
// Urgencia por cercanía de deadline, usada para la franja lateral
// de las tarjetas de tareas y el color del cronograma.
function deadlineUrgencyClass(deadline, status) {
  if (status === "completed") {
    return "urgency-green";
  }
  const days = daysUntil(deadline);
  if (days === null) {
    return "";
  }
  if (days <= 1) {
    return "urgency-red";
  }
  if (days <= 3) {
    return "urgency-orange";
  }
  return "urgency-green";
}
function urgencyColorVar(deadline, status) {
  const cls = deadlineUrgencyClass(deadline, status);
  if (cls === "urgency-red") {
    return "var(--red)";
  }
  if (cls === "urgency-orange") {
    return "var(--orange)";
  }
  if (cls === "urgency-green") {
    return "var(--green)";
  }
  return "var(--amarillo)";
}
// Prioridad sugerida según lo cerca que está el deadline. Regla de
// negocio pedida: si la tarea YA está en "alta" no se toca — se
// asume que alguien la marcó así a propósito. Baja y media sí se
// recalculan automáticamente (y pueden subir a alta si el deadline
// se acerca).
function computeAutoPriority(task) {
  if (!task.deadline || task.status === "completed") {
    return task.priority;
  }
  const days = daysUntil(task.deadline);
  if (days === null) {
    return task.priority;
  }
  if (days <= 1) {
    return "high";
  }
  if (days <= 4) {
    return "medium";
  }
  return "low";
}
async function autoAdjustPriorities() {
  const updates = tasks
    .filter((task) => task.status !== "completed" && task.priority !== "high")
    .map((task) => ({ id: task.id, next: computeAutoPriority(task) }))
    .filter((update) => update.next && update.next !== tasks.find((t) => t.id === update.id).priority);
  if (!updates.length) {
    return false;
  }
  try {
    await Promise.all(
      updates.map((update) => db.from("tasks").update({ priority: update.next }).eq("id", update.id)),
    );
    return true;
  } catch (error) {
    console.error("Error ajustando prioridades automáticamente:", error);
    return false;
  }
}
function startAutoPriorityWatcher() {
  if (autoPriorityInterval) {
    return;
  }
  autoPriorityInterval = setInterval(async () => {
    const changed = await autoAdjustPriorities();
    if (changed) {
      await loadTasks();
      renderTasks();
      renderRecurringTasks();
      updateDashboard();
    }
  }, 5 * 60 * 1000);
}
function startLiveColorWatcher() {
  if (liveColorInterval) {
    return;
  }
  liveColorInterval = setInterval(() => {
    const stage = getDayUrgencyStage();
    document.querySelectorAll(".smart-task-progress .progress-bar, #callProgressBar").forEach((bar) => {
      bar.classList.remove("time-green", "time-orange", "time-red");
      bar.classList.add(stage);
    });
    const dayPercent = getDayTimeProgress();
    document.querySelectorAll("[data-day-progress-bar]").forEach((bar) => {
      bar.style.width = `${dayPercent}%`;
    });
    document.querySelectorAll("[data-day-progress-value]").forEach((label) => {
      label.textContent = `${dayPercent}%`;
    });
    updateProjectTimeProgressBars();
  }, 60 * 1000);
}
function stopBackgroundWatchers() {
  if (autoPriorityInterval) {
    clearInterval(autoPriorityInterval);
    autoPriorityInterval = null;
  }
  if (liveColorInterval) {
    clearInterval(liveColorInterval);
    liveColorInterval = null;
  }
}

// =====================================================
// AVANCE POR TIEMPO (proyectos)
// =====================================================
// % de la línea de tiempo del proyecto ya transcurrido — independiente
// del % de tareas completadas. Si faltan fechas, no se muestra.
function getProjectTimeProgress(project) {
  const start = dateOnly(project.start_date) || dateOnly(project.created_at);
  const endDay = dateOnly(project.deadline);
  if (!start || !endDay) {
    return null;
  }
  const end = new Date(endDay);
  end.setHours(23, 59, 59, 999);
  if (end <= start) {
    return null;
  }
  const now = new Date();
  if (now <= start) {
    return 0;
  }
  if (now >= end) {
    return 100;
  }
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  return Math.round((elapsed / total) * 100);
}
function buildTimeProgressHTML(project) {
  const percent = getProjectTimeProgress(project);
  if (percent === null) {
    return "";
  }
  return `
    <div class="progress-wrap-time">
      <div class="progress-label">
        <span>
          AVANCE POR TIEMPO
        </span>
        <strong data-time-progress-value="${project.id}">
          ${percent}%
        </strong>
      </div>
      <div class="progress-track-time">
        <div
          class="progress-bar-time"
          data-time-progress-bar="${project.id}"
          style="width:${percent}%"
        ></div>
      </div>
    </div>
  `;
}
function updateProjectTimeProgressBars() {
  document.querySelectorAll("[data-time-progress-bar]").forEach((bar) => {
    const projectId = bar.dataset.timeProgressBar;
    const project = projects.find((item) => item.id === projectId);
    if (!project) {
      return;
    }
    const percent = getProjectTimeProgress(project);
    if (percent === null) {
      return;
    }
    bar.style.width = `${percent}%`;
    const label = document.querySelector(`[data-time-progress-value="${projectId}"]`);
    if (label) {
      label.textContent = `${percent}%`;
    }
  });
}

// =====================================================
// RELACIONES
// =====================================================
function getProjectMemberIds(projectId) {
  return projectMembers
    .filter((item) => item.project_id === projectId)
    .map((item) => item.profile_id);
}
function getTaskMemberIds(task) {
  const relationIds = taskMembers
    .filter((item) => item.task_id === task.id)
    .map((item) => item.profile_id);
  if (relationIds.length) {
    return relationIds;
  }
  if (task.assigned_to) {
    return [task.assigned_to];
  }
  return [];
}
function getProfilesByIds(ids) {
  const set = new Set(ids);
  return profiles.filter((profile) => set.has(profile.id));
}
function getProjectMembers(projectId) {
  return getProfilesByIds(getProjectMemberIds(projectId));
}
function getTaskMembers(task) {
  return getProfilesByIds(getTaskMemberIds(task));
}
function assignedMembersHTML(members) {
  if (!members.length) {
    return `
      <span class="no-members">
        Sin asignar
      </span>
    `;
  }
  return `
    <div class="assigned-members">
      ${members
        .map(
          (member) => `
          <span class="member-chip">
            ${escapeHTML(member.name)}
          </span>
        `,
        )
        .join("")}
    </div>
  `;
}

// =====================================================
// PROGRESO DE PROYECTOS
// =====================================================
function getProjectTasks(projectId) {
  return tasks.filter((task) => task.project_id === projectId);
}
function getProjectProgress(projectId) {
  const projectTasks = getProjectTasks(projectId);
  if (!projectTasks.length) {
    return 0;
  }
  const completed = projectTasks.filter((task) => task.status === "completed").length;
  return Math.round((completed / projectTasks.length) * 100);
}
function projectStatusMessage(project) {
  const progress = getProjectProgress(project.id);
  const days = daysUntil(project.deadline);
  const pending = getProjectTasks(project.id).filter((task) => task.status !== "completed").length;
  const overdue = getProjectTasks(project.id).filter(
    (task) => task.status !== "completed" && isPastDate(task.deadline),
  ).length;
  if (project.status === "completed") {
    return {
      type: "ok",
      text: "Proyecto completado",
    };
  }
  if (overdue > 0 || (days !== null && days >= 0 && days <= 2 && pending > 0)) {
    return {
      type: "warning",
      text: overdue > 0 ? `${overdue} tarea(s) vencida(s)` : `Deadline en ${days} día(s)`,
    };
  }
  return {
    type: "ok",
    text: progress >= 70 ? "En buen ritmo" : "En producción",
  };
}

// =====================================================
// LOGIN
// =====================================================
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (loginSubmitButton) {
    loginSubmitButton.dataset.loading = "true";
  }
  if (loginSubmitLabel) {
    loginSubmitLabel.textContent = "Entrando...";
  }
  loginError.textContent = "";
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const { error } = await db.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    console.error(error);
    loginError.textContent = "Correo o contraseña incorrectos.";
  }
  if (loginSubmitButton) {
    delete loginSubmitButton.dataset.loading;
  }
  if (loginSubmitLabel) {
    loginSubmitLabel.textContent = "Entrar";
  }
});

// =====================================================
// SESIÓN
// =====================================================
async function checkSession() {
  const { data, error } = await db.auth.getSession();
  if (error) {
    console.error(error);
    showLogin();
    return;
  }
  if (data.session) {
    await loadUser(data.session.user);
  } else {
    showLogin();
  }
}
db.auth.onAuthStateChange(async (event, session) => {
  if (session) {
    await loadUser(session.user);
  } else {
    showLogin();
  }
});
function showLogin() {
  app.classList.add("hidden");
  loginScreen.classList.remove("hidden");
  currentUser = null;
  currentProfile = null;
  document.body.classList.remove("can-manage");
  stopPresence();
  stopBackgroundWatchers();
}
function showApp() {
  loginScreen.classList.add("hidden");
  app.classList.remove("hidden");
}

// =====================================================
// USUARIO
// =====================================================
// La app se muestra apenas tenemos el perfil, con la interfaz ya
// navegada a la página correspondiente (aunque todavía vacía).
// Los datos (proyectos, tareas, etc.) y la presencia en tiempo real
// se cargan después, sin bloquear el primer pintado — así el login
// se siente inmediato en vez de esperar todas las llamadas en fila.
async function loadUser(user) {
  currentUser = user;
  const { data: profile, error } = await db.from("profiles").select("*").eq("id", user.id).single();
  if (error) {
    console.error("Error obteniendo perfil:", error);
    showToast("No se pudo cargar tu perfil.");
    return;
  }
  currentProfile = profile;
  showApp();
  updateUserInterface();
  setTodayLabel();
  const page = PAGES.includes(location.hash.replace("#", ""))
    ? location.hash.replace("#", "")
    : "dashboard";
  showPage(page, {
    pushHistory: false,
  });
  await loadAllData();
  updateDashboard();
  // No se espera: el canal de presencia en tiempo real puede tardar
  // en conectar y no debe retrasar el resto de la app.
  setupPresence();
  startAutoPriorityWatcher();
  startLiveColorWatcher();
}
function updateUserInterface() {
  const name = currentProfile.name || "Usuario";
  document.getElementById("sidebarUser").textContent = name;
  document.getElementById("sidebarRole").textContent = roleLabel(currentProfile.role);
  document.getElementById("topUser").textContent = name;
  document.getElementById("welcomeName").textContent = name;
  document.getElementById("userAvatar").innerHTML = avatarMarkup(currentProfile);
  document.getElementById("topAvatar").innerHTML = avatarMarkup(currentProfile);
  document.body.classList.toggle("can-manage", canManage(currentProfile));
}
function setTodayLabel() {
  const label = document.getElementById("todayLabel");
  const date = new Date();
  label.textContent = date
    .toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
    .toUpperCase();
}

// =====================================================
// FOTO DE PERFIL
// =====================================================
// Guardada como texto (data URL) en profiles.avatar_url — sin
// depender de un bucket de Storage. La imagen se reduce a lo largo
// máximo de AVATAR_MAX_DIMENSION px antes de subirse para que el
// texto guardado sea liviano.
function openAvatarPicker() {
  avatarFileInput?.click();
}
function resizeImageToDataURL(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("No se pudo procesar la imagen."));
      image.onload = () => {
        let { width, height } = image;
        if (width >= height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
async function handleAvatarFileSelected(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) {
    return;
  }
  if (!file.type.startsWith("image/")) {
    showToast("Elige un archivo de imagen.");
    return;
  }
  if (avatarUploadInFlight) {
    return;
  }
  avatarUploadInFlight = true;
  showToast("Subiendo foto...");
  try {
    const dataUrl = await resizeImageToDataURL(file, AVATAR_MAX_DIMENSION, AVATAR_JPEG_QUALITY);
    const { error } = await db
      .from("profiles")
      .update({
        avatar_url: dataUrl,
      })
      .eq("id", currentUser.id);
    if (error) {
      throw error;
    }
    currentProfile.avatar_url = dataUrl;
    const profileIndex = profiles.findIndex((profile) => profile.id === currentUser.id);
    if (profileIndex !== -1) {
      profiles[profileIndex] = {
        ...profiles[profileIndex],
        avatar_url: dataUrl,
      };
    }
    updateUserInterface();
    renderTeam();
    renderPresence();
    if (selectedTeamProfile && selectedTeamProfile.id === currentUser.id) {
      openTeamProfile(currentUser.id);
    }
    showToast("Foto de perfil actualizada.");
  } catch (error) {
    console.error("Error subiendo foto de perfil:", error);
    showToast(error.message || "No se pudo subir la foto. Intenta con una imagen más liviana.");
  } finally {
    avatarUploadInFlight = false;
  }
}
avatarFileInput?.addEventListener("change", handleAvatarFileSelected);
function goToMyProfile() {
  if (!currentProfile) {
    return;
  }
  showPage("team");
  openTeamProfile(currentProfile.id);
}
sidebarAvatarButton?.addEventListener("click", goToMyProfile);
topAvatarButton?.addEventListener("click", goToMyProfile);

// =====================================================
// VISOR DE FOTO DE PERFIL
// =====================================================
const avatarViewerModal = document.getElementById("avatarViewerModal");
const avatarViewerImage = document.getElementById("avatarViewerImage");
const avatarViewerClose = document.getElementById("avatarViewerClose");

function openAvatarViewer(avatarUrl) {
  if (!avatarUrl) {
    return;
  }
  avatarViewerImage.src = avatarUrl;
  avatarViewerModal.classList.remove("hidden");
}
function closeAvatarViewer() {
  avatarViewerModal.classList.add("hidden");
  avatarViewerImage.src = "";
}
avatarViewerClose?.addEventListener("click", closeAvatarViewer);
avatarViewerModal?.addEventListener("click", (event) => {
  if (event.target === avatarViewerModal) {
    closeAvatarViewer();
  }
});
document.addEventListener("click", (event) => {
  const image = event.target.closest("[data-avatar-view]");
  if (!image) {
    return;
  }
  event.stopPropagation();
  openAvatarViewer(image.dataset.avatarView);
});

// =====================================================
// PRESENCE — SUPABASE REALTIME
// =====================================================
async function setupPresence() {
  if (!presenceStrip || !currentUser || !currentProfile) {
    return;
  }
  stopPresence();
  presenceChannel = db.channel("orbe-workspace-presence", {
    config: {
      presence: {
        key: currentUser.id,
      },
    },
  });
  presenceChannel.on(
    "presence",
    {
      event: "sync",
    },
    () => {
      renderPresence();
    },
  );
  presenceChannel.on(
    "presence",
    {
      event: "join",
    },
    () => {
      renderPresence();
    },
  );
  presenceChannel.on(
    "presence",
    {
      event: "leave",
    },
    () => {
      renderPresence();
    },
  );
  await presenceChannel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await presenceChannel.track({
        profile_id: currentProfile.id,
        name: currentProfile.name,
        role: currentProfile.role,
        online_at: new Date().toISOString(),
      });
      renderPresence();
    }
  });
}
function stopPresence() {
  if (!presenceChannel) {
    return;
  }
  try {
    presenceChannel.untrack();
  } catch (error) {
    console.error("Error cerrando presence:", error);
  }
  try {
    db.removeChannel(presenceChannel);
  } catch (error) {
    console.error("Error eliminando canal presence:", error);
  }
  presenceChannel = null;
  if (presenceStrip) {
    presenceStrip.innerHTML = "";
  }
}
function getPresenceUsers() {
  if (!presenceChannel) {
    return [];
  }
  const state = presenceChannel.presenceState();
  const users = [];
  Object.entries(state).forEach(([key, entries]) => {
    if (!Array.isArray(entries)) {
      return;
    }
    const latest = entries[entries.length - 1];
    if (!latest) {
      return;
    }
    users.push({
      key,
      ...latest,
    });
  });
  return users;
}
function renderPresence() {
  if (!presenceStrip) {
    return;
  }
  const users = getPresenceUsers();
  if (!users.length) {
    presenceStrip.innerHTML = "";
    return;
  }
  const maxVisible = 4;
  const visibleUsers = users.slice(0, maxVisible);
  const hiddenCount = Math.max(0, users.length - maxVisible);
  presenceStrip.innerHTML =
    visibleUsers
      .map((user) => {
        const name = user.name || "Usuario";
        const isCurrent = user.profile_id === currentUser?.id;
        const matchedProfile = profiles.find((profile) => profile.id === user.profile_id);
        return `
            <div
              class="presence-user ${isCurrent ? "current" : ""}"
              title="${escapeHTML(name)} está conectado"
            >
              ${avatarMarkup(matchedProfile || {
                name,
              })}
            </div>
          `;
      })
      .join("") +
    (hiddenCount > 0
      ? `
          <span
            class="presence-overflow"
            title="${hiddenCount} usuarios más conectados"
          >
            +${hiddenCount}
          </span>
        `
      : "");
}

// =====================================================
// LOGOUT
// =====================================================
logoutButton.addEventListener("click", async () => {
  stopPresence();
  stopBackgroundWatchers();
  await db.auth.signOut();
});

// =====================================================
// NAVEGACIÓN
// =====================================================
document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});
document.querySelectorAll("[data-page-link]").forEach((button) => {
  button.addEventListener("click", () => {
    showPage(button.dataset.pageLink);
  });
});
menuToggle.addEventListener("click", openSidebar);
closeSidebarButton.addEventListener("click", closeSidebar);
sidebarBackdrop.addEventListener("click", closeSidebar);
backButton.addEventListener("click", () => {
  if (document.getElementById("projectDetail").classList.contains("hidden") === false) {
    closeProjectDetail();
    return;
  }
  if (history.length > 1) {
    history.back();
  } else {
    showPage("dashboard");
  }
});
window.addEventListener("hashchange", () => {
  const page = location.hash.replace("#", "");
  if (PAGES.includes(page)) {
    showPage(page, {
      pushHistory: false,
    });
  }
});
function openSidebar() {
  sidebar.classList.add("open");
  sidebarBackdrop.classList.add("show");
  menuToggle.setAttribute("aria-expanded", "true");
}
function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarBackdrop.classList.remove("show");
  menuToggle.setAttribute("aria-expanded", "false");
}
function showPage(page, { pushHistory = true } = {}) {
  if (!PAGES.includes(page)) {
    page = "dashboard";
  }
  document.querySelectorAll(".page").forEach((section) => {
    section.classList.add("hidden");
  });
  const target = document.getElementById(`page-${page}`);
  if (target) {
    target.classList.remove("hidden");
  }
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === page);
  });
  const titles = {
    dashboard: ["Dashboard", "Resumen de producción"],
    projects: ["Proyectos", "Producciones de Orbe"],
    tasks: ["Tareas", "Todo lo que hay que hacer"],
    team: ["Equipo", "Personas de Orbe"],
    organization: ["Organización", "Áreas y responsabilidades"],
  };
  document.getElementById("pageTitle").textContent = titles[page][0];
  document.getElementById("pageSubtitle").textContent = titles[page][1];
  backButton.classList.toggle("visible", page !== "dashboard");
  if (page === "projects") {
    closeProjectDetail();
    renderProjects();
  }
  if (page === "tasks") {
    renderRecurringTasks();
    renderTasks();
  }
  if (page === "team") {
    showTeamOverview();
  }
  if (page === "organization") {
    renderOrganization();
  }
  if (page === "dashboard") {
    updateDashboard();
  }
  closeSidebar();
  if (pushHistory && location.hash !== `#${page}`) {
    location.hash = page;
  }
}

// =====================================================
// CARGAR DATOS
// =====================================================
async function loadAllData() {
  const results = await Promise.allSettled([
    loadProjects(),
    loadTasks(),
    loadProfiles(),
    loadProjectMembers(),
    loadTaskMembers(),
    loadTaskTemplates(),
    loadTaskOccurrences(),
    loadOrganization(),
    loadActivityLogs(),
  ]);
  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error("Error cargando módulo:", result.reason);
    }
  });
  const priorityChanged = await autoAdjustPriorities();
  if (priorityChanged) {
    await loadTasks();
  }
  renderProjects();
  renderTasks();
  renderRecurringTasks();
  renderTeam();
  renderOrganization();
}
async function loadProjects() {
  const { data, error } = await db.from("projects").select("*").order("created_at", {
    ascending: false,
  });
  if (error) {
    throw error;
  }
  projects = data || [];
}
async function loadTasks() {
  const { data, error } = await db.from("tasks").select("*").order("created_at", {
    ascending: false,
  });
  if (error) {
    throw error;
  }
  tasks = data || [];
}
async function loadProfiles() {
  const { data, error } = await db.from("profiles").select("id,name,role,avatar_url").order("name");
  if (error) {
    throw error;
  }
  profiles = data || [];
}
async function loadProjectMembers() {
  const { data, error } = await db.from("project_members").select("id,project_id,profile_id");
  if (error) {
    throw error;
  }
  projectMembers = data || [];
}
async function loadTaskMembers() {
  const { data, error } = await db.from("task_members").select("id,task_id,profile_id");
  if (error) {
    throw error;
  }
  taskMembers = data || [];
}
async function loadTaskTemplates() {
  const { data, error } = await db.from("task_templates").select("*").order("created_at", {
    ascending: false,
  });
  if (error) {
    throw error;
  }
  taskTemplates = data || [];
}
async function loadTaskOccurrences() {
  const { data, error } = await db.from("task_occurrences").select("*").order("occurrence_date", {
    ascending: false,
  });
  if (error) {
    throw error;
  }
  taskOccurrences = data || [];
}
async function loadActivityLogs() {
  const { data, error } = await db.from("activity_logs").select("*").order("created_at", {
    ascending: false,
  });
  if (error) {
    throw error;
  }
  activityLogs = data || [];
}
async function loadOrganization() {
  const [areasResult, responsibilitiesResult] = await Promise.all([
    db.from("organization_areas").select("*").order("name"),
    db.from("responsibilities").select("*").order("name"),
  ]);
  if (areasResult.error) {
    throw areasResult.error;
  }
  if (responsibilitiesResult.error) {
    throw responsibilitiesResult.error;
  }
  organizationAreas = areasResult.data || [];
  responsibilities = responsibilitiesResult.data || [];
}

// =====================================================
// PROJECT FILTERS
// =====================================================
document.getElementById("projectSearch").addEventListener("input", renderProjects);
document.getElementById("projectFilter").addEventListener("change", renderProjects);

// =====================================================
// TASK FILTERS
// =====================================================
document.getElementById("taskSearch").addEventListener("input", renderTasks);
document.getElementById("taskStatusFilter").addEventListener("change", renderTasks);
document.getElementById("taskPriorityFilter").addEventListener("change", renderTasks);
document.getElementById("taskProjectFilter").addEventListener("change", renderTasks);

// =====================================================
// RENDER PROJECTS
// =====================================================
function renderProjects() {
  const container = document.getElementById("projectsList");
  if (!container) {
    return;
  }
  const search = document.getElementById("projectSearch").value.toLowerCase().trim();
  const filter = document.getElementById("projectFilter").value;
  const filtered = projects.filter((project) => {
    const searchMatch =
      (project.name || "").toLowerCase().includes(search) ||
      (project.client || "").toLowerCase().includes(search);
    const statusMatch = filter === "all" || project.status === filter;
    return searchMatch && statusMatch;
  });
  if (!filtered.length) {
    container.innerHTML = `
      <div class="panel">
        <h3>
          No hay proyectos
        </h3>
        <p>
          No encontramos proyectos con esos filtros.
        </p>
      </div>
    `;
    return;
  }
  container.innerHTML = filtered.map(renderProjectCard).join("");
}
function renderProjectCard(project) {
  const progress = getProjectProgress(project.id);
  const members = getProjectMembers(project.id);
  const message = projectStatusMessage(project);
  return `
    <article
      class="project-card"
      data-project-id="${project.id}"
    >
      <div class="card-top">
        <div>
          <h3>
            ${escapeHTML(project.name)}
          </h3>
          <span class="project-client">
            ${escapeHTML(project.client || "Sin cliente")}
          </span>
        </div>
        <span class="badge ${escapeHTML(project.status)}">
          ${escapeHTML(PROJECT_STATUS_LABELS[project.status] || project.status)}
        </span>
      </div>
      <p class="card-description">
        ${escapeHTML(project.description || "Sin descripción.")}
      </p>
      <div class="project-dates">
        <span>
          Inicio:
          ${formatDate(project.start_date)}
        </span>
        <span>
          Deadline:
          ${formatDate(project.deadline)}
        </span>
      </div>
      <div class="progress-wrap">
        <div class="progress-label">
          <span>
            PROGRESO
          </span>
          <strong>
            ${progress}%
          </strong>
        </div>
        <div class="progress-track">
          <div
            class="progress-bar"
            style="width:${progress}%"
          ></div>
        </div>
      </div>
      ${buildTimeProgressHTML(project)}
      ${assignedMembersHTML(members)}
      ${
        message.type === "warning"
          ? `
            <div class="project-warning">
              ⚠ ${escapeHTML(message.text)}
            </div>
          `
          : `
            <div class="project-ok">
              ✓ ${escapeHTML(message.text)}
            </div>
          `
      }
      <div class="card-footer">
        <small>
          ${getProjectTasks(project.id).length}
          tarea(s)
        </small>
        <div class="card-actions">
          <button
            class="edit-button"
            type="button"
            data-project-open="${project.id}"
          >
            Abrir
          </button>
          ${
            canManage(currentProfile)
              ? `
                <button
                  class="edit-button"
                  type="button"
                  data-project-edit="${project.id}"
                >
                  Editar
                </button>
              `
              : ""
          }
          ${
            isAdmin(currentProfile)
              ? `
                <button
                  class="danger-button"
                  type="button"
                  data-project-delete="${project.id}"
                >
                  Eliminar
                </button>
              `
              : ""
          }
        </div>
      </div>
    </article>
  `;
}
document.getElementById("projectsList").addEventListener("click", (event) => {
  const openButton = event.target.closest("[data-project-open]");
  const editButton = event.target.closest("[data-project-edit]");
  const deleteButton = event.target.closest("[data-project-delete]");
  if (openButton) {
    openProjectDetail(openButton.dataset.projectOpen);
    return;
  }
  if (editButton) {
    editProject(editButton.dataset.projectEdit);
    return;
  }
  if (deleteButton) {
    deleteProject(deleteButton.dataset.projectDelete);
  }
});

// =====================================================
// PROJECT DETAIL
// =====================================================
function openProjectDetail(projectId) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) {
    return;
  }
  selectedProject = project;
  document.getElementById("projectsList").classList.add("hidden");
  document.querySelector("#page-projects .toolbar").classList.add("hidden");
  document.querySelector("#page-projects .page-header").classList.add("hidden");
  projectDetail.classList.remove("hidden");
  renderProjectDetail(project);
  backButton.classList.add("visible");
}
function closeProjectDetail() {
  selectedProject = null;
  projectDetail.classList.add("hidden");
  document.getElementById("projectsList").classList.remove("hidden");
  document.querySelector("#page-projects .toolbar").classList.remove("hidden");
  document.querySelector("#page-projects .page-header").classList.remove("hidden");
}
projectDetailBack.addEventListener("click", closeProjectDetail);
function renderProjectDetail(project) {
   const projectTasks = getProjectTasks(project.id);
  const projectTemplates = taskTemplates.filter(
    (template) => template.project_id === project.id && template.is_active !== false,
  );
  const members = getProjectMembers(project.id);
  const progress = getProjectProgress(project.id);
  const message = projectStatusMessage(project);
  projectDetailContent.innerHTML = `
    <div class="project-detail-header">
      <div class="project-detail-title-row">
        <div class="project-detail-title">
          <p class="eyebrow">
            PROYECTO
          </p>
          <h1>
            ${escapeHTML(project.name)}
          </h1>
          <p>
            ${escapeHTML(project.client || "Sin cliente")}
          </p>
        </div>
        <span class="badge ${escapeHTML(project.status)}">
          ${escapeHTML(PROJECT_STATUS_LABELS[project.status] || project.status)}
        </span>
      </div>
      ${
        project.description
          ? `
            <p class="card-description project-detail-description">
              ${escapeHTML(project.description)}
            </p>
          `
          : ""
      }
      <div class="project-detail-meta">
        <div class="project-meta-box">
          <span>
            INICIO
          </span>
          <strong>
            ${formatDate(project.start_date)}
          </strong>
        </div>
        <div class="project-meta-box">
          <span>
            DEADLINE
          </span>
          <strong>
            ${formatDate(project.deadline)}
          </strong>
        </div>
        <div class="project-meta-box">
          <span>
            PROGRESO
          </span>
          <strong>
            ${progress}%
          </strong>
        </div>
        <div class="project-meta-box">
          <span>
            TAREAS
          </span>
          <strong>
            ${projectTasks.length}
          </strong>
        </div>
      </div>
      <div class="progress-wrap project-detail-progress">
        <div class="progress-label">
          <span>
            AVANCE DE PRODUCCIÓN
          </span>
          <strong>
            ${progress}%
          </strong>
        </div>
        <div class="progress-track">
          <div
            class="progress-bar"
            style="width:${progress}%"
          ></div>
        </div>
      </div>
      ${buildTimeProgressHTML(project)}
      ${
        message.type === "warning"
          ? `
            <div class="project-warning">
              ⚠ ${escapeHTML(message.text)}
            </div>
          `
          : `
            <div class="project-ok">
              ✓ ${escapeHTML(message.text)}
            </div>
          `
      }
      <div class="profile-section">
        <div class="profile-section-header">
          <div>
            <p class="eyebrow">
              EQUIPO
            </p>
            <h3>
              Personas asignadas
            </h3>
          </div>
        </div>
        ${assignedMembersHTML(members)}
      </div>
    </div>
    <div class="project-detail-sections">
      <div class="timeline-card">
        <div class="section-header">
          <div>
            <p class="eyebrow">
              CRONOGRAMA AUTOMÁTICO
            </p>
            <h3>
              Tareas
            </h3>
          </div>
        </div>
                ${
          projectTasks.length || projectTemplates.length
            ? buildTimelineHTML(project, projectTasks, projectTemplates)
            : `
              <p class="empty-text">
                Este proyecto todavía no tiene tareas.
              </p>
            `
        }
      </div>
      <div class="section-card">
        <div class="section-header">
          <div>
            <p class="eyebrow">
              TRABAJO
            </p>
            <h3>
              Tareas del proyecto
            </h3>
          </div>
        </div>
             <div class="member-task-list">
          ${projectTemplates.map(renderProjectTemplateItem).join("")}
          ${
            projectTasks.length
              ? projectTasks.map(renderProjectTask).join("")
              : !projectTemplates.length
              ? `
                <p class="profile-empty">
                  No hay tareas todavía.
                </p>
              `
              : ""
          }
        </div>
        </div>
      </div>
    </div>
  `;
}
function renderProjectTask(task) {
  const members = getTaskMembers(task);
  return `
    <div class="member-task-item">
      <div class="card-top">
        <strong>
          ${escapeHTML(task.title)}
        </strong>
        <span class="badge ${escapeHTML(task.status)}">
          ${escapeHTML(TASK_STATUS_LABELS[task.status] || task.status)}
        </span>
      </div>
      <p>
        ${formatDate(task.start_date)}
        →
        ${formatDate(task.deadline)}
      </p>
      <div
        style="margin-top:7px"
      >
        ${assignedMembersHTML(members)}
      </div>
    </div>
  `;
}
function renderProjectTemplateItem(template) {
  const percent = getTemplateProgressPercent(template.id);
  const members = template.assigned_profile_id
    ? getProfilesByIds([template.assigned_profile_id])
    : [];
  return `
    <div class="member-task-item">
      <div class="card-top">
        <strong>
          ${escapeHTML(template.title)}
        </strong>
        <span class="badge smart">
          ${percent}%
        </span>
      </div>
      <p>
        ${formatDate(template.start_date)}
        →
        ${template.end_date ? formatDate(template.end_date) : "Sin fin"}
      </p>
      <div
        style="margin-top:7px"
      >
        ${assignedMembersHTML(members)}
      </div>
    </div>
  `;
}
// Cronograma automático: distribuye cada tarea sobre la línea de
// tiempo del proyecto, coloreada por urgencia (verde/naranja/rojo,
// igual que las tarjetas), con una marca vertical de "HOY".
function buildTimelineHTML(project, projectTasks, projectTemplates = []) {
  const projectStart = dateOnly(project.start_date);
  const projectEnd = dateOnly(project.deadline);
  if (!projectStart || !projectEnd || projectEnd <= projectStart) {
    return `
      <p class="empty-text">
        Añade fecha de inicio y deadline al proyecto para visualizar el cronograma.
      </p>
    `;
  }
  const total = projectEnd.getTime() - projectStart.getTime();
  const today = startOfToday();
  const todayPercent =
    today >= projectStart && today <= projectEnd
      ? ((today.getTime() - projectStart.getTime()) / total) * 100
      : null;
  const templateRows = projectTemplates
    .map((template) => {
      const templateStart = dateOnly(template.start_date) || projectStart;
      const templateEnd = dateOnly(template.end_date) || projectEnd;
      let left = ((templateStart.getTime() - projectStart.getTime()) / total) * 100;
      let right = ((templateEnd.getTime() - projectStart.getTime()) / total) * 100;
      left = Math.max(0, Math.min(100, left));
      right = Math.max(left + 2, Math.min(100, right));
      const width = right - left;
      const percent = getTemplateProgressPercent(template.id);
      return `
        <div class="timeline-row">
          <div class="timeline-label">
            <strong>
              ${escapeHTML(template.title)}
            </strong>
            <span>
              Recurrente · ${percent}%
            </span>
          </div>
          <div class="timeline-bar-area">
            <div
              class="timeline-bar"
              style="left:${left}%;width:${width}%;background:var(--purple);"
            ></div>
            ${
              todayPercent !== null
                ? `<div class="timeline-today-marker" style="left:${todayPercent}%"></div>`
                : ""
            }
          </div>
        </div>
      `;
    })
    .join("");
  return `
    <div class="timeline">
      ${templateRows}
      ${projectTasks
        .map((task) => {
          const taskStart = dateOnly(task.start_date) || dateOnly(project.start_date);
          const taskEnd = dateOnly(task.deadline) || dateOnly(project.deadline);
          if (!taskStart || !taskEnd) {
            return `
              <div class="timeline-row">
                <div class="timeline-label">
                  <strong>
                    ${escapeHTML(task.title)}
                  </strong>
                  <span>
                    Sin fechas
                  </span>
                </div>
                <div class="timeline-bar-area">
                  ${
                    todayPercent !== null
                      ? `<div class="timeline-today-marker" style="left:${todayPercent}%"></div>`
                      : ""
                  }
                </div>
              </div>
            `;
          }
          let left = ((taskStart.getTime() - projectStart.getTime()) / total) * 100;
          let right = ((taskEnd.getTime() - projectStart.getTime()) / total) * 100;
          left = Math.max(0, Math.min(100, left));
          right = Math.max(left + 2, Math.min(100, right));
          const width = right - left;
          const barColor = urgencyColorVar(task.deadline, task.status);
          return `
            <div class="timeline-row">
              <div class="timeline-label">
                <strong>
                  ${escapeHTML(task.title)}
                </strong>
                <span>
                  ${formatDate(task.start_date)}
                  →
                  ${formatDate(task.deadline)}
                </span>
              </div>
              <div class="timeline-bar-area">
                <div
                  class="timeline-bar"
                  style="
                    left:${left}%;
                    width:${width}%;
                    background:${barColor};
                  "
                ></div>
                ${
                  todayPercent !== null
                    ? `<div class="timeline-today-marker" style="left:${todayPercent}%"></div>`
                    : ""
                }
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

// =====================================================
// PROJECT CREATE / EDIT
// =====================================================
document.getElementById("newProjectButton").addEventListener("click", () => {
  if (!canManage(currentProfile)) {
    return;
  }
  editingProject = null;
  activeModalMode = "project";
  modalTitle.textContent = "Nuevo proyecto";
  modalFields.innerHTML = buildProjectForm();
  openModal();
});
function buildProjectForm(project = null) {
  const selectedIds = project ? getProjectMemberIds(project.id) : [];
  return `
    <div class="modal-field">
      <label for="projectName">
        Nombre
      </label>
      <input
        id="projectName"
        value="${project ? escapeHTML(project.name) : ""}"
        required
      >
    </div>
    <div class="modal-field">
      <label for="projectClient">
        Cliente
      </label>
      <input
        id="projectClient"
        value="${project ? escapeHTML(project.client || "") : ""}"
      >
    </div>
    <div class="modal-field">
      <label for="projectDescription">
        Descripción
      </label>
      <textarea
        id="projectDescription"
      >${project ? escapeHTML(project.description || "") : ""}</textarea>
    </div>
    <div class="modal-field">
      <label for="projectStartDate">
        Fecha de inicio
      </label>
      <input
        id="projectStartDate"
        type="date"
        value="${project?.start_date || ""}"
      >
    </div>
    <div class="modal-field">
      <label for="projectDeadline">
        Deadline
      </label>
      <input
        id="projectDeadline"
        type="date"
        value="${project?.deadline || ""}"
      >
    </div>
    <div class="modal-field">
      <label for="projectStatus">
        Estado
      </label>
      <select id="projectStatus">
        <option value="pending">
          Pendiente
        </option>
        <option value="active">
          En producción
        </option>
        <option value="completed">
          Completado
        </option>
      </select>
    </div>
    <div class="modal-field">
      <label>
        Equipo
      </label>
      ${buildMemberPicker("projectMembers", selectedIds)}
    </div>
  `;
}
function editProject(projectId) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) {
    return;
  }
  if (!canManage(currentProfile)) {
    return;
  }
  editingProject = project;
  activeModalMode = "project";
  modalTitle.textContent = "Editar proyecto";
  modalFields.innerHTML = buildProjectForm(project);
  document.getElementById("projectStatus").value = project.status;
  openModal();
}

// =====================================================
// PROJECT MEMBERS
// =====================================================
function buildMemberPicker(inputName, selectedIds = []) {
  if (!profiles.length) {
    return `
      <p class="assignment-help">
        No hay miembros disponibles.
      </p>
    `;
  }
  return `
    <div class="member-picker">
      ${profiles
        .map((profile) => {
          const selected = selectedIds.includes(profile.id);
          const inputId = `${inputName}-${profile.id}`;
          return `
            <div class="member-option">
              <input
                type="checkbox"
                id="${inputId}"
                name="${inputName}"
                value="${profile.id}"
                ${selected ? "checked" : ""}
              >
              <label for="${inputId}">
                <span class="member-check">
                  ${selected ? "✓" : ""}
                </span>
                <span class="member-option-info">
                  <span
                    class="member-option-name"
                  >
                    ${escapeHTML(profile.name)}
                  </span>
                  <span
                    class="member-option-role"
                  >
                    ${escapeHTML(roleLabel(profile.role))}
                  </span>
                </span>
              </label>
            </div>
          `;
        })
        .join("")}
    </div>
    <p class="assignment-help">
      Selecciona uno, varios o todos.
    </p>
  `;
}
function getSelectedMemberIds(inputName) {
  return [...document.querySelectorAll(`input[name="${inputName}"]:checked`)].map(
    (input) => input.value,
  );
}
async function syncProjectMembers(projectId, profileIds) {
  const { error: deleteError } = await db
    .from("project_members")
    .delete()
    .eq("project_id", projectId);
  if (deleteError) {
    throw deleteError;
  }
  if (!profileIds.length) {
    return;
  }
  const rows = profileIds.map((profileId) => ({
    project_id: projectId,
    profile_id: profileId,
  }));
  const { error } = await db.from("project_members").insert(rows);
  if (error) {
    throw error;
  }
}

// =====================================================
// SAVE PROJECT
// =====================================================
async function saveProject() {
  const startDate = document.getElementById("projectStartDate").value || null;
  const deadline = document.getElementById("projectDeadline").value || null;
  if (startDate && deadline && startDate > deadline) {
    showToast("La fecha de inicio no puede ser posterior al deadline.");
    return;
  }
  const profileIds = getSelectedMemberIds("projectMembers");
  const payload = {
    name: document.getElementById("projectName").value.trim(),
    client: document.getElementById("projectClient").value.trim(),
    description: document.getElementById("projectDescription").value.trim(),
    start_date: startDate,
    deadline: deadline,
    status: document.getElementById("projectStatus").value,
  };
  try {
    let projectId;
    if (editingProject) {
      const { error } = await db.from("projects").update(payload).eq("id", editingProject.id);
      if (error) {
        throw error;
      }
      projectId = editingProject.id;
    } else {
      const { data, error } = await db
        .from("projects")
        .insert({
          ...payload,
          created_by: currentUser.id,
        })
        .select()
        .single();
      if (error) {
        throw error;
      }
      projectId = data.id;
    }
    await syncProjectMembers(projectId, profileIds);
    closeModalWindow();
    showToast(editingProject ? "Proyecto actualizado" : "Proyecto creado");
    await loadProjects();
    await loadProjectMembers();
    renderProjects();
    renderTeam();
    updateDashboard();
    if (selectedProject && selectedProject.id === projectId) {
      selectedProject = projects.find((project) => project.id === projectId);
      renderProjectDetail(selectedProject);
    }
  } catch (error) {
    console.error("Error guardando proyecto:", error);
    showToast(error.message || "No se pudo guardar el proyecto.");
  }
}

// =====================================================
// DELETE PROJECT
// =====================================================
async function deleteProject(projectId) {
  if (!isAdmin(currentProfile)) {
    return;
  }
  if (!confirm("¿Seguro que quieres eliminar este proyecto?")) {
    return;
  }
  const { error } = await db.from("projects").delete().eq("id", projectId);
  if (error) {
    console.error(error);
    showToast(error.message);
    return;
  }
  if (selectedProject && selectedProject.id === projectId) {
    closeProjectDetail();
  }
  showToast("Proyecto eliminado");
  await loadProjects();
  await loadProjectMembers();
  await loadTasks();
  await loadTaskMembers();
  renderProjects();
  renderTasks();
  renderTeam();
  updateDashboard();
}

// =====================================================
// TASK PROJECT FILTER
// =====================================================
function refreshTaskProjectFilter() {
  const select = document.getElementById("taskProjectFilter");
  if (!select) {
    return;
  }
  const current = select.value;
  select.innerHTML = `
    <option value="all">
      Todos los proyectos
    </option>
    <option value="none">
      Sin proyecto
    </option>
    ${projects
      .map(
        (project) => `
        <option value="${project.id}">
          ${escapeHTML(project.name)}
        </option>
      `,
      )
      .join("")}
  `;
  if (["all", "none", ...projects.map((project) => project.id)].includes(current)) {
    select.value = current;
  } else {
    select.value = "all";
  }
}

// =====================================================
// RENDER TASKS
// =====================================================
function renderTasks() {
  refreshTaskProjectFilter();
  const search = document.getElementById("taskSearch").value.toLowerCase().trim();
  const status = document.getElementById("taskStatusFilter").value;
  const priority = document.getElementById("taskPriorityFilter").value;
  const projectFilter = document.getElementById("taskProjectFilter").value;
  const filtered = tasks.filter((task) => {
    const searchMatch = (task.title || "").toLowerCase().includes(search);
    const statusMatch = status === "all" || task.status === status;
    const priorityMatch = priority === "all" || task.priority === priority;
    let projectMatch = true;
    if (projectFilter === "none") {
      projectMatch = !task.project_id;
    } else if (projectFilter !== "all") {
      projectMatch = task.project_id === projectFilter;
    }
    return searchMatch && statusMatch && priorityMatch && projectMatch;
  });
  const columns = {
    pending: filtered.filter((task) => task.status === "pending"),
    in_progress: filtered.filter((task) => task.status === "in_progress"),
    completed: filtered.filter((task) => task.status === "completed"),
  };
  renderTaskColumn("tasksPending", columns.pending);
  renderTaskColumn("tasksProgress", columns.in_progress);
  renderTaskColumn("tasksCompleted", columns.completed);
  document.getElementById("pendingCount").textContent = columns.pending.length;
  document.getElementById("progressCount").textContent = columns.in_progress.length;
  document.getElementById("completedCount").textContent = columns.completed.length;
}
function renderTaskColumn(containerId, list) {
  const container = document.getElementById(containerId);
  if (!list.length) {
    container.innerHTML = `
        <p class="empty-text">
          Sin tareas.
        </p>
      `;
    return;
  }
  container.innerHTML = list.map(renderTaskCard).join("");
}
function renderTaskCard(task) {
  const project = projects.find((project) => project.id === task.project_id);
  const members = getTaskMembers(task);
  const overdue = task.status !== "completed" && isPastDate(task.deadline);
  const occurrence = taskOccurrences.find((item) => item.task_id === task.id);
  const isSmartTask = Boolean(task.template_id || occurrence);
  const urgencyClass = deadlineUrgencyClass(task.deadline, task.status);
  return `
    <article class="task-row ${urgencyClass}">
      <div class="card-top">
        <div>
          <div class="task-title">
            ${escapeHTML(task.title)}
          </div>
          <div class="task-project-label">
            ${project ? escapeHTML(project.name) : "Tarea general"}
          </div>
        </div>
        <div
          style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;justify-content:flex-end"
        >
          ${
            isSmartTask
              ? `
                <span class="badge smart">
                  Inteligente
                </span>
              `
              : ""
          }
          <span class="badge ${escapeHTML(task.priority)}">
            ${escapeHTML(PRIORITY_LABELS[task.priority] || task.priority)}
          </span>
          <span class="badge ${escapeHTML(task.status)}">
            ${escapeHTML(TASK_STATUS_LABELS[task.status] || task.status)}
          </span>
        </div>
      </div>
      ${
        task.description
          ? `
            <div class="task-description">
              ${escapeHTML(task.description)}
            </div>
          `
          : ""
      }
      <div class="task-meta">
        ${formatDate(task.start_date)}
        →
        ${formatDate(task.deadline)}
      </div>
      ${
        occurrence
          ? `
            <div class="task-meta">
              Meta:
              <strong>
                ${formatNumber(occurrence.target_value)}
              </strong>
            </div>
          `
          : ""
      }
      ${
        overdue
          ? `
            <div class="task-overdue">
              ⚠ Tarea vencida
            </div>
          `
          : ""
      }
      ${assignedMembersHTML(members)}
      <div class="task-actions">
        ${
          canManage(currentProfile)
            ? `
              <button
                class="edit-button"
                type="button"
                data-task-edit="${task.id}"
              >
                Editar
              </button>
            `
            : ""
        }
        ${
          isAdmin(currentProfile)
            ? `
              <button
                class="danger-button"
                type="button"
                data-task-delete="${task.id}"
              >
                Eliminar
              </button>
            `
            : ""
        }
      </div>
    </article>
  `;
}

// =====================================================
// TASK ACTION DELEGATION
// =====================================================
["tasksPending", "tasksProgress", "tasksCompleted"].forEach((containerId) => {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }
  container.addEventListener("click", (event) => {
    const edit = event.target.closest("[data-task-edit]");
    const remove = event.target.closest("[data-task-delete]");
    if (edit) {
      editTask(edit.dataset.taskEdit);
      return;
    }
    if (remove) {
      deleteTask(remove.dataset.taskDelete);
    }
  });
});

// =====================================================
// TASK FORM
// =====================================================
document.getElementById("newTaskButton").addEventListener("click", () => {
  if (!canManage(currentProfile)) {
    return;
  }
  editingTask = null;
  activeModalMode = "task";
  modalTitle.textContent = "Nueva tarea";
  modalFields.innerHTML = buildTaskForm();
  openModal();
});
function buildTaskForm(task = null) {
  const selectedIds = task ? getTaskMemberIds(task) : [];
  const projectOptions = projects
    .map(
      (project) => `
        <option
          value="${project.id}"
          ${task && task.project_id === project.id ? "selected" : ""}
        >
          ${escapeHTML(project.name)}
        </option>
      `,
    )
    .join("");
  return `
    <div class="modal-field">
      <label for="taskTitle">
        Título
      </label>
      <input
        id="taskTitle"
        value="${task ? escapeHTML(task.title) : ""}"
        required
      >
    </div>
    <div class="modal-field">
      <label for="taskDescription">
        Descripción
      </label>
      <textarea
        id="taskDescription"
      >${task ? escapeHTML(task.description || "") : ""}</textarea>
    </div>
    <div class="modal-field">
      <label for="taskProject">
        Proyecto
      </label>
      <select id="taskProject">
        <option value="">
          Sin proyecto
        </option>
        ${projectOptions}
      </select>
      <p class="assignment-help">
        Puedes crear una tarea general sin asociarla a un proyecto.
      </p>
    </div>
    <div class="modal-field">
      <label for="taskStartDate">
        Fecha de inicio
      </label>
      <input
        id="taskStartDate"
        type="date"
        value="${task?.start_date || ""}"
      >
    </div>
    <div class="modal-field">
      <label for="taskDeadline">
        Deadline
      </label>
      <input
        id="taskDeadline"
        type="date"
        value="${task?.deadline || ""}"
      >
    </div>
    <div class="modal-field">
      <label>
        Asignar miembros
      </label>
      ${buildMemberPicker("taskMembers", selectedIds)}
    </div>
    <div class="modal-field">
      <label for="taskStatus">
        Estado
      </label>
      <select id="taskStatus">
        <option value="pending">
          Pendiente
        </option>
        <option value="in_progress">
          En progreso
        </option>
        <option value="completed">
          Completada
        </option>
      </select>
    </div>
    <div class="modal-field">
      <label for="taskPriority">
        Prioridad
      </label>
      <select id="taskPriority">
        <option value="low">
          Baja
        </option>
        <option value="medium">
          Media
        </option>
        <option value="high">
          Alta
        </option>
      </select>
      <p class="assignment-help">
        Si la dejas en "Alta" no se recalcula sola: la app respeta tu criterio.
        En baja/media, la prioridad puede subir automáticamente si el deadline
        se acerca.
      </p>
    </div>
  `;
}
function editTask(taskId) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) {
    return;
  }
  if (!canManage(currentProfile)) {
    return;
  }
  editingTask = task;
  activeModalMode = "task";
  modalTitle.textContent = "Editar tarea";
  modalFields.innerHTML = buildTaskForm(task);
  document.getElementById("taskStatus").value = task.status;
  document.getElementById("taskPriority").value = task.priority;
  openModal();
}

// =====================================================
// TASK MEMBERS
// =====================================================
async function syncTaskMembers(taskId, profileIds) {
  const { error: deleteError } = await db.from("task_members").delete().eq("task_id", taskId);
  if (deleteError) {
    throw deleteError;
  }
  if (!profileIds.length) {
    return;
  }
  const rows = profileIds.map((profileId) => ({
    task_id: taskId,
    profile_id: profileId,
  }));
  const { error } = await db.from("task_members").insert(rows);
  if (error) {
    throw error;
  }
}

// =====================================================
// SAVE TASK
// =====================================================
async function saveTask() {
  const wasEditing = Boolean(editingTask);
  const startDate = document.getElementById("taskStartDate").value || null;
  const deadline = document.getElementById("taskDeadline").value || null;
  const title = document.getElementById("taskTitle").value.trim();
  if (!title) {
    showToast("La tarea necesita un título.");
    return;
  }
  if (startDate && deadline && startDate > deadline) {
    showToast("La fecha de inicio no puede ser posterior al deadline.");
    return;
  }
  const projectValue = document.getElementById("taskProject").value;
  const profileIds = getSelectedMemberIds("taskMembers");
  const payload = {
    title: title,
    description: document.getElementById("taskDescription").value.trim(),
    project_id: projectValue || null,
    assigned_to: null,
    start_date: startDate,
    deadline: deadline,
    status: document.getElementById("taskStatus").value,
    priority: document.getElementById("taskPriority").value,
  };
  let taskId = null;
  let createdTask = false;
  try {
    if (wasEditing) {
      const { error } = await db.from("tasks").update(payload).eq("id", editingTask.id);
      if (error) {
        throw error;
      }
      taskId = editingTask.id;
    } else {
      const { data, error } = await db
        .from("tasks")
        .insert({
          ...payload,
          created_by: currentUser.id,
        })
        .select()
        .single();
      if (error) {
        throw error;
      }
      taskId = data.id;
      createdTask = true;
    }
    await syncTaskMembers(taskId, profileIds);
    await loadTasks();
    await loadTaskMembers();
    renderTasks();
    renderTeam();
    updateDashboard();
    if (selectedProject) {
      const freshProject = projects.find((project) => project.id === selectedProject.id);
      if (freshProject) {
        selectedProject = freshProject;
        renderProjectDetail(freshProject);
      }
    }
    closeModalWindow();
    showToast(wasEditing ? "Tarea actualizada" : "Tarea creada");
  } catch (error) {
    console.error("Error guardando tarea:", error);
    if (createdTask && taskId) {
      try {
        const { error: deleteError } = await db.from("tasks").delete().eq("id", taskId);
        if (deleteError) {
          console.error("No se pudo revertir la tarea:", deleteError);
        }
      } catch (rollbackError) {
        console.error("Error revirtiendo tarea:", rollbackError);
      }
    }
    showToast(error.message || "No se pudo guardar la tarea.");
  }
}

// =====================================================
// DELETE TASK
// =====================================================
async function deleteTask(taskId) {
  if (!isAdmin(currentProfile)) {
    return;
  }
  if (!confirm("¿Eliminar esta tarea?")) {
    return;
  }
  const { error } = await db.from("tasks").delete().eq("id", taskId);
  if (error) {
    console.error(error);
    showToast(error.message);
    return;
  }
  showToast("Tarea eliminada");
  await loadTasks();
  await loadTaskMembers();
  await loadTaskOccurrences();
  renderTasks();
  renderRecurringTasks();
  renderTeam();
  updateDashboard();
  if (selectedProject) {
    renderProjectDetail(selectedProject);
  }
}

// =====================================================
// TAREAS INTELIGENTES
// =====================================================
const newRecurringTaskButton = document.getElementById("newRecurringTaskButton");
if (newRecurringTaskButton) {
  newRecurringTaskButton.addEventListener("click", () => {
    if (!canManage(currentProfile)) {
      return;
    }
    activeModalMode = "recurringTask";
    modalTitle.textContent = "Nueva tarea inteligente";
    modalFields.innerHTML = buildRecurringTaskForm();
    bindRecurringTaskPreview();
    openModal();
  });
}
function buildRecurringTaskForm(template = null) {
  const selectedIds = template?.assigned_profile_id ? [template.assigned_profile_id] : [];
  const projectOptions = projects
    .map(
      (project) => `
        <option
          value="${project.id}"
          ${template && template.project_id === project.id ? "selected" : ""}
        >
          ${escapeHTML(project.name)}
        </option>
      `,
    )
    .join("");
  const selectedDays = parseWeekdays(template?.weekdays || []);
  const days = [
    [1, "Lun"],
    [2, "Mar"],
    [3, "Mié"],
    [4, "Jue"],
    [5, "Vie"],
    [6, "Sáb"],
    [0, "Dom"],
  ];
  return `
    <div class="modal-field">
      <label for="smartTaskTitle">
        Tarea / objetivo
      </label>
      <input
        id="smartTaskTitle"
        value="${template ? escapeHTML(template.title) : ""}"
        placeholder="Ej. 15 llamadas de prospección"
        required
      >
    </div>
    <div class="modal-field">
      <label for="smartTaskDescription">
        Descripción
      </label>
      <textarea
        id="smartTaskDescription"
        placeholder="Describe qué debe conseguirse."
      >${template ? escapeHTML(template.description || "") : ""}</textarea>
    </div>
    <div class="modal-field">
      <label for="smartTaskProject">
        Proyecto
      </label>
      <select id="smartTaskProject">
        <option value="">
          Sin proyecto
        </option>
        ${projectOptions}
      </select>
    </div>
    <div class="modal-field">
      <label>
        Responsable
      </label>
      ${buildMemberPicker("smartTaskMembers", selectedIds)}
    </div>
    <div class="smart-form-section">
      <div class="smart-form-section-title">
        Frecuencia
      </div>
      <div class="weekday-picker">
        ${days
          .map(
            ([day, label]) => `
            <div class="weekday-option">
              <input
                type="checkbox"
                id="smart-day-${day}"
                name="smartWeekdays"
                value="${day}"
                ${selectedDays.includes(day) ? "checked" : ""}
              >
              <label for="smart-day-${day}">
                ${label}
              </label>
            </div>
          `,
          )
          .join("")}
      </div>
    </div>
    <div class="smart-form-section">
      <div class="smart-form-section-title">
        Periodo
      </div>
      <div class="smart-target-grid">
        <div class="modal-field">
          <label for="smartStartDate">
            Desde
          </label>
          <input
            id="smartStartDate"
            type="date"
            value="${template?.start_date || ""}"
            required
          >
        </div>
        <div class="modal-field">
          <label for="smartEndDate">
            Hasta
          </label>
          <input
            id="smartEndDate"
            type="date"
            value="${template?.end_date || ""}"
          >
        </div>
      </div>
    </div>
    <div class="smart-form-section">
      <div class="smart-form-section-title">
        Meta por día
      </div>
      <div class="smart-target-grid">
        <div class="modal-field">
          <label for="smartTargetValue">
            Cantidad
          </label>
          <input
            id="smartTargetValue"
            type="number"
            min="0"
            step="1"
            value="${template?.target_value ?? ""}"
            placeholder="15"
            required
          >
        </div>
        <div class="modal-field">
          <label for="smartTargetUnit">
            Unidad
          </label>
          <input
            id="smartTargetUnit"
            value="${template?.target_unit || ""}"
            placeholder="llamadas"
            required
          >
        </div>
      </div>
    </div>
    <div class="modal-field">
      <label for="smartPriority">
        Prioridad
      </label>
      <select id="smartPriority">
        <option
          value="low"
          ${template?.priority === "low" ? "selected" : ""}
        >
          Baja
        </option>
        <option
          value="medium"
          ${!template || template.priority === "medium" ? "selected" : ""}
        >
          Media
        </option>
        <option
          value="high"
          ${template?.priority === "high" ? "selected" : ""}
        >
          Alta
        </option>
      </select>
    </div>
    <div
      id="smartTaskPreview"
      class="smart-preview"
    >
      Configura los días y el periodo para ver una vista previa.
    </div>
  `;
}
function getSmartTaskSelectedDays() {
  return [...document.querySelectorAll('input[name="smartWeekdays"]:checked')]
    .map((input) => Number(input.value))
    .sort((a, b) => a - b);
}
function getSmartTaskSelectedMemberIds() {
  return [...document.querySelectorAll('input[name="smartTaskMembers"]:checked')].map(
    (input) => input.value,
  );
}
function countRecurringDates(startDateValue, endDateValue, weekdays) {
  if (!startDateValue || !weekdays.length) {
    return 0;
  }
  const start = dateOnly(startDateValue);
  const end = dateOnly(endDateValue || startDateValue);
  if (!start || !end || end < start) {
    return 0;
  }
  let total = 0;
  let cursor = new Date(start);
  while (cursor <= end) {
    if (weekdays.includes(weekdayNumber(cursor))) {
      total += 1;
    }
    cursor = addDays(cursor, 1);
  }
  return total;
}
function bindRecurringTaskPreview() {
  const ids = ["smartStartDate", "smartEndDate", "smartTargetValue", "smartTargetUnit"];
  ids.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("input", updateRecurringTaskPreview);
      element.addEventListener("change", updateRecurringTaskPreview);
    }
  });
  document.querySelectorAll('input[name="smartWeekdays"]').forEach((checkbox) => {
    checkbox.addEventListener("change", updateRecurringTaskPreview);
  });
  updateRecurringTaskPreview();
}
function updateRecurringTaskPreview() {
  const preview = document.getElementById("smartTaskPreview");
  if (!preview) {
    return;
  }
  const startDate = document.getElementById("smartStartDate")?.value;
  const endDate = document.getElementById("smartEndDate")?.value;
  const target = document.getElementById("smartTargetValue")?.value;
  const unit = document.getElementById("smartTargetUnit")?.value?.trim();
  const weekdays = getSmartTaskSelectedDays();
  if (!startDate || !weekdays.length) {
    preview.textContent = "Configura los días y el periodo para ver una vista previa.";
    return;
  }
  const occurrences = countRecurringDates(startDate, endDate, weekdays);
  const totalTarget = normalizeNumericValue(target) * occurrences;
  preview.innerHTML = `
    <strong>
      ${occurrences}
    </strong>
    tarea(s) programada(s)
    ${
      target
        ? `
          · ${formatNumber(totalTarget)}
          ${escapeHTML(unit || "unidades")}
          como meta total
        `
        : ""
    }
  `;
}
async function saveRecurringTask() {
  const title = document.getElementById("smartTaskTitle").value.trim();
  const description = document.getElementById("smartTaskDescription").value.trim();
  const projectId = document.getElementById("smartTaskProject").value || null;
  const profileIds = getSmartTaskSelectedMemberIds();
  const weekdays = getSmartTaskSelectedDays();
  const startDate = document.getElementById("smartStartDate").value || null;
  const endDate = document.getElementById("smartEndDate").value || null;
  const targetValue = normalizeNumericValue(document.getElementById("smartTargetValue").value);
  const targetUnit = document.getElementById("smartTargetUnit").value.trim();
  const priority = document.getElementById("smartPriority").value;
  if (!title) {
    showToast("Escribe un nombre para la tarea.");
    return;
  }
  if (!startDate) {
    showToast("Selecciona una fecha de inicio.");
    return;
  }
  if (endDate && startDate > endDate) {
    showToast("La fecha final no puede ser anterior al inicio.");
    return;
  }
  if (!weekdays.length) {
    showToast("Selecciona al menos un día.");
    return;
  }
  if (!profileIds.length) {
    showToast("Asigna al menos un responsable.");
    return;
  }
  if (targetValue <= 0) {
    showToast("La meta debe ser mayor que cero.");
    return;
  }
  if (!targetUnit) {
    showToast("Indica la unidad de la meta.");
    return;
  }
  try {
    const { data: template, error } = await db
      .from("task_templates")
      .insert({
        title,
        description,
        project_id: projectId,
        assigned_profile_id: profileIds[0],
        created_by: currentUser.id,
        start_date: startDate,
        end_date: endDate,
        weekdays,
        target_value: targetValue,
        target_unit: targetUnit,
        priority,
        is_active: true,
      })
      .select()
      .single();
    if (error) {
      throw error;
    }
    const generated = await generateOccurrencesForTemplate(template, profileIds);
    closeModalWindow();
    showToast(`Tarea inteligente creada (${generated} día(s))`);
    await loadTaskTemplates();
    await loadTaskOccurrences();
    await loadTasks();
    await loadTaskMembers();
    renderRecurringTasks();
    renderTasks();
    renderTeam();
    updateDashboard();
  } catch (error) {
    console.error("Error creando tarea inteligente:", error);
    showToast(error.message || "No se pudo crear la tarea inteligente.");
  }
}
async function generateOccurrencesForTemplate(template) {
  const weekdays = parseWeekdays(template.weekdays);
  const start = dateOnly(template.start_date);
  const end = dateOnly(template.end_date || template.start_date);
  if (!start || !end) {
    return 0;
  }
  const rows = [];
  let cursor = new Date(start);
  while (cursor <= end) {
    const weekday = weekdayNumber(cursor);
    if (weekdays.includes(weekday)) {
      rows.push({
        template_id: template.id,
        occurrence_date: toISODate(cursor),
        target_value: template.target_value,
        actual_value: 0,
        status: "pending",
      });
    }
    cursor = addDays(cursor, 1);
  }
  if (!rows.length) {
    return 0;
  }
  // ignoreDuplicates: true — si el día ya existía, no le pisa el
  // progreso ya registrado (antes se reseteaba a 0 al volver a "Generar").
  const { data: occurrences, error } = await db
    .from("task_occurrences")
    .upsert(rows, {
      onConflict: "template_id,occurrence_date",
      ignoreDuplicates: true,
    })
    .select();
  if (error) {
    throw error;
  }
  return (occurrences || []).length;
}
function getTemplateProgressPercent(templateId) {
  const occurrences = getTemplateOccurrences(templateId);
  if (!occurrences.length) {
    return 0;
  }
  const completed = occurrences.filter((occurrence) => occurrence.status === "completed").length;
  return Math.round((completed / occurrences.length) * 100);
}
function getTemplateById(templateId) {
  return taskTemplates.find((template) => template.id === templateId);
}
function getTemplateOccurrences(templateId) {
  return taskOccurrences.filter((occurrence) => occurrence.template_id === templateId);
}
function getOccurrenceForToday(templateId) {
  const today = toISODate(new Date());
  return taskOccurrences.find(
    (occurrence) => occurrence.template_id === templateId && occurrence.occurrence_date === today,
  );
}
function getOccurrenceActualValue(occurrence) {
  if (!occurrence) {
    return 0;
  }
  return normalizeNumericValue(occurrence.actual_value);
}
function getUpcomingDateForTemplate(template) {
  const todayISO = toISODate(new Date());
  const future = getTemplateOccurrences(template.id)
    .filter((occurrence) => occurrence.occurrence_date > todayISO)
    .sort((a, b) => a.occurrence_date.localeCompare(b.occurrence_date));
  if (future.length) {
    return future[0].occurrence_date;
  }
  return template.start_date && template.start_date > todayISO ? template.start_date : null;
}
function occurrenceProgressPercent(occurrence) {
  if (!occurrence) {
    return 0;
  }
  const target = normalizeNumericValue(occurrence.target_value);
  if (target <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((getOccurrenceActualValue(occurrence) / target) * 100));
}
// Responsables reales de una tarea inteligente: el asignado en la
// plantilla, o si no lo hay, quien esté asignado a la tarea ya
// generada hoy (por si se reasignó manualmente después).
function getTemplateResponsibleIds(template) {
  if (template?.assigned_profile_id) {
    return [template.assigned_profile_id];
  }
  const occurrenceWithTask = getTemplateOccurrences(template?.id).find(
    (occurrence) => occurrence.task_id,
  );
  const generatedTask = occurrenceWithTask
    ? tasks.find((task) => task.id === occurrenceWithTask.task_id)
    : null;
  return generatedTask ? getTaskMemberIds(generatedTask) : [];
}
function renderRecurringTasks() {
  if (!recurringTasksList) {
    return;
  }
  if (!taskTemplates.length) {
    recurringTasksList.innerHTML = `
      <div class="smart-task-empty">
        <h4>
          No hay tareas inteligentes todavía
        </h4>
        <p>
          Crea una y la aplicación generará automáticamente las tareas de cada día.
        </p>
      </div>
    `;
    return;
  }
  recurringTasksList.innerHTML = taskTemplates
    .filter((template) => template.is_active !== false)
    .map(renderRecurringTaskCard)
    .join("");
}
function renderRecurringTaskCard(template) {
  const occurrences = getTemplateOccurrences(template.id);
  const today = getOccurrenceForToday(template.id);
  const target = normalizeNumericValue(template.target_value);
  const actual = getOccurrenceActualValue(today);
  const percent = occurrenceProgressPercent(today);
  const members = template.assigned_profile_id
    ? getProfilesByIds([template.assigned_profile_id])
    : [];
  const project = projects.find((item) => item.id === template.project_id);
  const completedCount = occurrences.filter(
    (occurrence) => occurrence.status === "completed",
  ).length;
  const timeStage = today ? getDayUrgencyStage() : "";
  return `
    <article class="smart-task-card">
      <div class="smart-task-card-top">
        <div>
          <div class="smart-task-card-title">
            ${escapeHTML(template.title)}
          </div>
          <div class="smart-task-card-subtitle">
            ${project ? escapeHTML(project.name) : "Tarea general"}
          </div>
        </div>
        <span class="badge smart">
          Recurrente
        </span>
      </div>
      <div class="smart-task-details">
        <span class="smart-task-detail">
          Meta diaria:
          <strong>
            ${formatNumber(target)}
            ${escapeHTML(template.target_unit || "unidades")}
          </strong>
        </span>
        <span class="smart-task-detail">
          ${escapeHTML(weekdaysLabel(template.weekdays))}
        </span>
        <span class="smart-task-detail">
          ${formatDate(template.start_date)}
          →
          ${template.end_date ? formatDate(template.end_date) : "Sin fin"}
        </span>
        <span class="smart-task-detail">
          ${completedCount}/${occurrences.length}
          completadas
        </span>
      </div>
        <div class="smart-task-progress">
        <div
          class="smart-task-progress-label"
        >
          <span>
            ${
              today
                ? `Hoy: ${formatNumber(actual)} / ${formatNumber(target)}`
                : "Hoy no corresponde"
            }
          </span>
          <strong>
            ${today ? percent : 0}%
          </strong>
        </div>
        <div class="progress-track">
          <div
            class="progress-bar ${timeStage}"
            style="width:${today ? percent : 0}%"
          ></div>
        </div>
      </div>
      ${
        today
          ? `
            <div class="smart-task-progress">
              <div class="smart-task-progress-label">
                <span>
                  AVANCE DEL DÍA
                </span>
                <strong data-day-progress-value>
                  ${getDayTimeProgress()}%
                </strong>
              </div>
              <div class="progress-track">
                <div
                  class="progress-bar ${timeStage}"
                  data-day-progress-bar
                  style="width:${getDayTimeProgress()}%"
                ></div>
              </div>
            </div>
          `
          : ""
      }
      ${members.length ? assignedMembersHTML(members) : ""}
      <div class="smart-task-actions">
        ${
          today
            ? `
              <button
                class="smart-task-action primary"
                type="button"
                data-start-call-template="${template.id}"
              >
                ▶ Registrar actividad
              </button>
            `
            : ""
        }
        ${
          canManage(currentProfile)
            ? `
              <button
                class="smart-task-action"
                type="button"
                data-smart-generate="${template.id}"
              >
                Generar
              </button>
              <button
                class="smart-task-action danger-button"
                type="button"
                data-smart-delete="${template.id}"
              >
                Eliminar
              </button>
            `
            : ""
        }
      </div>
    </article>
  `;
}
if (recurringTasksList) {
  recurringTasksList.addEventListener("click", (event) => {
    const generateButton = event.target.closest("[data-smart-generate]");
    const startCallButton = event.target.closest("[data-start-call-template]");
    const deleteButton = event.target.closest("[data-smart-delete]");
    if (generateButton) {
      prepareTemplateGeneration(generateButton.dataset.smartGenerate);
      return;
    }
    if (startCallButton) {
      openCallSessionForTemplate(startCallButton.dataset.startCallTemplate);
      return;
    }
    if (deleteButton) {
      deleteSmartTemplate(deleteButton.dataset.smartDelete);
    }
  });
}
async function prepareTemplateGeneration(templateId) {
  const template = getTemplateById(templateId);
  if (!template) {
    return;
  }
  try {
    const generated = await generateOccurrencesForTemplate(template);
    await loadTaskOccurrences();
    renderRecurringTasks();
    updateDashboard();
    showToast(`Se generaron ${generated} día(s).`);
  } catch (error) {
    console.error(error);
    showToast(error.message || "No se pudieron generar los días.");
  }
}
async function deleteSmartTemplate(templateId) {
  const template = getTemplateById(templateId);
  if (!template) {
    return;
  }
  if (!confirm(`¿Eliminar la tarea inteligente "${template.title}" y sus tareas generadas?`)) {
    return;
  }
  try {
     const occurrenceIds = getTemplateOccurrences(templateId).map((occurrence) => occurrence.id);
    if (occurrenceIds.length) {
      const { error: logsError } = await db
        .from("activity_logs")
        .delete()
        .in("occurrence_id", occurrenceIds);
      if (logsError) {
        throw logsError;
      }
    }
    const { error: occurrencesError } = await db
      .from("task_occurrences")
      .delete()
      .eq("template_id", templateId);
    if (occurrencesError) {
      throw occurrencesError;
    }
    const { error: templateError } = await db.from("task_templates").delete().eq("id", templateId);
    if (templateError) {
      throw templateError;
    }
    await loadTaskTemplates();
    await loadTaskOccurrences();
    renderRecurringTasks();
    updateDashboard();
    showToast("Tarea inteligente eliminada.");
  } catch (error) {
    console.error("Error eliminando tarea inteligente:", error);
    showToast(error.message || "No se pudo eliminar la tarea inteligente.");
  }
}

// =====================================================
// MODAL
// =====================================================
function openModal() {
  modal.classList.remove("hidden");
}
function closeModalWindow() {
  modal.classList.add("hidden");
  modalFields.innerHTML = "";
  activeModalMode = null;
  editingProject = null;
  editingTask = null;
  currentCallTemplate = null;
  currentCallOccurrence = null;
}
closeModal.addEventListener("click", closeModalWindow);
cancelModal.addEventListener("click", closeModalWindow);
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModalWindow();
  }
});
modalForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (isSavingModal) {
    return;
  }
  if (!activeModalMode) {
    return;
  }
  isSavingModal = true;
  const submitButton = modalForm.querySelector('button[type="submit"]');
  const originalText = submitButton ? submitButton.textContent : "";
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Guardando...";
  }
  try {
    if (activeModalMode === "project") {
      await saveProject();
    } else if (activeModalMode === "task") {
      await saveTask();
    } else if (activeModalMode === "recurringTask") {
      await saveRecurringTask();
    } else if (activeModalMode === "call") {
      await saveCallActivity();
    }
  } catch (error) {
    console.error("Error guardando desde el modal:", error);
    showToast(error.message || "Ocurrió un error al guardar.");
  } finally {
    isSavingModal = false;
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }
});

// =====================================================
// LLAMADAS — SESIONES
// =====================================================
if (startCallSessionButton) {
  startCallSessionButton.addEventListener("click", startCallSession);
}
if (endCallSessionButton) {
  endCallSessionButton.addEventListener("click", endCallSession);
}
if (registerCallButton) {
  registerCallButton.addEventListener("click", openCallRegistration);
}
function openCallSessionForTemplate(templateId) {
  const template = getTemplateById(templateId);
  if (!template) {
    return;
  }
  currentCallTemplate = template;
  currentCallOccurrence = getOccurrenceForToday(template.id);
  if (!currentCallOccurrence) {
    showToast("No existe una tarea de hoy para este objetivo.");
    return;
  }
  if (callSessionPanel) {
    callSessionPanel.classList.remove("hidden");
  }
  if (callSessionTitle) {
    callSessionTitle.textContent = template.title;
  }
  updateCallSessionUI();
  callSessionPanel?.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
  });
}
function updateCallSessionUI() {
  if (!currentCallOccurrence) {
    return;
  }
  const target = normalizeNumericValue(currentCallOccurrence.target_value);
  const actual = getOccurrenceActualValue(currentCallOccurrence);
  const percent = occurrenceProgressPercent(currentCallOccurrence);
  if (callProgressLabel) {
    callProgressLabel.textContent = `${formatNumber(actual)} / ${formatNumber(target)}`;
  }
  if (callProgressPercent) {
    callProgressPercent.textContent = `${percent}%`;
  }
  if (callProgressBar) {
    callProgressBar.style.width = `${percent}%`;
    callProgressBar.classList.remove("time-green", "time-orange", "time-red");
    callProgressBar.classList.add(getDayUrgencyStage());
  }
  const hasActiveSession = Boolean(currentCallSession);
  if (startCallSessionButton) {
    startCallSessionButton.classList.toggle("hidden", hasActiveSession);
  }
  if (endCallSessionButton) {
    endCallSessionButton.classList.toggle("hidden", !hasActiveSession);
  }
  if (registerCallButton) {
    registerCallButton.classList.toggle("hidden", !hasActiveSession);
  }
  if (callSessionStatus) {
    if (hasActiveSession) {
      callSessionStatus.textContent = "Sesión activa. Registra cada llamada.";
    } else {
      callSessionStatus.textContent = "Sesión no iniciada.";
    }
  }
}
async function startCallSession() {
  if (!currentCallTemplate || !currentCallOccurrence) {
    showToast("Selecciona primero una tarea de llamadas.");
    return;
  }
  if (currentCallSession) {
    return;
  }
  try {
    const { data, error } = await db
      .from("work_sessions")
      .insert({
        profile_id: currentUser.id,
        session_type: "calls",
        started_at: new Date().toISOString(),
        ended_at: null,
      })
      .select()
      .single();
    if (error) {
      throw error;
    }
    currentCallSession = data;
    updateCallSessionUI();
    showToast("Sesión de llamadas iniciada.");
  } catch (error) {
    console.error("Error iniciando sesión:", error);
    showToast(error.message || "No se pudo iniciar la sesión.");
  }
}
async function endCallSession() {
  if (!currentCallSession) {
    return;
  }
  try {
    const { error } = await db
      .from("work_sessions")
      .update({
        ended_at: new Date().toISOString(),
      })
      .eq("id", currentCallSession.id);
    if (error) {
      throw error;
    }
    currentCallSession = null;
    updateCallSessionUI();
    showToast("Sesión de llamadas terminada.");
  } catch (error) {
    console.error("Error terminando sesión:", error);
    showToast(error.message || "No se pudo terminar la sesión.");
  }
}
function openCallRegistration() {
  if (!currentCallSession) {
    showToast("Primero inicia una sesión.");
    return;
  }
  activeModalMode = "call";
  modalTitle.textContent = "Registrar llamada";
  modalFields.innerHTML = `
    <div class="modal-field">
      <label for="callStartedAt">
        Inicio
      </label>
      <input
        id="callStartedAt"
        type="datetime-local"
        value="${getLocalDateTimeValue(new Date())}"
        required
      >
    </div>
    <div class="modal-field">
      <label for="callEndedAt">
        Fin
      </label>
      <input
        id="callEndedAt"
        type="datetime-local"
        value="${getLocalDateTimeValue(new Date())}"
        required
      >
    </div>
    <div class="modal-field">
      <label for="callResult">
        Resultado
      </label>
      <select id="callResult">
        <option value="no_answer">
          No contestó
        </option>
        <option value="not_interested">
          No interesado
        </option>
        <option value="conversation">
          Conversación
        </option>
        <option value="interested">
          Interesado
        </option>
        <option value="meeting">
          Reunión
        </option>
      </select>
    </div>
    <div class="modal-field">
      <label for="callNotes">
        Notas
      </label>
      <textarea
        id="callNotes"
        placeholder="Notas opcionales sobre la llamada."
      ></textarea>
    </div>
  `;
  openModal();
}
function getLocalDateTimeValue(date) {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 16);
}
const CALL_RESULT_LABELS = {
  no_answer: "No contestó",
  not_interested: "No interesado",
  conversation: "Conversación",
  interested: "Interesado",
  meeting: "Reunión",
};
function getCallDurationMinutes(startedAt, endedAt) {
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }
  const difference = end.getTime() - start.getTime();
  if (difference <= 0) {
    return 0;
  }
  return Math.round(difference / (1000 * 60));
}
async function saveCallActivity() {
  if (!currentCallSession || !currentCallOccurrence) {
    showToast("No hay una sesión de llamadas activa.");
    return;
  }
  const startedLocal = document.getElementById("callStartedAt").value;
  const endedLocal = document.getElementById("callEndedAt").value;
  const result = document.getElementById("callResult").value;
  const notes = document.getElementById("callNotes").value.trim();
  if (!startedLocal || !endedLocal) {
    showToast("Completa el inicio y fin de la llamada.");
    return;
  }
  const startedAt = new Date(startedLocal).toISOString();
  const endedAt = new Date(endedLocal).toISOString();
  if (new Date(endedAt) <= new Date(startedAt)) {
    showToast("La hora final debe ser posterior a la inicial.");
    return;
  }
  try {
    const { error } = await db.from("activity_logs").insert({
      session_id: currentCallSession.id,
      profile_id: currentUser.id,
      occurrence_id: currentCallOccurrence.id,
      activity_type: "call",
      started_at: startedAt,
      ended_at: endedAt,
      result: result,
      notes: notes,
    });
    if (error) {
      throw error;
    }
    const currentActual = getOccurrenceActualValue(currentCallOccurrence);
    const newActual = currentActual + 1;
    const target = normalizeNumericValue(currentCallOccurrence.target_value);
    const newStatus = newActual >= target ? "completed" : "in_progress";
    const { error: occurrenceError } = await db
      .from("task_occurrences")
      .update({
        actual_value: newActual,
        status: newStatus,
      })
      .eq("id", currentCallOccurrence.id);
    if (occurrenceError) {
      throw occurrenceError;
    }
    closeModalWindow();
    await loadTaskOccurrences();
    await loadActivityLogs();
    currentCallOccurrence = getOccurrenceForToday(currentCallTemplate.id);
    renderRecurringTasks();
    renderTasks();
    updateDashboard();
    showToast(`Llamada registrada · ${newActual}/${target}`);
    updateCallSessionUI();
  } catch (error) {
    console.error("Error registrando llamada:", error);
    showToast(error.message || "No se pudo registrar la llamada.");
  }
}

// =====================================================
// DASHBOARD
// =====================================================
function updateDashboard() {
  const statProjects = document.getElementById("statProjects");
  const statActive = document.getElementById("statActive");
  const statPending = document.getElementById("statPending");
  const statCompleted = document.getElementById("statCompleted");
  if (statProjects) {
    statProjects.textContent = projects.length;
  }
  if (statActive) {
    statActive.textContent = projects.filter((project) => project.status === "active").length;
  }
  if (statPending) {
    statPending.textContent = tasks.filter((task) => task.status !== "completed").length;
  }
  if (statCompleted) {
    statCompleted.textContent = tasks.filter((task) => task.status === "completed").length;
  }
  renderDashboardProjects();
  renderDashboardAlerts();
  renderDashboardTasks();
}
function renderDashboardProjects() {
  const container = document.getElementById("dashboardProjects");
  if (!container) {
    return;
  }
  const active = projects.filter((project) => project.status === "active").slice(0, 5);
  if (!active.length) {
    container.innerHTML = `
      <p class="empty-text">
        No hay proyectos activos.
      </p>
    `;
    return;
  }
  container.innerHTML = active
    .map((project) => {
      const progress = getProjectProgress(project.id);
      return `
          <button
            class="dashboard-item"
            type="button"
            style="text-align:left"
            data-dashboard-project="${project.id}"
          >
            <div class="dashboard-item-title">
              ${escapeHTML(project.name)}
            </div>
            <div class="dashboard-item-meta">
              ${escapeHTML(project.client || "Sin cliente")}
              ·
              ${progress}%
            </div>
          </button>
        `;
    })
    .join("");
}
document.getElementById("dashboardProjects").addEventListener("click", (event) => {
  const button = event.target.closest("[data-dashboard-project]");
  if (!button) {
    return;
  }
  showPage("projects");
  openProjectDetail(button.dataset.dashboardProject);
});
function renderDashboardAlerts() {
  const container = document.getElementById("dashboardAlerts");
  if (!container) {
    return;
  }
  const alerts = [];
  const overdueTasks = tasks.filter(
    (task) => task.status !== "completed" && isPastDate(task.deadline),
  );
  overdueTasks.slice(0, 5).forEach((task) => {
    alerts.push({
      danger: true,
      title: "Tarea vencida",
      text: task.title,
    });
  });
  projects
    .filter((project) => {
      if (project.status === "completed") {
        return false;
      }
      const days = daysUntil(project.deadline);
      return days !== null && days >= 0 && days <= 2;
    })
    .slice(0, 5)
    .forEach((project) => {
      alerts.push({
        danger: false,
        title: "Deadline próximo",
        text: project.name,
      });
    });
  if (!alerts.length) {
    container.innerHTML = `
      <p class="empty-text">
        No hay alertas.
      </p>
    `;
    return;
  }
  container.innerHTML = alerts
    .slice(0, 6)
    .map(
      (alert) => `
          <div class="dashboard-alert">
            <span
              class="alert-dot ${alert.danger ? "danger" : ""}"
            ></span>
            <div>
              <strong>
                ${escapeHTML(alert.title)}
              </strong>
              <p>
                ${escapeHTML(alert.text)}
              </p>
            </div>
          </div>
        `,
    )
    .join("");
}
function renderDashboardTasks() {
  const container = document.getElementById("dashboardTasks");
  if (!container) {
    return;
  }
  const pending = tasks
    .filter((task) => task.status !== "completed")
    .sort((a, b) => {
      const aDate = dateOnly(a.deadline);
      const bDate = dateOnly(b.deadline);
      if (!aDate && !bDate) {
        return 0;
      }
      if (!aDate) {
        return 1;
      }
      if (!bDate) {
        return -1;
      }
      return aDate.getTime() - bDate.getTime();
    })
    .slice(0, 6);
  if (!pending.length) {
    container.innerHTML = `
      <p class="empty-text">
        No hay tareas pendientes.
      </p>
    `;
    return;
  }
  container.innerHTML = pending
    .map(
      (task) => `
          <div class="dashboard-item">
            <div class="dashboard-item-title">
              ${escapeHTML(task.title)}
            </div>
            <div class="dashboard-item-meta">
              ${
                getTaskMembers(task)
                  .map((member) => escapeHTML(member.name))
                  .join(", ") || "Sin asignar"
              }
              ·
              ${formatDate(task.deadline)}
            </div>
          </div>
        `,
    )
    .join("");
}

// =====================================================
// EQUIPO
// =====================================================
function renderTeam() {
  if (!teamList) {
    return;
  }
  if (!profiles.length) {
    teamList.innerHTML = `
      <div class="panel">
        <h3>
          No hay usuarios
        </h3>
        <p>
          No se encontraron miembros.
        </p>
      </div>
    `;
    return;
  }
  teamList.innerHTML = profiles
    .map(
      (profile) => `
        <button
          class="team-card"
          type="button"
          data-profile-id="${escapeHTML(profile.id)}"
        >
          <div class="avatar">
            ${avatarMarkup(profile)}
          </div>
          <div>
            <h3>
              ${escapeHTML(profile.name)}
            </h3>
            <p>
              ${escapeHTML(roleLabel(profile.role))}
            </p>
          </div>
        </button>
      `,
    )
    .join("");
}
teamList.addEventListener("click", (event) => {
  const card = event.target.closest(".team-card");
  if (!card) {
    return;
  }
  const profileId = card.dataset.profileId;
  if (!profileId) {
    return;
  }
  openTeamProfile(profileId);
});
function openTeamProfile(profileId) {
  const profile = profiles.find((item) => item.id === profileId);
  if (!profile) {
    return;
  }
  selectedTeamProfile = profile;
  const isOwnProfile = profile.id === currentUser?.id;
  const memberProjects = projects.filter((project) =>
    getProjectMemberIds(project.id).includes(profile.id),
  );
  const memberTasks = tasks.filter((task) => getTaskMemberIds(task).includes(profile.id));
  const pending = memberTasks.filter((task) => task.status !== "completed");
  const completed = memberTasks.filter((task) => task.status === "completed");
  const memberSmartTemplates = taskTemplates.filter(
    (template) => template.assigned_profile_id === profile.id,
  );
  teamOverview.classList.add("hidden");
  teamProfileView.classList.remove("hidden");
  teamProfileContent.innerHTML = `
    <div class="team-profile-card">
      <div class="profile-hero">
        <div class="profile-avatar-shell">
          <div class="avatar">
            ${avatarMarkup(profile)}
          </div>
          ${
            isOwnProfile
              ? `
                <button
                  type="button"
                  class="avatar-edit-button"
                  id="profileAvatarEditButton"
                  aria-label="Cambiar foto de perfil"
                  title="Cambiar foto"
                >
                  ✎
                </button>
              `
              : ""
          }
        </div>
        <div>
          <p class="eyebrow">
            PERFIL
          </p>
          <h1>
            ${escapeHTML(profile.name)}
          </h1>
          <p>
            ${escapeHTML(roleLabel(profile.role))}
          </p>
          ${
            isOwnProfile
              ? `
                <p class="assignment-help">
                  Toca el lápiz para cambiar tu foto. Se importa desde tu galería.
                </p>
              `
              : ""
          }
        </div>
      </div>
      <div class="profile-stats">
        <div class="stat">
          <span>
            PROYECTOS
          </span>
          <strong>
            ${memberProjects.length}
          </strong>
        </div>
        <div class="stat">
          <span>
            PENDIENTES
          </span>
          <strong>
            ${pending.length}
          </strong>
        </div>
        <div class="stat">
          <span>
            COMPLETADAS
          </span>
          <strong>
            ${completed.length}
          </strong>
        </div>
      </div>
           ${
        memberSmartTemplates.length
          ? (() => {
              const todayList = memberSmartTemplates.filter((template) =>
                Boolean(getOccurrenceForToday(template.id)),
              );
              const upcomingList = memberSmartTemplates.filter(
                (template) => !getOccurrenceForToday(template.id),
              );
              return `
                ${
                  todayList.length
                    ? `
                      <div class="profile-section">
                        <div class="profile-section-header">
                          <div>
                            <p class="eyebrow">
                              HOY
                            </p>
                            <h3>
                              Objetivos de hoy
                            </h3>
                          </div>
                        </div>
                        <div class="member-task-list">
                          ${todayList
                            .map((template) => {
                              const today = getOccurrenceForToday(template.id);
                              const percent = occurrenceProgressPercent(today);
                              return `
                                <div class="member-task-item">
                                  <div class="card-top">
                                    <strong>
                                      ${escapeHTML(template.title)}
                                    </strong>
                                    <span class="badge smart">
                                      ${percent}%
                                    </span>
                                  </div>
                                  <p>
                                    Meta diaria:
                                    ${formatNumber(template.target_value)}
                                    ${escapeHTML(template.target_unit || "unidades")}
                                  </p>
                                </div>
                              `;
                            })
                            .join("")}
                        </div>
                      </div>
                    `
                    : ""
                }
                ${
                  upcomingList.length
                    ? `
                      <div class="profile-section">
                        <div class="profile-section-header">
                          <div>
                            <p class="eyebrow">
                              PRÓXIMAS
                            </p>
                            <h3>
                              Tareas próximas
                            </h3>
                          </div>
                        </div>
                        <div class="member-task-list">
                          ${upcomingList
                            .map((template) => {
                              const upcomingDate = getUpcomingDateForTemplate(template);
                              return `
                                <div class="member-task-item">
                                  <div class="card-top">
                                    <strong>
                                      ${escapeHTML(template.title)}
                                    </strong>
                                    <span class="badge smart">
                                      Programada
                                    </span>
                                  </div>
                                  <p>
                                    ${
                                      upcomingDate
                                        ? `Empieza el ${formatDate(upcomingDate)}`
                                        : "Sin fecha próxima generada"
                                    }
                                  </p>
                                </div>
                              `;
                            })
                            .join("")}
                        </div>
                      </div>
                    `
                    : ""
                }
              `;
            })()
          : ""
      }
      <div class="profile-section">
        <div class="profile-section-header">
          <div>
            <p class="eyebrow">
              PRODUCCIÓN
            </p>
            <h3>
              Proyectos asignados
            </h3>
          </div>
        </div>
        ${
          memberProjects.length
            ? `
              <div class="member-project-list">
                ${memberProjects
                  .map(
                    (project) => `
                      <div class="member-project-item">
                        <div class="card-top">
                          <strong>
                            ${escapeHTML(project.name)}
                          </strong>
                          <span class="badge ${escapeHTML(project.status)}">
                            ${escapeHTML(PROJECT_STATUS_LABELS[project.status] || project.status)}
                          </span>
                        </div>
                      </div>
                    `,
                  )
                  .join("")}
              </div>
            `
            : `
              <p class="profile-empty">
                No tiene proyectos asignados.
              </p>
            `
        }
      </div>
      <div class="profile-section">
        <div class="profile-section-header">
          <div>
            <p class="eyebrow">
              TRABAJO
            </p>
            <h3>
              Tareas pendientes
            </h3>
          </div>
          <span class="badge pending">
            ${pending.length}
          </span>
        </div>
        ${
          pending.length
            ? `
              <div class="member-task-list">
                ${pending
                  .map(
                    (task) => `
                      <div class="member-task-item">
                        <strong>
                          ${escapeHTML(task.title)}
                        </strong>
                        <p>
                          ${formatDate(task.deadline)}
                        </p>
                      </div>
                    `,
                  )
                  .join("")}
              </div>
            `
            : `
              <p class="profile-empty">
                No tiene tareas pendientes.
              </p>
            `
        }
      </div>
      <div class="profile-section">
        <div class="profile-section-header">
          <div>
            <p class="eyebrow">
              COMPLETADAS
            </p>
            <h3>
              Trabajo terminado
            </h3>
          </div>
          <span class="badge completed">
            ${completed.length}
          </span>
        </div>
        ${
          completed.length
            ? `
              <div class="member-task-list">
                ${completed
                  .slice(0, 10)
                  .map(
                    (task) => `
                      <div class="member-task-item">
                        <strong>
                          ${escapeHTML(task.title)}
                        </strong>
                      </div>
                    `,
                  )
                  .join("")}
              </div>
            `
            : `
              <p class="profile-empty">
                Todavía no hay tareas completadas.
              </p>
            `
        }
      </div>
    </div>
  `;
  document.getElementById("profileAvatarEditButton")?.addEventListener("click", openAvatarPicker);
}
teamBackButton.addEventListener("click", showTeamOverview);
function showTeamOverview() {
  selectedTeamProfile = null;
  teamOverview.classList.remove("hidden");
  teamProfileView.classList.add("hidden");
  renderTeam();
}

// =====================================================
// ORGANIZACIÓN
// =====================================================
function getProfileById(id) {
  return profiles.find((profile) => profile.id === id);
}
function responsibilityPersonHTML(profileId, label, primary = false) {
  const profile = getProfileById(profileId);
  if (!profile) {
    return "";
  }
  return `
    <span
      class="responsibility-person ${primary ? "primary" : ""}"
      title="${escapeHTML(label)}"
    >
      ${escapeHTML(profile.name)}
      <span class="responsibility-role">
        ${escapeHTML(label)}
      </span>
    </span>
  `;
}
function renderOrganization() {
  if (!organizationChart) {
    return;
  }
  if (!organizationAreas.length) {
    organizationChart.innerHTML = `
      <div class="organization-empty">
        <h3>
          No hay áreas configuradas
        </h3>
        <p>
          Las áreas y responsabilidades aparecerán aquí.
        </p>
      </div>
    `;
    return;
  }
  organizationChart.innerHTML = organizationAreas
    .map((area) => {
      const areaResponsibilities = responsibilities.filter(
        (responsibility) => responsibility.area_id === area.id,
      );
      return `
            <section class="organization-area">
              <div class="organization-area-header">
                <div>
                  <div class="organization-area-title">
                    ${escapeHTML(area.name)}
                  </div>
                  <div class="organization-area-description">
                    ${escapeHTML(area.description || "")}
                  </div>
                </div>
                <span>
                  ${areaResponsibilities.length}
                  ${areaResponsibilities.length === 1 ? "responsabilidad" : "responsabilidades"}
                </span>
              </div>
              <div class="organization-area-body">
                ${
                  areaResponsibilities.length
                    ? areaResponsibilities
                        .map(
                          (responsibility) => `
                          <div class="responsibility-card">
                            <div>
                              <div class="responsibility-name">
                                ${escapeHTML(responsibility.name)}
                              </div>
                              ${
                                responsibility.description
                                  ? `
                                    <div class="responsibility-description">
                                      ${escapeHTML(responsibility.description)}
                                    </div>
                                  `
                                  : ""
                              }
                            </div>
                            <div class="responsibility-people">
                              ${
                                responsibility.primary_profile_id
                                  ? responsibilityPersonHTML(
                                      responsibility.primary_profile_id,
                                      "Encargado",
                                      true,
                                    )
                                  : ""
                              }
                              ${
                                responsibility.backup_profile_id
                                  ? responsibilityPersonHTML(
                                      responsibility.backup_profile_id,
                                      "Respaldo",
                                    )
                                  : ""
                              }
                              ${
                                responsibility.backup2_profile_id
                                  ? responsibilityPersonHTML(
                                      responsibility.backup2_profile_id,
                                      "Segundo respaldo",
                                    )
                                  : ""
                              }
                            </div>
                          </div>
                        `,
                        )
                        .join("")
                    : `
                      <p class="empty-text">
                        No hay responsabilidades configuradas en esta área.
                      </p>
                    `
                }
              </div>
            </section>
          `;
    })
    .join("");
}

// =====================================================
// ARRANQUE
// =====================================================
checkSession();
