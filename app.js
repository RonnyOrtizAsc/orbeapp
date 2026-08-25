// =====================================================
// CONFIGURACIÓN SUPABASE
// =====================================================

const SUPABASE_URL = "https://ijnetiyxrxxfhurlsnbc.supabase.co";
const SUPABASE_KEY = "sb_publishable_dnjsWgsrPMUQov5JTJuthw_KEAqjMfK";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


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

const PAGES = [
  "dashboard",
  "projects",
  "tasks",
  "team"
];


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

const teamOverview = document.getElementById("teamOverview");
const teamProfileView = document.getElementById("teamProfileView");
const teamProfileContent = document.getElementById("teamProfileContent");
const teamBackButton = document.getElementById("teamBackButton");


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

  return String(name)
    .trim()
    .charAt(0)
    .toUpperCase();
}


function showToast(message) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}


function canManage(profile) {
  return (
    profile?.role === "admin" ||
    profile?.role === "producer"
  );
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
  active: "Activo",
  completed: "Completado"
};


const TASK_STATUS_LABELS = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completada"
};


const PRIORITY_LABELS = {
  low: "Baja",
  medium: "Media",
  high: "Alta"
};


function formatDate(dateValue) {
  if (!dateValue) {
    return "Sin fecha límite";
  }

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}


// =====================================================
// RELACIONES
// =====================================================

function getProjectMemberIds(projectId) {
  return projectMembers
    .filter(item => item.project_id === projectId)
    .map(item => item.profile_id);
}


function getTaskMemberIds(task) {
  const relationIds = taskMembers
    .filter(item => item.task_id === task.id)
    .map(item => item.profile_id);

  if (relationIds.length > 0) {
    return relationIds;
  }

  // Compatibilidad con tareas antiguas.
  if (task.assigned_to) {
    return [task.assigned_to];
  }

  return [];
}


function getProfilesByIds(ids) {
  const idSet = new Set(ids);

  return profiles.filter(profile => idSet.has(profile.id));
}


function getProjectMembers(projectId) {
  return getProfilesByIds(
    getProjectMemberIds(projectId)
  );
}


function getTaskMembers(task) {
  return getProfilesByIds(
    getTaskMemberIds(task)
  );
}


function assignedMembersHTML(memberList) {
  if (!memberList.length) {
    return `<span class="no-members">Sin asignar</span>`;
  }

  return `
    <div class="assigned-members">
      ${memberList.map(member => `
        <span class="member-chip">
          ${escapeHTML(member.name)}
        </span>
      `).join("")}
    </div>
  `;
}


// =====================================================
// LOGIN
// =====================================================

loginForm.addEventListener("submit", async event => {
  event.preventDefault();

  loginError.textContent = "Iniciando sesión...";

  const email = document
    .getElementById("loginEmail")
    .value
    .trim();

  const password = document
    .getElementById("loginPassword")
    .value;

  const { error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error(error);
    loginError.textContent =
      "Correo o contraseña incorrectos.";

    return;
  }

  loginError.textContent = "";
});


// =====================================================
// SESIÓN
// =====================================================

async function checkSession() {
  const {
    data,
    error
  } = await db.auth.getSession();

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

  const {
    data: profile,
    error
  } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error(
      "Error obteniendo perfil:",
      error
    );

    showToast("No se pudo cargar tu perfil.");
    return;
  }

  currentProfile = profile;

  showApp();
  updateUserInterface();
  setTodayLabel();

  await loadAllData();

  updateDashboard();

  const hashPage = location.hash.replace("#", "");

  const initialPage = PAGES.includes(hashPage)
    ? hashPage
    : "dashboard";

  showPage(initialPage, {
    pushHistory: false
  });
}


// =====================================================
// CARGAR TODA LA INFORMACIÓN
// =====================================================

async function loadAllData() {
  const results = await Promise.allSettled([
    loadProjects(),
    loadTasks(),
    loadProfiles(),
    loadProjectMembers(),
    loadTaskMembers()
  ]);

  results.forEach(result => {
    if (result.status === "rejected") {
      console.error(
        "Error cargando módulo:",
        result.reason
      );
    }
  });

  renderProjects();
  renderTasks();
  renderTeam();
}


// =====================================================
// INTERFAZ DEL USUARIO
// =====================================================

