// =====================================================
// CONFIGURACIÓN SUPABASE
// =====================================================

const SUPABASE_URL = "https://ijnetiyxrxxfhurlsnbc.supabase.co";
const SUPABASE_KEY = "sb_publishable_dnjsWgsrPMUQov5JTJuthw_KEAqjMfK";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =====================================================
// ESTADO DE LA APLICACIÓN
// =====================================================

let currentUser = null;
let currentProfile = null;

let projects = [];
let tasks = [];
let profiles = [];

let editingProject = null;
let editingTask = null;
let activeModalMode = null; // "project" | "task"

const PAGES = ["dashboard", "projects", "tasks", "team"];

// =====================================================
// ELEMENTOS
// =====================================================

const loginScreen = document.getElementById("loginScreen");
const app = document.getElementById("app");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const logoutButton = document.getElementById("logoutButton");

const sidebar = document.getElementById("sidebar");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const menuToggle = document.getElementById("menuToggle");
const closeSidebarButton = document.getElementById("closeSidebar");
const backButton = document.getElementById("backButton");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalFields = document.getElementById("modalFields");
const modalForm = document.getElementById("modalForm");
const closeModal = document.getElementById("closeModal");
const cancelModal = document.getElementById("cancelModal");

// =====================================================
// UTILIDADES
// =====================================================

function escapeHTML(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initials(name) {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

// Ronny (admin) y Mauri (productor) pueden crear/editar/eliminar.
// Para dar este permiso a alguien más, cambia su "role" en la tabla
// profiles de Supabase a "admin" o "producer".
function canManage(profile) {
  return profile?.role === "admin" || profile?.role === "producer";
}

function roleLabel(role) {
  if (role === "admin") return "Administrador";
  if (role === "producer") return "Productor";
  return "Miembro";
}

// =====================================================
// LOGIN
// =====================================================

loginForm.addEventListener("submit", async event => {
  event.preventDefault();

  loginError.textContent = "Iniciando sesión...";

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const { error } = await db.auth.signInWithPassword({ email, password });

  if (error) {
    console.error(error);
    loginError.textContent = "Correo o contraseña incorrectos.";
    return;
  }

  loginError.textContent = "";
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
}

function showApp() {
  loginScreen.classList.add("hidden");
  app.classList.remove("hidden");
}

// =====================================================
// CARGAR USUARIO
// =====================================================

async function loadUser(user) {
  currentUser = user;

  const { data: profile, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error obteniendo perfil:", error);
    showToast("No se pudo cargar tu perfil.");
    return;
  }

  currentProfile = profile;

  showApp();
  updateUserInterface();
  setTodayLabel();

  // Se usa allSettled a propósito: si un módulo falla, los demás
  // igual se cargan y el dashboard se actualiza con lo disponible.
  const results = await Promise.allSettled([
    loadProjects(),
    loadTasks(),
    loadProfiles()
  ]);

  results.forEach(result => {
    if (result.status === "rejected") {
      console.error("Error cargando datos:", result.reason);
    }
  });

  updateDashboard();

  // Navegación inicial según el hash de la URL (o dashboard por defecto)
  const initialPage = PAGES.includes(location.hash.replace("#", ""))
    ? location.hash.replace("#", "")
    : "dashboard";

  showPage(initialPage, { pushHistory: false });
}

function updateUserInterface() {
  const name = currentProfile.name;
  const role = currentProfile.role;

  document.getElementById("sidebarUser").textContent = name;
  document.getElementById("sidebarRole").textContent = roleLabel(role);
  document.getElementById("topUser").textContent = name;
  document.getElementById("welcomeName").textContent = name;
  document.getElementById("userAvatar").textContent = initials(name);
  document.getElementById("topAvatar").textContent = initials(name);

  document.body.classList.toggle("can-manage", canManage(currentProfile));
}

function setTodayLabel() {
  const label = document.getElementById("todayLabel");
  if (!label) return;

  const formatted = new Date()
    .toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long"
    })
    .toUpperCase();

  label.textContent = formatted;
}

// =====================================================
// LOGOUT
// =====================================================

logoutButton.addEventListener("click", async () => {
  await db.auth.signOut();
});

// =====================================================
// NAVEGACIÓN (menú lateral, móvil e historial)
// =====================================================

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

document.querySelectorAll("[data-page-link]").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.pageLink));
});