function updateUserInterface() {
  const name = currentProfile.name || "Usuario";
  const role = currentProfile.role;

  document.getElementById("sidebarUser").textContent = name;
  document.getElementById("sidebarRole").textContent =
    roleLabel(role);

  document.getElementById("topUser").textContent = name;
  document.getElementById("welcomeName").textContent = name;

  document.getElementById("userAvatar").textContent =
    initials(name);

  document.getElementById("topAvatar").textContent =
    initials(name);

  document.body.classList.toggle(
    "can-manage",
    canManage(currentProfile)
  );
}


function setTodayLabel() {
  const label = document.getElementById("todayLabel");

  if (!label) {
    return;
  }

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
// NAVEGACIÓN
// =====================================================

document
  .querySelectorAll(".nav-item")
  .forEach(button => {
    button.addEventListener("click", () => {
      showPage(button.dataset.page);
    });
  });


document
  .querySelectorAll("[data-page-link]")
  .forEach(button => {
    button.addEventListener("click", () => {
      showPage(button.dataset.pageLink);
    });
  });


menuToggle.addEventListener(
  "click",
  openSidebar
);


closeSidebarButton.addEventListener(
  "click",
  closeSidebar
);


sidebarBackdrop.addEventListener(
  "click",
  closeSidebar
);


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
    showPage(page, {
      pushHistory: false
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


function showPage(
  page,
  { pushHistory = true } = {}
) {
  if (!PAGES.includes(page)) {
    page = "dashboard";
  }

  document
    .querySelectorAll(".page")
    .forEach(section => {
      section.classList.add("hidden");
    });

  const target = document.getElementById(
    `page-${page}`
  );

  if (target) {
    target.classList.remove("hidden");
  }

  document
    .querySelectorAll(".nav-item")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.page === page
      );
    });

  const titles = {
    dashboard: [
      "Dashboard",
      "Resumen de tu trabajo"
    ],
    projects: [
      "Proyectos",
      "Gestión de producción"
    ],
    tasks: [
      "Tareas",
      "Trabajo del equipo"
    ],
    team: [
      "Equipo",
      "Personas de Orbe"
    ]
  };

  document.getElementById("pageTitle").textContent =
    titles[page][0];

  document.getElementById("pageSubtitle").textContent =
    titles[page][1];

  backButton.classList.toggle(
    "visible",
    page !== "dashboard"
  );

  if (page === "team") {
    showTeamOverview();
  }

  closeSidebar();

  if (pushHistory) {
    if (
      location.hash.replace("#", "") !== page
    ) {
      location.hash = page;
    }
  }
}


// =====================================================
// PROJECTS — CARGAR
// =====================================================

async function loadProjects() {
  const {
    data,
    error
  } = await db
    .from("projects")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error(
      "Error cargando proyectos:",
      error
    );

    throw error;
  }

  projects = data || [];
}


async function loadProjectMembers() {
  const {
    data,
    error
  } = await db
    .from("project_members")
    .select("id,project_id,profile_id");

  if (error) {
    console.error(
      "Error cargando miembros de proyectos:",
      error
    );

    throw error;
  }

  projectMembers = data || [];
}


// =====================================================
// PROJECTS — RENDER
// =====================================================

function renderProjects() {
  const container =
    document.getElementById("projectsList");

  if (!container) {
    return;
  }

  const search =
    document
      .getElementById("projectSearch")
      .value
      .toLowerCase()
      .trim();

  const filter =
    document.getElementById("projectFilter")
      .value;

  const filtered = projects.filter(project => {
    const matchesSearch =
      (project.name || "")
        .toLowerCase()
        .includes(search) ||

      (project.client || "")
        .toLowerCase()
        .includes(search);

    const matchesFilter =
      filter === "all" ||
      project.status === filter;

    return (
      matchesSearch &&
      matchesFilter
    );
  });

  if (!filtered.length) {
    container.innerHTML = `
      <div class="panel">
        <h3>No hay proyectos</h3>
        <p>No hay proyectos que coincidan con la búsqueda.</p>
      </div>
    `;

    return;
  }

  container.innerHTML =
    filtered
      .map(renderProjectCard)
      .join("");
}