menuToggle.addEventListener("click", openSidebar);
closeSidebarButton.addEventListener("click", closeSidebar);
sidebarBackdrop.addEventListener("click", closeSidebar);

backButton.addEventListener("click", () => {
  if (history.length > 1) {
    history.back();
  } else {
    showPage("dashboard");
  }
});

window.addEventListener("hashchange", () => {
  const page = location.hash.replace("#", "");
  if (PAGES.includes(page)) {
    showPage(page, { pushHistory: false });
  }
});

function openSidebar() {
  sidebar.classList.add("open");
  sidebarBackdrop.classList.add("show");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarBackdrop.classList.remove("show");
}

function showPage(page, { pushHistory = true } = {}) {
  if (!PAGES.includes(page)) page = "dashboard";

  document.querySelectorAll(".page").forEach(section => {
    section.classList.add("hidden");
  });

  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.remove("hidden");

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const titles = {
    dashboard: ["Dashboard", "Resumen de tu trabajo"],
    projects: ["Proyectos", "Gestión de producción"],
    tasks: ["Tareas", "Trabajo del equipo"],
    team: ["Equipo", "Personas de Orbe"]
  };

  document.getElementById("pageTitle").textContent = titles[page][0];
  document.getElementById("pageSubtitle").textContent = titles[page][1];

  backButton.classList.toggle("visible", page !== "dashboard");

  if (page === "team") renderTeam();

  closeSidebar();

  if (pushHistory) {
    if (location.hash.replace("#", "") !== page) {
      location.hash = page;
    }
  }
}

// =====================================================
// PROYECTOS
// =====================================================

async function loadProjects() {
  const { data, error } = await db
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando proyectos:", error);
    throw error;
  }

  projects = data || [];

  try {
    renderProjects();
    renderDashboardProjects();
  } catch (renderError) {
    console.error("Error mostrando proyectos:", renderError);
  }
}