function renderProjectCard(project) {
  const members =
    getProjectMembers(project.id);

  const status =
    PROJECT_STATUS_LABELS[
      project.status
    ] || project.status;

  return `
    <article class="project-card">

      <div class="card-top">

        <div>
          <h3>
            ${escapeHTML(project.name)}
          </h3>

          <span class="project-client">
            ${escapeHTML(project.client)}
          </span>
        </div>

        <span class="badge ${escapeHTML(project.status)}">
          ${escapeHTML(status)}
        </span>

      </div>

      <p class="card-description">
        ${escapeHTML(
          project.description ||
          "Sin descripción."
        )}
      </p>

      <div>
        <div class="task-meta">
          EQUIPO
        </div>

        ${assignedMembersHTML(members)}
      </div>

      <div class="card-footer">

        <small>
          ${formatDate(project.deadline)}
        </small>

        ${
          canManage(currentProfile)
            ? `
              <div class="card-actions">

                <button
                  class="edit-button"
                  type="button"
                  onclick="editProject('${project.id}')">
                  Editar
                </button>

                ${
                  isAdmin(currentProfile)
                    ? `
                      <button
                        class="danger-button"
                        type="button"
                        onclick="deleteProject('${project.id}')">
                        Eliminar
                      </button>
                    `
                    : ""
                }

              </div>
            `
            : ""
        }

      </div>

    </article>
  `;
}


// =====================================================
// PROJECTS — FILTROS
// =====================================================

document
  .getElementById("projectSearch")
  .addEventListener(
    "input",
    renderProjects
  );


document
  .getElementById("projectFilter")
  .addEventListener(
    "change",
    renderProjects
  );


// =====================================================
// MEMBER PICKER
// =====================================================

function buildMemberPicker(
  inputName,
  selectedIds = []
) {
  if (!profiles.length) {
    return `
      <p class="assignment-help">
        No hay miembros disponibles.
      </p>
    `;
  }

  return `
    <div class="member-picker">

      ${profiles.map(profile => {
        const selected =
          selectedIds.includes(profile.id);

        const checkboxId =
          `${inputName}-${profile.id}`;

        return `
          <div class="member-option">

            <input
              type="checkbox"
              id="${checkboxId}"
              name="${inputName}"
              value="${profile.id}"
              ${selected ? "checked" : ""}>

            <label for="${checkboxId}">

              <span class="member-check">
                ${selected ? "✓" : ""}
              </span>

              <span class="member-option-info">

                <span class="member-option-name">
                  ${escapeHTML(profile.name)}
                </span>

                <span class="member-option-role">
                  ${escapeHTML(
                    roleLabel(profile.role)
                  )}
                </span>

              </span>

            </label>

          </div>
        `;
      }).join("")}

    </div>

    <p class="assignment-help">
      Puedes seleccionar uno, varios o todos los miembros.
    </p>
  `;
}


function getSelectedMemberIds(inputName) {
  return [
    ...document.querySelectorAll(
      `input[name="${inputName}"]:checked`
    )
  ].map(input => input.value);
}


// =====================================================
// PROJECTS — CREAR
// =====================================================

document
  .getElementById("newProjectButton")
  .addEventListener("click", () => {

    if (!canManage(currentProfile)) {
      return;
    }

    editingProject = null;
    activeModalMode = "project";

    modalTitle.textContent =
      "Nuevo proyecto";

    modalFields.innerHTML = `
      <div class="modal-field">
        <label for="projectName">
          Nombre
        </label>

        <input
          id="projectName"
          required>
      </div>


      <div class="modal-field">
        <label for="projectClient">
          Cliente
        </label>

        <input
          id="projectClient"
          required>
      </div>


      <div class="modal-field">
        <label for="projectDescription">
          Descripción
        </label>

        <textarea
          id="projectDescription"></textarea>
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
            Activo
          </option>

          <option value="completed">
            Completado
          </option>
        </select>
      </div>


      <div class="modal-field">
        <label for="projectDeadline">
          Fecha límite
        </label>

        <input
          type="date"
          id="projectDeadline">
      </div>


      <div class="modal-field">
        <label>
          Asignar miembros
        </label>

        ${buildMemberPicker(
          "projectMembers"
        )}
      </div>
    `;

    openModal();
  });


// =====================================================
// PROJECTS — EDITAR
// =====================================================

window.editProject = function(id) {
  const project =
    projects.find(
      item => item.id === id
    );

  if (!project) {
    return;
  }

  if (!canManage(currentProfile)) {
    return;
  }

  editingProject = project;
  activeModalMode = "project";

  modalTitle.textContent =
    "Editar proyecto";

  const selectedMembers =
    getProjectMemberIds(project.id);

  modalFields.innerHTML = `
    <div class="modal-field">
      <label for="projectName">
        Nombre
      </label>

      <input
        id="projectName"
        value="${escapeHTML(project.name)}"
        required>
    </div>


    <div class="modal-field">
      <label for="projectClient">
        Cliente
      </label>

      <input
        id="projectClient"
        value="${escapeHTML(project.client)}"
        required>
    </div>


    <div class="modal-field">
      <label for="projectDescription">
        Descripción
      </label>

      <textarea id="projectDescription">${escapeHTML(
        project.description || ""
      )}</textarea>
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
          Activo
        </option>

        <option value="completed">
          Completado
        </option>

      </select>
    </div>


    <div class="modal-field">
      <label for="projectDeadline">
        Fecha límite
      </label>

      <input
        type="date"
        id="projectDeadline"
        value="${project.deadline || ""}">
    </div>


    <div class="modal-field">
      <label>
        Asignar miembros
      </label>

      ${buildMemberPicker(
        "projectMembers",
        selectedMembers
      )}
    </div>
  `;

  document.getElementById(
    "projectStatus"
  ).value = project.status;

  openModal();
};


// =====================================================
// PROJECTS — SYNC MEMBERS
// =====================================================

async function syncProjectMembers(
  projectId,
  selectedProfileIds
) {
  const { error: deleteError } =
    await db
      .from("project_members")
      .delete()
      .eq("project_id", projectId);

  if (deleteError) {
    throw deleteError;
  }

  if (!selectedProfileIds.length) {
    return;
  }

  const rows =
    selectedProfileIds.map(profileId => ({
      project_id: projectId,
      profile_id: profileId
    }));

  const { error: insertError } =
    await db
      .from("project_members")
      .insert(rows);

  if (insertError) {
    throw insertError;
  }
}


// =====================================================
// PROJECTS — GUARDAR
// =====================================================

async function saveProject() {
  const selectedProfileIds =
    getSelectedMemberIds(
      "projectMembers"
    );

  const payload = {
    name: document
      .getElementById("projectName")
      .value
      .trim(),

    client: document
      .getElementById("projectClient")
      .value
      .trim(),

    description: document
      .getElementById("projectDescription")
      .value
      .trim(),

    status: document
      .getElementById("projectStatus")
      .value,

    deadline:
      document
        .getElementById("projectDeadline")
        .value || null
  };

  let result;

  try {
    if (editingProject) {

      result = await db
        .from("projects")
        .update(payload)
        .eq("id", editingProject.id);

      if (result.error) {
        throw result.error;
      }

      await syncProjectMembers(
        editingProject.id,
        selectedProfileIds
      );

    } else {

      result = await db
        .from("projects")
        .insert({
          ...payload,
          created_by: currentUser.id
        })
        .select()
        .single();

      if (result.error) {
        throw result.error;
      }

      await syncProjectMembers(
        result.data.id,
        selectedProfileIds
      );
    }

    closeModalWindow();

    showToast(
      editingProject
        ? "Proyecto actualizado"
        : "Proyecto creado"
    );

    await loadProjects();
    await loadProjectMembers();
    updateDashboard();
    renderProjects();

  } catch (error) {
    console.error(
      "Error guardando proyecto:",
      error
    );

    showToast(
      error.message ||
      "No se pudo guardar el proyecto."
    );
  }
}


// =====================================================
// PROJECTS — ELIMINAR
// =====================================================

window.deleteProject = async function(id) {

  if (!isAdmin(currentProfile)) {
    return;
  }

  const confirmed =
    confirm(
      "¿Seguro que quieres eliminar este proyecto?"
    );

  if (!confirmed) {
    return;
  }

  const { error } =
    await db
      .from("projects")
      .delete()
      .eq("id", id);

  if (error) {
    console.error(error);

    showToast(
      error.message
    );

    return;
  }

  projectMembers =
    projectMembers.filter(
      item =>
        item.project_id !== id
    );

  projects =
    projects.filter(
      item => item.id !== id
    );

  showToast(
    "Proyecto eliminado"
  );

  await loadProjects();
  await loadProjectMembers();
  await loadTasks();
  await loadTaskMembers();

  renderProjects();
  renderTasks();
  updateDashboard();
};


// =====================================================
// TASKS — CARGAR
// =====================================================

async function loadTasks() {
  const {
    data,
    error
  } = await db
    .from("tasks")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error(
      "Error cargando tareas:",
      error
    );

    throw error;
  }

  tasks = data || [];
}


async function loadTaskMembers() {
  const {
    data,
    error
  } = await db
    .from("task_members")
    .select("id,task_id,profile_id");

  if (error) {
    console.error(
      "Error cargando miembros de tareas:",
      error
    );

    throw error;
  }

  taskMembers = data || [];
}