function renderProjects() {
  const container = document.getElementById("projectsList");
  const search = document.getElementById("projectSearch").value.toLowerCase();
  const filter = document.getElementById("projectFilter").value;

  const filtered = projects.filter(project => {
    const matchesSearch =
      (project.name || "").toLowerCase().includes(search) ||
      (project.client || "").toLowerCase().includes(search);

    const matchesFilter = filter === "all" || project.status === filter;

    return matchesSearch && matchesFilter;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="panel">
        <h3>No hay proyectos</h3>
        <p>Todavía no hay proyectos que mostrar.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(renderProjectCard).join("");
}

function renderProjectCard(project) {
  const statusText = {
    pending: "Pendiente",
    active: "Activo",
    completed: "Completado"
  };

  return `
    <article class="project-card">
      <div class="card-top">
        <div>
          <h3>${escapeHTML(project.name)}</h3>
          <span class="project-client">${escapeHTML(project.client)}</span>
        </div>
        <span class="badge ${project.status}">
          ${statusText[project.status] || project.status}
        </span>
      </div>

      <p class="card-description">
        ${escapeHTML(project.description || "Sin descripción.")}
      </p>

      <div class="card-footer">
        <small>${project.deadline ? `Entrega: ${project.deadline}` : "Sin fecha límite"}</small>
        ${
          canManage(currentProfile)
            ? `
              <div class="card-actions">
                <button class="edit-button" onclick="editProject('${project.id}')">Editar</button>
                <button class="danger-button" onclick="deleteProject('${project.id}')">Eliminar</button>
              </div>
            `
            : ""
        }
      </div>
    </article>
  `;
}

document.getElementById("projectSearch").addEventListener("input", renderProjects);
document.getElementById("projectFilter").addEventListener("change", renderProjects);

// =====================================================
// CREAR PROYECTO
// =====================================================

document.getElementById("newProjectButton").addEventListener("click", () => {
  if (!canManage(currentProfile)) return;

  editingProject = null;
  activeModalMode = "project";
  modalTitle.textContent = "Nuevo proyecto";

  modalFields.innerHTML = `
    <div class="modal-field">
      <label>Nombre</label>
      <input id="projectName" required>
    </div>
    <div class="modal-field">
      <label>Cliente</label>
      <input id="projectClient" required>
    </div>
    <div class="modal-field">
      <label>Descripción</label>
      <textarea id="projectDescription"></textarea>
    </div>
    <div class="modal-field">
      <label>Estado</label>
      <select id="projectStatus">
        <option value="pending">Pendiente</option>
        <option value="active">Activo</option>
        <option value="completed">Completado</option>
      </select>
    </div>
    <div class="modal-field">
      <label>Fecha límite</label>
      <input type="date" id="projectDeadline">
    </div>
  `;

  openModal();
});

// =====================================================
// EDITAR PROYECTO
// =====================================================

window.editProject = function (id) {
  const project = projects.find(p => p.id === id);
  if (!project) return;

  editingProject = project;
  activeModalMode = "project";
  modalTitle.textContent = "Editar proyecto";

  modalFields.innerHTML = `
    <div class="modal-field">
      <label>Nombre</label>
      <input id="projectName" value="${escapeHTML(project.name)}" required>
    </div>
    <div class="modal-field">
      <label>Cliente</label>
      <input id="projectClient" value="${escapeHTML(project.client)}" required>
    </div>
    <div class="modal-field">
      <label>Descripción</label>
      <textarea id="projectDescription">${escapeHTML(project.description || "")}</textarea>
    </div>
    <div class="modal-field">
      <label>Estado</label>
      <select id="projectStatus">
        <option value="pending">Pendiente</option>
        <option value="active">Activo</option>
        <option value="completed">Completado</option>
      </select>
    </div>
    <div class="modal-field">
      <label>Fecha límite</label>
      <input type="date" id="projectDeadline" value="${project.deadline || ""}">
    </div>
  `;

  document.getElementById("projectStatus").value = project.status;

  openModal();
};

// =====================================================
// GUARDAR PROYECTO
// =====================================================

async function saveProject() {
  const payload = {
    name: document.getElementById("projectName").value.trim(),
    client: document.getElementById("projectClient").value.trim(),
    description: document.getElementById("projectDescription").value.trim(),
    status: document.getElementById("projectStatus").value,
    deadline: document.getElementById("projectDeadline").value || null
  };

  let result;

  if (editingProject) {
    result = await db.from("projects").update(payload).eq("id", editingProject.id);
  } else {
    result = await db.from("projects").insert({ ...payload, created_by: currentUser.id });
  }

  if (result.error) {
    console.error(result.error);
    showToast(result.error.message);
    return;
  }

  closeModalWindow();
  showToast(editingProject ? "Proyecto actualizado" : "Proyecto creado");

  await loadProjects();
  updateDashboard();
}

// =====================================================
// ELIMINAR PROYECTO
// =====================================================

window.deleteProject = async function (id) {
  if (!confirm("¿Seguro que quieres eliminar este proyecto?")) return;

  const { error } = await db.from("projects").delete().eq("id", id);

  if (error) {
    console.error(error);
    showToast(error.message);
    return;
  }

  showToast("Proyecto eliminado");

  await loadProjects();
  await loadTasks();
  updateDashboard();
};

// =====================================================
// TAREAS
// =====================================================

async function loadTasks() {
  const { data, error } = await db
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando tareas:", error);
    throw error;
  }

  tasks = data || [];

  try {
    renderTasks();
    renderDashboardTasks();
  } catch (renderError) {
    console.error("Error mostrando tareas:", renderError);
  }
}

const statusText = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completada"
};

const priorityText = {
  low: "Baja",
  medium: "Media",
  high: "Alta"
};