// =====================================================
// TASKS — CARGAR PERFILES
// =====================================================

async function loadProfiles() {
  const {
    data,
    error
  } = await db
    .from("profiles")
    .select("id,name,role")
    .order("name");

  if (error) {
    console.error(
      "Error cargando perfiles:",
      error
    );

    throw error;
  }

  profiles = data || [];
}


// =====================================================
// TASKS — RENDER
// =====================================================

function renderTasks() {
  const search =
    document
      .getElementById("taskSearch")
      .value
      .toLowerCase()
      .trim();

  const status =
    document.getElementById(
      "taskStatusFilter"
    ).value;

  const priority =
    document.getElementById(
      "taskPriorityFilter"
    ).value;

  const filtered =
    tasks.filter(task => {

      const matchesSearch =
        (task.title || "")
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        status === "all" ||
        task.status === status;

      const matchesPriority =
        priority === "all" ||
        task.priority === priority;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });


  const columns = {
    pending:
      filtered.filter(
        task =>
          task.status === "pending"
      ),

    in_progress:
      filtered.filter(
        task =>
          task.status === "in_progress"
      ),

    completed:
      filtered.filter(
        task =>
          task.status === "completed"
      )
  };


  renderTaskColumn(
    "tasksPending",
    columns.pending
  );

  renderTaskColumn(
    "tasksProgress",
    columns.in_progress
  );

  renderTaskColumn(
    "tasksCompleted",
    columns.completed
  );


  document.getElementById(
    "pendingCount"
  ).textContent =
    columns.pending.length;

  document.getElementById(
    "progressCount"
  ).textContent =
    columns.in_progress.length;

  document.getElementById(
    "completedCount"
  ).textContent =
    columns.completed.length;
}


function renderTaskColumn(
  containerId,
  list
) {
  const container =
    document.getElementById(
      containerId
    );

  if (!list.length) {
    container.innerHTML =
      `<p class="task-meta">Sin tareas.</p>`;

    return;
  }

  container.innerHTML =
    list
      .map(renderTaskCard)
      .join("");
}


function renderTaskCard(task) {
  const project =
    projects.find(
      project =>
        project.id === task.project_id
    );

  const members =
    getTaskMembers(task);

  return `
    <article class="task-row">

      <div class="task-title">
        ${escapeHTML(task.title)}
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
        ${escapeHTML(
          project?.name ||
          "Sin proyecto"
        )}
      </div>

      <div>
        <span class="badge ${escapeHTML(task.priority)}">
          ${escapeHTML(
            PRIORITY_LABELS[
              task.priority
            ] || task.priority
          )}
        </span>
      </div>

      <div>
        <div class="task-meta">
          ASIGNADO A
        </div>

        ${assignedMembersHTML(
          members
        )}
      </div>

      ${
        canManage(currentProfile)
          ? `
            <div class="task-actions">

              <button
                class="edit-button"
                type="button"
                onclick="editTask('${task.id}')">
                Editar
              </button>

              ${
                isAdmin(currentProfile)
                  ? `
                    <button
                      class="danger-button"
                      type="button"
                      onclick="deleteTask('${task.id}')">
                      ×
                    </button>
                  `
                  : ""
              }

            </div>
          `
          : ""
      }

    </article>
  `;
}


// =====================================================
// TASK FILTERS
// =====================================================

document
  .getElementById("taskSearch")
  .addEventListener(
    "input",
    renderTasks
  );


document
  .getElementById("taskStatusFilter")
  .addEventListener(
    "change",
    renderTasks
  );


document
  .getElementById("taskPriorityFilter")
  .addEventListener(
    "change",
    renderTasks
  );


// =====================================================
// TASK FORM
// =====================================================

document
  .getElementById("newTaskButton")
  .addEventListener("click", () => {

    if (!canManage(currentProfile)) {
      return;
    }

    editingTask = null;
    activeModalMode = "task";

    modalTitle.textContent =
      "Nueva tarea";

    modalFields.innerHTML =
      buildTaskFormFields(null);

    openModal();
  });