function renderTasks() {
  const search = document.getElementById("taskSearch").value.toLowerCase();
  const status = document.getElementById("taskStatusFilter").value;
  const priority = document.getElementById("taskPriorityFilter").value;

  const filtered = tasks.filter(task => {
    const matchesSearch = (task.title || "").toLowerCase().includes(search);
    const matchesStatus = status === "all" || task.status === status;
    const matchesPriority = priority === "all" || task.priority === priority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const columns = {
    pending: filtered.filter(t => t.status === "pending"),
    in_progress: filtered.filter(t => t.status === "in_progress"),
    completed: filtered.filter(t => t.status === "completed")
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

  if (list.length === 0) {
    container.innerHTML = `<p class="task-meta">Sin tareas.</p>`;
    return;
  }

  container.innerHTML = list.map(renderTaskCard).join("");
}

function renderTaskCard(task) {
  const project = projects.find(p => p.id === task.project_id);
  const assigned = profiles.find(p => p.id === task.assigned_to);

  return `
    <article class="task-row">
      <div class="task-title">${escapeHTML(task.title)}</div>
      ${task.description ? `<div class="task-description">${escapeHTML(task.description)}</div>` : ""}

      <div class="task-meta">${escapeHTML(project?.name || "Sin proyecto")}</div>

      <div>
        <span class="badge ${task.priority}">${priorityText[task.priority] || task.priority}</span>
        ${assigned ? `<span class="task-meta">${escapeHTML(assigned.name)}</span>` : ""}
      </div>

      ${
        canManage(currentProfile)
          ? `
            <div class="task-actions">
              <button class="edit-button" onclick="editTask('${task.id}')">Editar</button>
              <button class="danger-button" onclick="deleteTask('${task.id}')">×</button>
            </div>
          `
          : ""
      }
    </article>
  `;
}

document.getElementById("taskSearch").addEventListener("input", renderTasks);
document.getElementById("taskStatusFilter").addEventListener("change", renderTasks);
document.getElementById("taskPriorityFilter").addEventListener("change", renderTasks);

// =====================================================
// NUEVA TAREA
// =====================================================

document.getElementById("newTaskButton").addEventListener("click", () => {
  if (!canManage(currentProfile)) return;

  editingTask = null;
  activeModalMode = "task";
  modalTitle.textContent = "Nueva tarea";

  modalFields.innerHTML = buildTaskFormFields(null);
  openModal();
});

function buildTaskFormFields(task) {
  const projectOptions = projects.map(project => `
    <option value="${project.id}" ${task && project.id === task.project_id ? "selected" : ""}>
      ${escapeHTML(project.name)}
    </option>
  `).join("");

  const userOptions = profiles.map(profile => `
    <option value="${profile.id}" ${task && profile.id === task.assigned_to ? "selected" : ""}>
      ${escapeHTML(profile.name)}
    </option>
  `).join("");

  return `
    <div class="modal-field">
      <label>Título</label>
      <input id="taskTitle" value="${task ? escapeHTML(task.title) : ""}" required>
    </div>
    <div class="modal-field">
      <label>Descripción</label>
      <textarea id="taskDescription">${task ? escapeHTML(task.description || "") : ""}</textarea>
    </div>
    <div class="modal-field">
      <label>Proyecto</label>
      <select id="taskProject" required>
        <option value="">Seleccionar proyecto</option>
        ${projectOptions}
      </select>
    </div>
    <div class="modal-field">
      <label>Asignar a</label>
      <select id="taskAssigned">
        <option value="">Sin asignar</option>
        ${userOptions}
      </select>
    </div>
    <div class="modal-field">
      <label>Estado</label>
      <select id="taskStatus">
        <option value="pending">Pendiente</option>
        <option value="in_progress">En progreso</option>
        <option value="completed">Completada</option>
      </select>
    </div>
    <div class="modal-field">
      <label>Prioridad</label>
      <select id="taskPriority">
        <option value="low">Baja</option>
        <option value="medium" selected>Media</option>
        <option value="high">Alta</option>
      </select>
    </div>
    <div class="modal-field">
      <label>Fecha límite</label>
      <input type="date" id="taskDeadline" value="${task && task.deadline ? task.deadline : ""}">
    </div>
  `;
}

// =====================================================
// EDITAR TAREA
// =====================================================

window.editTask = function (id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  editingTask = task;
  activeModalMode = "task";
  modalTitle.textContent = "Editar tarea";

  modalFields.innerHTML = buildTaskFormFields(task);

  document.getElementById("taskStatus").value = task.status;
  document.getElementById("taskPriority").value = task.priority;

  openModal();
};

// =====================================================
// GUARDAR TAREA
// =====================================================

async function saveTask() {
  const assigned = document.getElementById("taskAssigned").value;

  const payload = {
    title: document.getElementById("taskTitle").value.trim(),
    description: document.getElementById("taskDescription").value.trim(),
    project_id: document.getElementById("taskProject").value,
    assigned_to: assigned || null,
    status: document.getElementById("taskStatus").value,
    priority: document.getElementById("taskPriority").value,
    deadline: document.getElementById("taskDeadline").value || null
  };

  let result;

  if (editingTask) {
    result = await db.from("tasks").update(payload).eq("id", editingTask.id);
  } else {
    result = await db.from("tasks").insert({ ...payload, created_by: currentUser.id });
  }

  if (result.error) {
    console.error(result.error);
    showToast(result.error.message);
    return;
  }

  closeModalWindow();
  showToast(editingTask ? "Tarea actualizada" : "Tarea creada");

  await loadTasks();
  updateDashboard();
}

// =====================================================
// ELIMINAR TAREA
// =====================================================

window.deleteTask = async function (id) {
  if (!confirm("¿Eliminar esta tarea?")) return;

  const { error } = await db.from("tasks").delete().eq("id", id);

  if (error) {
    console.error(error);
    showToast(error.message);
    return;
  }

  showToast("Tarea eliminada");

  await loadTasks();
  updateDashboard();
};

// =====================================================
// USUARIOS
// =====================================================

async function loadProfiles() {
  const { data, error } = await db
    .from("profiles")
    .select("id,name,role")
    .order("name");

  if (error) {
    console.error("Error cargando usuarios:", error);
    throw error;
  }

  profiles = data || [];

  try {
    renderTeam();
  } catch (renderError) {
    console.error("Error mostrando equipo:", renderError);
  }
}

function renderTeam() {
  const container = document.getElementById("teamList");

  if (!profiles.length) {
    container.innerHTML = "<p>No hay usuarios.</p>";
    return;
  }

  container.innerHTML = profiles.map(profile => `
    <div class="team-card">
      <div class="avatar">${initials(profile.name)}</div>
      <div>
        <h3>${escapeHTML(profile.name)}</h3>
        <p>${roleLabel(profile.role)}</p>
      </div>
    </div>
  `).join("");
}

// =====================================================
// DASHBOARD
// =====================================================

function updateDashboard() {
  const active = projects.filter(p => p.status === "active").length;
  const pending = tasks.filter(t => t.status !== "completed").length;
  const completed = tasks.filter(t => t.status === "completed").length;

  document.getElementById("statProjects").textContent = projects.length;
  document.getElementById("statActive").textContent = active;
  document.getElementById("statPending").textContent = pending;
  document.getElementById("statCompleted").textContent = completed;

  renderDashboardProjects();
  renderDashboardTasks();
}

function renderDashboardProjects() {
  const container = document.getElementById("dashboardProjects");
  const recent = projects.slice(0, 5);

  if (!recent.length) {
    container.innerHTML = "<p>No hay proyectos todavía.</p>";
    return;
  }

  container.innerHTML = recent.map(project => `
    <div class="project-card">
      <div class="card-top">
        <div>
          <h3>${escapeHTML(project.name)}</h3>
          <span class="project-client">${escapeHTML(project.client)}</span>
        </div>
        <span class="badge ${project.status}">${project.status}</span>
      </div>
    </div>
  `).join("");
}

function renderDashboardTasks() {
  const container = document.getElementById("dashboardTasks");

  const recent = tasks.filter(t => t.status !== "completed").slice(0, 5);

  if (!recent.length) {
    container.innerHTML = "<p>No hay tareas pendientes.</p>";
    return;
  }

  container.innerHTML = recent.map(task => `
    <div class="task-row">
      <div class="task-title">${escapeHTML(task.title)}</div>
      <span class="badge ${task.priority}">${task.priority}</span>
    </div>
  `).join("");
}

// =====================================================
// MODAL
// =====================================================

function openModal() {
  modal.classList.remove("hidden");
}

function closeModalWindow() {
  modal.classList.add("hidden");
  editingProject = null;
  editingTask = null;
  activeModalMode = null;
}

closeModal.addEventListener("click", closeModalWindow);
cancelModal.addEventListener("click", closeModalWindow);

modal.addEventListener("click", event => {
  if (event.target === modal) closeModalWindow();
});

// =====================================================
// GUARDAR MODAL
// =====================================================

modalForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (activeModalMode === "project") {
    await saveProject();
  } else if (activeModalMode === "task") {
    await saveTask();
  }
});

// =====================================================
// INICIAR
// =====================================================

checkSession();