function buildTaskFormFields(task) {
  const projectOptions =
    projects
      .map(project => `
        <option
          value="${project.id}"
          ${
            task &&
            project.id === task.project_id
              ? "selected"
              : ""
          }>
          ${escapeHTML(project.name)}
        </option>
      `)
      .join("");


  const selectedTaskMembers =
    task
      ? getTaskMemberIds(task)
      : [];


  return `
    <div class="modal-field">

      <label for="taskTitle">
        Título
      </label>

      <input
        id="taskTitle"
        value="${
          task
            ? escapeHTML(task.title)
            : ""
        }"
        required>

    </div>


    <div class="modal-field">

      <label for="taskDescription">
        Descripción
      </label>

      <textarea id="taskDescription">${
        task
          ? escapeHTML(
              task.description || ""
            )
          : ""
      }</textarea>

    </div>


    <div class="modal-field">

      <label for="taskProject">
        Proyecto
      </label>

      <select
        id="taskProject"
        required>

        <option value="">
          Seleccionar proyecto
        </option>

        ${projectOptions}

      </select>

    </div>


    <div class="modal-field">

      <label>
        Asignar a
      </label>

      ${buildMemberPicker(
        "taskMembers",
        selectedTaskMembers
      )}

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

    </div>


    <div class="modal-field">

      <label for="taskDeadline">
        Fecha límite
      </label>

      <input
        type="date"
        id="taskDeadline"
        value="${
          task &&
          task.deadline
            ? task.deadline
            : ""
        }">

    </div>
  `;
}


// =====================================================
// TASKS — EDITAR
// =====================================================

window.editTask = function(id) {
  const task =
    tasks.find(
      item => item.id === id
    );

  if (!task) {
    return;
  }

  if (!canManage(currentProfile)) {
    return;
  }

  editingTask = task;
  activeModalMode = "task";

  modalTitle.textContent =
    "Editar tarea";

  modalFields.innerHTML =
    buildTaskFormFields(task);

  document.getElementById(
    "taskStatus"
  ).value = task.status;

  document.getElementById(
    "taskPriority"
  ).value = task.priority;

  openModal();
};


// =====================================================
// TASKS — SYNC MEMBERS
// =====================================================

async function syncTaskMembers(
  taskId,
  selectedProfileIds
) {
  const { error: deleteError } =
    await db
      .from("task_members")
      .delete()
      .eq("task_id", taskId);

  if (deleteError) {
    throw deleteError;
  }

  if (!selectedProfileIds.length) {
    return;
  }

  const rows =
    selectedProfileIds.map(profileId => ({
      task_id: taskId,
      profile_id: profileId
    }));

  const { error: insertError } =
    await db
      .from("task_members")
      .insert(rows);

  if (insertError) {
    throw insertError;
  }
}


// =====================================================
// TASKS — GUARDAR
// =====================================================

async function saveTask() {
  const selectedProfileIds =
    getSelectedMemberIds(
      "taskMembers"
    );

  const payload = {
    title: document
      .getElementById("taskTitle")
      .value
      .trim(),

    description: document
      .getElementById("taskDescription")
      .value
      .trim(),

    project_id:
      document.getElementById(
        "taskProject"
      ).value,

    // Se mantiene null por compatibilidad.
    // La asignación real vive en task_members.
    assigned_to: null,

    status:
      document.getElementById(
        "taskStatus"
      ).value,

    priority:
      document.getElementById(
        "taskPriority"
      ).value,

    deadline:
      document
        .getElementById(
          "taskDeadline"
        )
        .value || null
  };


  try {

    let taskId;

    if (editingTask) {

      const { error } =
        await db
          .from("tasks")
          .update(payload)
          .eq(
            "id",
            editingTask.id
          );

      if (error) {
        throw error;
      }

      taskId =
        editingTask.id;

    } else {

      const {
        data,
        error
      } = await db
        .from("tasks")
        .insert({
          ...payload,
          created_by:
            currentUser.id
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      taskId =
        data.id;
    }


    await syncTaskMembers(
      taskId,
      selectedProfileIds
    );


    closeModalWindow();

    showToast(
      editingTask
        ? "Tarea actualizada"
        : "Tarea creada"
    );


    await loadTasks();
    await loadTaskMembers();

    renderTasks();
    renderTeam();
    updateDashboard();

  } catch (error) {

    console.error(
      "Error guardando tarea:",
      error
    );

    showToast(
      error.message ||
      "No se pudo guardar la tarea."
    );
  }
}


// =====================================================
// TASKS — ELIMINAR
// =====================================================

window.deleteTask = async function(id) {

  if (!isAdmin(currentProfile)) {
    return;
  }

  const confirmed =
    confirm(
      "¿Eliminar esta tarea?"
    );

  if (!confirmed) {
    return;
  }

  const { error } =
    await db
      .from("tasks")
      .delete()
      .eq("id", id);

  if (error) {
    console.error(error);

    showToast(
      error.message
    );

    return;
  }

  tasks =
    tasks.filter(
      task => task.id !== id
    );

  taskMembers =
    taskMembers.filter(
      item => item.task_id !== id
    );

  showToast(
    "Tarea eliminada"
  );

  await loadTasks();
  await loadTaskMembers();

  renderTasks();
  renderTeam();
  updateDashboard();
};


// =====================================================
// TEAM — LISTA
// =====================================================

function renderTeam() {
  const container =
    document.getElementById(
      "teamList"
    );

  if (!container) {
    return;
  }

  if (!profiles.length) {
    container.innerHTML =
      `
        <div class="panel">
          <h3>No hay usuarios</h3>
          <p>No se encontraron miembros del equipo.</p>
        </div>
      `;

    return;
  }


  container.innerHTML =
    profiles
      .map(profile => `
        <button
          class="team-card"
          type="button"
          onclick="openTeamProfile('${profile.id}')">

          <div class="avatar">
            ${escapeHTML(
              initials(profile.name)
            )}
          </div>

          <div>
            <h3>
              ${escapeHTML(
                profile.name
              )}
            </h3>

            <p>
              ${escapeHTML(
                roleLabel(profile.role)
              )}
            </p>
          </div>

        </button>
      `)
      .join("");
}


// =====================================================
// TEAM — MOSTRAR PERFIL
// =====================================================

window.openTeamProfile = function(profileId) {
  const profile =
    profiles.find(
      item => item.id === profileId
    );

  if (!profile) {
    return;
  }

  selectedTeamProfile = profile;

  const memberProjects =
    projects.filter(project =>
      getProjectMemberIds(
        project.id
      ).includes(profile.id)
    );


  const memberTasks =
    tasks.filter(task =>
      getTaskMemberIds(
        task
      ).includes(profile.id)
    );


  const pendingTasks =
    memberTasks.filter(
      task =>
        task.status !== "completed"
    );

  const completedTasks =
    memberTasks.filter(
      task =>
        task.status === "completed"
    );


  teamOverview.classList.add(
    "hidden"
  );

  teamProfileView.classList.remove(
    "hidden"
  );


  teamProfileContent.innerHTML = `

    <div class="team-profile-card">

      <div class="profile-hero">

        <div class="avatar">
          ${escapeHTML(
            initials(profile.name)
          )}
        </div>

        <div>
          <p class="eyebrow">
            PERFIL
          </p>

          <h1>
            ${escapeHTML(profile.name)}
          </h1>

          <p>
            ${escapeHTML(
              roleLabel(profile.role)
            )}
          </p>
        </div>

      </div>


      <div class="stats">

        <div class="stat">
          <span>PROYECTOS</span>
          <strong>
            ${memberProjects.length}
          </strong>
        </div>

        <div class="stat">
          <span>PENDIENTES</span>
          <strong>
            ${pendingTasks.length}
          </strong>
        </div>

        <div class="stat">
          <span>COMPLETADAS</span>
          <strong>
            ${completedTasks.length}
          </strong>
        </div>

      </div>


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
                  .map(project => `
                    <div class="member-project-item">

                      <div class="card-top">

                        <div>
                          <strong>
                            ${escapeHTML(
                              project.name
                            )}
                          </strong>

                          <div class="project-client">
                            ${escapeHTML(
                              project.client
                            )}
                          </div>
                        </div>

                        <span class="badge ${escapeHTML(project.status)}">
                          ${escapeHTML(
                            PROJECT_STATUS_LABELS[
                              project.status
                            ] ||
                            project.status
                          )}
                        </span>

                      </div>

                    </div>
                  `)
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
            ${pendingTasks.length}
          </span>

        </div>


        ${
          pendingTasks.length
            ? `
              <div class="member-task-list">

                ${pendingTasks
                  .map(renderProfileTask)
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
              HISTORIAL
            </p>

            <h3>
              Tareas completadas
            </h3>
          </div>

          <span class="badge completed">
            ${completedTasks.length}
          </span>

        </div>


        ${
          completedTasks.length
            ? `
              <div class="member-task-list">

                ${completedTasks
                  .map(renderProfileTask)
                  .join("")}

              </div>
            `
            : `
              <p class="profile-empty">
                No tiene tareas completadas.
              </p>
            `
        }

      </div>

    </div>
  `;
};


function renderProfileTask(task) {
  const project =
    projects.find(
      project =>
        project.id === task.project_id
    );

  return `
    <div class="member-task-item">

      <div class="card-top">

        <strong>
          ${escapeHTML(task.title)}
        </strong>

        <span class="badge ${escapeHTML(task.status)}">
          ${escapeHTML(
            TASK_STATUS_LABELS[
              task.status
            ] || task.status
          )}
        </span>

      </div>

      <p>
        ${escapeHTML(
          project?.name ||
          "Sin proyecto"
        )}
        ·
        ${escapeHTML(
          PRIORITY_LABELS[
            task.priority
          ] || task.priority
        )}
      </p>

    </div>
  `;
}


function showTeamOverview() {
  selectedTeamProfile = null;

  teamProfileView.classList.add(
    "hidden"
  );

  teamOverview.classList.remove(
    "hidden"
  );

  renderTeam();
}


teamBackButton.addEventListener(
  "click",
  showTeamOverview
);


// =====================================================
// DASHBOARD
// =====================================================

function updateDashboard() {

  const active =
    projects.filter(
      project =>
        project.status === "active"
    ).length;


  const pending =
    tasks.filter(
      task =>
        task.status !== "completed"
    ).length;


  const completed =
    tasks.filter(
      task =>
        task.status === "completed"
    ).length;


  document.getElementById(
    "statProjects"
  ).textContent =
    projects.length;


  document.getElementById(
    "statActive"
  ).textContent =
    active;


  document.getElementById(
    "statPending"
  ).textContent =
    pending;


  document.getElementById(
    "statCompleted"
  ).textContent =
    completed;


  renderDashboardProjects();
  renderDashboardTasks();
}


// =====================================================
// DASHBOARD — PROJECTS
// =====================================================

function renderDashboardProjects() {
  const container =
    document.getElementById(
      "dashboardProjects"
    );

  const recent =
    projects
      .filter(
        project =>
          project.status === "active"
      )
      .slice(0, 5);


  if (!recent.length) {
    container.innerHTML =
      "<p class='profile-empty'>No hay proyectos activos.</p>";

    return;
  }


  container.innerHTML =
    recent
      .map(project => {

        const members =
          getProjectMembers(
            project.id
          );

        return `
          <div class="project-card dashboard-card">

            <div class="card-top">

              <div>
                <h3>
                  ${escapeHTML(
                    project.name
                  )}
                </h3>

                <span class="project-client">
                  ${escapeHTML(
                    project.client
                  )}
                </span>
              </div>

              <span class="badge active">
                Activo
              </span>

            </div>

            ${assignedMembersHTML(
              members
            )}

          </div>
        `;
      })
      .join("");
}


// =====================================================
// DASHBOARD — TASKS
// =====================================================

function renderDashboardTasks() {
  const container =
    document.getElementById(
      "dashboardTasks"
    );

  const recent =
    tasks
      .filter(
        task =>
          task.status !== "completed"
      )
      .slice(0, 5);


  if (!recent.length) {
    container.innerHTML =
      "<p class='profile-empty'>No hay tareas pendientes.</p>";

    return;
  }


  container.innerHTML =
    recent
      .map(task => {

        const members =
          getTaskMembers(task);

        return `
          <div class="task-row">

            <div class="task-title">
              ${escapeHTML(
                task.title
              )}
            </div>

            <span class="badge ${escapeHTML(task.priority)}">
              ${escapeHTML(
                PRIORITY_LABELS[
                  task.priority
                ] ||
                task.priority
              )}
            </span>

            ${assignedMembersHTML(
              members
            )}

          </div>
        `;
      })
      .join("");
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


closeModal.addEventListener(
  "click",
  closeModalWindow
);


cancelModal.addEventListener(
  "click",
  closeModalWindow
);


modal.addEventListener(
  "click",
  event => {
    if (event.target === modal) {
      closeModalWindow();
    }
  }
);


// =====================================================
// GUARDAR MODAL
// =====================================================

modalForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    if (
      activeModalMode ===
      "project"
    ) {
      await saveProject();
      return;
    }

    if (
      activeModalMode ===
      "task"
    ) {
      await saveTask();
    }
  }
);


// =====================================================
// ESCAPE PARA MODAL / MENÚ
// =====================================================

document.addEventListener(
  "keydown",
  event => {

    if (event.key === "Escape") {

      if (!modal.classList.contains("hidden")) {
        closeModalWindow();
      }

      if (sidebar.classList.contains("open")) {
        closeSidebar();
      }
    }
  }
);


// =====================================================
// INICIO
// =====================================================

checkSession();
