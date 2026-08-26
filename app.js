// =====================================================
// SUPABASE
// =====================================================

const SUPABASE_URL =
  "https://ijnetiyxrxxfhurlsnbc.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_dnjsWgsrPMUQov5JTJuthw_KEAqjMfK";

const db =
  window.supabase.createClient(
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
let selectedProject = null;

const PAGES = [
  "dashboard",
  "projects",
  "tasks",
  "team"
];


// =====================================================
// ELEMENTOS
// =====================================================

const loginScreen =
  document.getElementById("loginScreen");

const app =
  document.getElementById("app");

const loginForm =
  document.getElementById("loginForm");

const loginError =
  document.getElementById("loginError");

const sidebar =
  document.getElementById("sidebar");

const sidebarBackdrop =
  document.getElementById("sidebarBackdrop");

const menuToggle =
  document.getElementById("menuToggle");

const closeSidebarButton =
  document.getElementById("closeSidebar");

const backButton =
  document.getElementById("backButton");

const logoutButton =
  document.getElementById("logoutButton");

const modal =
  document.getElementById("modal");

const modalTitle =
  document.getElementById("modalTitle");

const modalFields =
  document.getElementById("modalFields");

const modalForm =
  document.getElementById("modalForm");

const closeModal =
  document.getElementById("closeModal");

const cancelModal =
  document.getElementById("cancelModal");

const teamList =
  document.getElementById("teamList");

const teamOverview =
  document.getElementById("teamOverview");

const teamProfileView =
  document.getElementById("teamProfileView");

const teamProfileContent =
  document.getElementById("teamProfileContent");

const teamBackButton =
  document.getElementById("teamBackButton");

const projectDetail =
  document.getElementById("projectDetail");

const projectDetailContent =
  document.getElementById(
    "projectDetailContent"
  );

const projectDetailBack =
  document.getElementById(
    "projectDetailBack"
  );


// =====================================================
// UTILIDADES
// =====================================================

function escapeHTML(value) {

  if (
    value === null ||
    value === undefined
  ) {
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

  const toast =
    document.getElementById("toast");

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(
    showToast.timeout
  );

  showToast.timeout =
    setTimeout(() => {
      toast.classList.remove("show");
    }, 2800);
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
  active: "En producción",
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


function formatDate(value) {

  if (!value) {
    return "Sin fecha";
  }

  const date =
    new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "es-ES",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  );
}


function dateOnly(value) {

  if (!value) {
    return null;
  }

  const date =
    new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}


function startOfToday() {

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  return today;
}


function isPastDate(value) {

  const date =
    dateOnly(value);

  if (!date) {
    return false;
  }

  return date < startOfToday();
}


function isDueToday(value) {

  const date =
    dateOnly(value);

  if (!date) {
    return false;
  }

  return (
    date.getTime() ===
    startOfToday().getTime()
  );
}


function daysUntil(value) {

  const date =
    dateOnly(value);

  if (!date) {
    return null;
  }

  const difference =
    date.getTime() -
    startOfToday().getTime();

  return Math.ceil(
    difference /
      (1000 * 60 * 60 * 24)
  );
}


// =====================================================
// RELACIONES
// =====================================================

function getProjectMemberIds(
  projectId
) {

  return projectMembers
    .filter(
      item =>
        item.project_id ===
        projectId
    )
    .map(
      item =>
        item.profile_id
    );
}


function getTaskMemberIds(task) {

  const relationIds =
    taskMembers
      .filter(
        item =>
          item.task_id ===
          task.id
      )
      .map(
        item =>
          item.profile_id
      );

  if (relationIds.length) {
    return relationIds;
  }

  // Compatibilidad con tareas antiguas.
  if (task.assigned_to) {
    return [task.assigned_to];
  }

  return [];
}


function getProfilesByIds(ids) {

  const set =
    new Set(ids);

  return profiles.filter(
    profile =>
      set.has(profile.id)
  );
}


function getProjectMembers(
  projectId
) {

  return getProfilesByIds(
    getProjectMemberIds(
      projectId
    )
  );
}


function getTaskMembers(task) {

  return getProfilesByIds(
    getTaskMemberIds(task)
  );
}


function assignedMembersHTML(
  members
) {

  if (!members.length) {
    return `
      <span class="no-members">
        Sin asignar
      </span>
    `;
  }

  return `
    <div class="assigned-members">

      ${members.map(
        member => `
          <span class="member-chip">
            ${escapeHTML(
              member.name
            )}
          </span>
        `
      ).join("")}

    </div>
  `;
}


// =====================================================
// PROGRESO DE PROYECTOS
// =====================================================

function getProjectTasks(
  projectId
) {

  return tasks.filter(
    task =>
      task.project_id ===
      projectId
  );
}


function getProjectProgress(
  projectId
) {

  const projectTasks =
    getProjectTasks(
      projectId
    );

  if (!projectTasks.length) {
    return 0;
  }

  const completed =
    projectTasks.filter(
      task =>
        task.status ===
        "completed"
    ).length;

  return Math.round(
    completed /
      projectTasks.length *
      100
  );
}


function projectStatusMessage(
  project
) {

  const progress =
    getProjectProgress(
      project.id
    );

  const days =
    daysUntil(
      project.deadline
    );

  const pending =
    getProjectTasks(
      project.id
    ).filter(
      task =>
        task.status !==
        "completed"
    ).length;

  const overdue =
    getProjectTasks(
      project.id
    ).filter(
      task =>
        task.status !==
        "completed" &&
        isPastDate(
          task.deadline
        )
    ).length;


  if (
    project.status ===
    "completed"
  ) {
    return {
      type: "ok",
      text: "Proyecto completado"
    };
  }


  if (
    overdue > 0 ||
    (
      days !== null &&
      days >= 0 &&
      days <= 2 &&
      pending > 0
    )
  ) {
    return {
      type: "warning",
      text:
        overdue > 0
          ? `${overdue} tarea(s) vencida(s)`
          : `Deadline en ${days} día(s)`
    };
  }


  return {
    type: "ok",
    text:
      progress >= 70
        ? "En buen ritmo"
        : "En producción"
  };
}


// =====================================================
// LOGIN
// =====================================================

loginForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    loginError.textContent =
      "Iniciando sesión...";

    const email =
      document
        .getElementById(
          "loginEmail"
        )
        .value
        .trim();

    const password =
      document
        .getElementById(
          "loginPassword"
        )
        .value;

    const {
      error
    } =
      await db.auth.signInWithPassword({
        email,
        password
      });

    if (error) {

      console.error(error);

      loginError.textContent =
        "Correo o contraseña incorrectos.";

      return;
    }

    loginError.textContent =
      "";
  }
);


// =====================================================
// SESIÓN
// =====================================================

async function checkSession() {

  const {
    data,
    error
  } =
    await db.auth.getSession();

  if (error) {

    console.error(error);

    showLogin();

    return;
  }

  if (data.session) {

    await loadUser(
      data.session.user
    );

  } else {

    showLogin();

  }
}


db.auth.onAuthStateChange(
  async (
    event,
    session
  ) => {

    if (session) {

      await loadUser(
        session.user
      );

    } else {

      showLogin();

    }
  }
);


function showLogin() {

  app.classList.add(
    "hidden"
  );

  loginScreen.classList.remove(
    "hidden"
  );

  currentUser = null;
  currentProfile = null;

  document.body.classList.remove(
    "can-manage"
  );
}


function showApp() {

  loginScreen.classList.add(
    "hidden"
  );

  app.classList.remove(
    "hidden"
  );
}


// =====================================================
// USUARIO
// =====================================================

async function loadUser(user) {

  currentUser =
    user;

  const {
    data: profile,
    error
  } =
    await db
      .from("profiles")
      .select("*")
      .eq(
        "id",
        user.id
      )
      .single();

  if (error) {

    console.error(
      "Error obteniendo perfil:",
      error
    );

    showToast(
      "No se pudo cargar tu perfil."
    );

    return;
  }

  currentProfile =
    profile;

  showApp();

  updateUserInterface();

  setTodayLabel();

  await loadAllData();

  updateDashboard();

  const page =
    PAGES.includes(
      location.hash.replace(
        "#",
        ""
      )
    )
      ? location.hash.replace(
          "#",
          ""
        )
      : "dashboard";

  showPage(
    page,
    {
      pushHistory: false
    }
  );
}


function updateUserInterface() {

  const name =
    currentProfile.name ||
    "Usuario";

  document.getElementById(
    "sidebarUser"
  ).textContent =
    name;

  document.getElementById(
    "sidebarRole"
  ).textContent =
    roleLabel(
      currentProfile.role
    );

  document.getElementById(
    "topUser"
  ).textContent =
    name;

  document.getElementById(
    "welcomeName"
  ).textContent =
    name;

  document.getElementById(
    "userAvatar"
  ).textContent =
    initials(name);

  document.getElementById(
    "topAvatar"
  ).textContent =
    initials(name);

  document.body.classList.toggle(
    "can-manage",
    canManage(
      currentProfile
    )
  );
}


function setTodayLabel() {

  const label =
    document.getElementById(
      "todayLabel"
    );

  const date =
    new Date();

  label.textContent =
    date.toLocaleDateString(
      "es-ES",
      {
        weekday: "long",
        day: "numeric",
        month: "long"
      }
    ).toUpperCase();
}


// =====================================================
// LOGOUT
// =====================================================

logoutButton.addEventListener(
  "click",
  async () => {

    await db.auth.signOut();

  }
);


// =====================================================
// NAVEGACIÓN
// =====================================================

document
  .querySelectorAll(".nav-item")
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          showPage(
            button.dataset.page
          );

        }
      );

    }
  );


document
  .querySelectorAll("[data-page-link]")
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          showPage(
            button.dataset.pageLink
          );

        }
      );

    }
  );


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


backButton.addEventListener(
  "click",
  () => {

    if (
      document
        .getElementById(
          "projectDetail"
        )
        .classList.contains(
          "hidden"
        ) === false
    ) {

      closeProjectDetail();

      return;
    }


    if (
      history.length > 1
    ) {

      history.back();

    } else {

      showPage(
        "dashboard"
      );

    }
  }
);


window.addEventListener(
  "hashchange",
  () => {

    const page =
      location.hash.replace(
        "#",
        ""
      );

    if (
      PAGES.includes(page)
    ) {

      showPage(
        page,
        {
          pushHistory: false
        }
      );

    }

  }
);


function openSidebar() {

  sidebar.classList.add(
    "open"
  );

  sidebarBackdrop.classList.add(
    "show"
  );

  menuToggle.setAttribute(
    "aria-expanded",
    "true"
  );
}


function closeSidebar() {

  sidebar.classList.remove(
    "open"
  );

  sidebarBackdrop.classList.remove(
    "show"
  );

  menuToggle.setAttribute(
    "aria-expanded",
    "false"
  );
}


function showPage(
  page,
  {
    pushHistory = true
  } = {}
) {

  if (
    !PAGES.includes(page)
  ) {
    page = "dashboard";
  }


  document
    .querySelectorAll(".page")
    .forEach(
      section => {

        section.classList.add(
          "hidden"
        );

      }
    );


  const target =
    document.getElementById(
      `page-${page}`
    );

  if (target) {

    target.classList.remove(
      "hidden"
    );

  }


  document
    .querySelectorAll(".nav-item")
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.page ===
          page
        );

      }
    );


  const titles = {

    dashboard: [
      "Dashboard",
      "Resumen de producción"
    ],

    projects: [
      "Proyectos",
      "Producciones de Orbe"
    ],

    tasks: [
      "Tareas",
      "Todo lo que hay que hacer"
    ],

    team: [
      "Equipo",
      "Personas de Orbe"
    ]

  };


  document.getElementById(
    "pageTitle"
  ).textContent =
    titles[page][0];


  document.getElementById(
    "pageSubtitle"
  ).textContent =
    titles[page][1];


  backButton.classList.toggle(
    "visible",
    page !== "dashboard"
  );


  if (
    page === "projects"
  ) {

    closeProjectDetail();

    renderProjects();

  }


  if (
    page === "tasks"
  ) {

    renderTasks();

  }


  if (
    page === "team"
  ) {

    showTeamOverview();

  }


  if (
    page === "dashboard"
  ) {

    updateDashboard();

  }


  closeSidebar();


  if (
    pushHistory &&
    location.hash !==
      `#${page}`
  ) {

    location.hash =
      page;

  }
}


// =====================================================
// CARGAR DATOS
// =====================================================

async function loadAllData() {

  const results =
    await Promise.allSettled([
      loadProjects(),
      loadTasks(),
      loadProfiles(),
      loadProjectMembers(),
      loadTaskMembers()
    ]);


  results.forEach(
    result => {

      if (
        result.status ===
        "rejected"
      ) {

        console.error(
          "Error cargando módulo:",
          result.reason
        );

      }

    }
  );


  renderProjects();
  renderTasks();
  renderTeam();
}


async function loadProjects() {

  const {
    data,
    error
  } =
    await db
      .from("projects")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {
    throw error;
  }

  projects =
    data || [];
}


async function loadTasks() {

  const {
    data,
    error
  } =
    await db
      .from("tasks")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {
    throw error;
  }

  tasks =
    data || [];
}


async function loadProfiles() {

  const {
    data,
    error
  } =
    await db
      .from("profiles")
      .select(
        "id,name,role"
      )
      .order("name");


  if (error) {
    throw error;
  }

  profiles =
    data || [];
}


async function loadProjectMembers() {

  const {
    data,
    error
  } =
    await db
      .from("project_members")
      .select(
        "id,project_id,profile_id"
      );


  if (error) {
    throw error;
  }

  projectMembers =
    data || [];
}


async function loadTaskMembers() {

  const {
    data,
    error
  } =
    await db
      .from("task_members")
      .select(
        "id,task_id,profile_id"
      );


  if (error) {
    throw error;
  }

  taskMembers =
    data || [];
}


// =====================================================
// PROJECT FILTERS
// =====================================================

document
  .getElementById(
    "projectSearch"
  )
  .addEventListener(
    "input",
    renderProjects
  );


document
  .getElementById(
    "projectFilter"
  )
  .addEventListener(
    "change",
    renderProjects
  );


// =====================================================
// TASK FILTERS
// =====================================================

document
  .getElementById(
    "taskSearch"
  )
  .addEventListener(
    "input",
    renderTasks
  );


document
  .getElementById(
    "taskStatusFilter"
  )
  .addEventListener(
    "change",
    renderTasks
  );


document
  .getElementById(
    "taskPriorityFilter"
  )
  .addEventListener(
    "change",
    renderTasks
  );


document
  .getElementById(
    "taskProjectFilter"
  )
  .addEventListener(
    "change",
    renderTasks
  );


// =====================================================
// RENDER PROJECTS
// =====================================================

function renderProjects() {

  const container =
    document.getElementById(
      "projectsList"
    );

  if (!container) {
    return;
  }


  const search =
    document
      .getElementById(
        "projectSearch"
      )
      .value
      .toLowerCase()
      .trim();


  const filter =
    document
      .getElementById(
        "projectFilter"
      )
      .value;


  const filtered =
    projects.filter(
      project => {

        const searchMatch =
          (
            project.name ||
            ""
          )
            .toLowerCase()
            .includes(search) ||

          (
            project.client ||
            ""
          )
            .toLowerCase()
            .includes(search);


        const statusMatch =
          filter === "all" ||
          project.status ===
            filter;


        return (
          searchMatch &&
          statusMatch
        );

      }
    );


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


  container.innerHTML =
    filtered
      .map(
        renderProjectCard
      )
      .join("");
}


function renderProjectCard(
  project
) {

  const progress =
    getProjectProgress(
      project.id
    );

  const members =
    getProjectMembers(
      project.id
    );

  const message =
    projectStatusMessage(
      project
    );


  return `
    <article
      class="project-card"
      data-project-id="${project.id}"
    >

      <div class="card-top">

        <div>

          <h3>
            ${escapeHTML(
              project.name
            )}
          </h3>

          <span class="project-client">
            ${escapeHTML(
              project.client ||
              "Sin cliente"
            )}
          </span>

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


      <p class="card-description">
        ${escapeHTML(
          project.description ||
          "Sin descripción."
        )}
      </p>


      <div class="project-dates">

        <span>
          Inicio:
          ${formatDate(
            project.start_date
          )}
        </span>

        <span>
          Deadline:
          ${formatDate(
            project.deadline
          )}
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


      ${assignedMembersHTML(
        members
      )}


      ${
        message.type ===
        "warning"
          ? `
            <div class="project-warning">
              ⚠ ${escapeHTML(
                message.text
              )}
            </div>
          `
          : `
            <div class="project-ok">
              ✓ ${escapeHTML(
                message.text
              )}
            </div>
          `
      }


      <div class="card-footer">

        <small>
          ${getProjectTasks(
            project.id
          ).length}
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
            canManage(
              currentProfile
            )
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
            isAdmin(
              currentProfile
            )
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


document
  .getElementById(
    "projectsList"
  )
  .addEventListener(
    "click",
    event => {

      const openButton =
        event.target.closest(
          "[data-project-open]"
        );

      const editButton =
        event.target.closest(
          "[data-project-edit]"
        );

      const deleteButton =
        event.target.closest(
          "[data-project-delete]"
        );


      if (openButton) {

        openProjectDetail(
          openButton.dataset.projectOpen
        );

        return;
      }


      if (editButton) {

        editProject(
          editButton.dataset.projectEdit
        );

        return;
      }


      if (deleteButton) {

        deleteProject(
          deleteButton.dataset.projectDelete
        );

      }

    }
  );


// =====================================================
// PROJECT DETAIL
// =====================================================

function openProjectDetail(
  projectId
) {

  const project =
    projects.find(
      item =>
        item.id ===
        projectId
    );

  if (!project) {
    return;
  }


  selectedProject =
    project;


  document
    .getElementById(
      "projectsList"
    )
    .classList.add(
      "hidden"
    );


  document
    .querySelector(
      "#page-projects .toolbar"
    )
    .classList.add(
      "hidden"
    );


  document
    .querySelector(
      "#page-projects .page-header"
    )
    .classList.add(
      "hidden"
    );


  projectDetail.classList.remove(
    "hidden"
  );


  renderProjectDetail(
    project
  );

  backButton.classList.add(
    "visible"
  );
}


function closeProjectDetail() {

  selectedProject =
    null;

  projectDetail.classList.add(
    "hidden"
  );

  document
    .getElementById(
      "projectsList"
    )
    .classList.remove(
      "hidden"
    );


  document
    .querySelector(
      "#page-projects .toolbar"
    )
    .classList.remove(
      "hidden"
    );


  document
    .querySelector(
      "#page-projects .page-header"
    )
    .classList.remove(
      "hidden"
    );
}


projectDetailBack.addEventListener(
  "click",
  closeProjectDetail
);


function renderProjectDetail(
  project
) {

  const projectTasks =
    getProjectTasks(
      project.id
    );

  const members =
    getProjectMembers(
      project.id
    );

  const progress =
    getProjectProgress(
      project.id
    );

  const message =
    projectStatusMessage(
      project
    );


  projectDetailContent.innerHTML = `

    <div class="project-detail-header">

      <div class="project-detail-title-row">

        <div class="project-detail-title">

          <p class="eyebrow">
            PROYECTO
          </p>

          <h1>
            ${escapeHTML(
              project.name
            )}
          </h1>

          <p>
            ${escapeHTML(
              project.client ||
              "Sin cliente"
            )}
          </p>

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


      ${
        project.description
          ? `
            <p class="card-description project-detail-description">
              ${escapeHTML(
                project.description
              )}
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
            ${formatDate(
              project.start_date
            )}
          </strong>

        </div>


        <div class="project-meta-box">

          <span>
            DEADLINE
          </span>

          <strong>
            ${formatDate(
              project.deadline
            )}
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


      ${
        message.type ===
        "warning"
          ? `
            <div class="project-warning">
              ⚠ ${escapeHTML(
                message.text
              )}
            </div>
          `
          : `
            <div class="project-ok">
              ✓ ${escapeHTML(
                message.text
              )}
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


        ${assignedMembersHTML(
          members
        )}

      </div>

    </div>


    <div class="project-detail-sections">

      <div class="timeline-card">

        <div class="section-header">

          <div>

            <p class="eyebrow">
              CRONOGRAMA
            </p>

            <h3>
              Tareas
            </h3>

          </div>

        </div>


        ${
          projectTasks.length
            ? buildTimelineHTML(
                project,
                projectTasks
              )
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

          ${
            projectTasks.length
              ? projectTasks
                  .map(
                    renderProjectTask
                  )
                  .join("")
              : `
                <p class="profile-empty">
                  No hay tareas todavía.
                </p>
              `
          }

        </div>

      </div>

    </div>
  `;
}


function renderProjectTask(
  task
) {

  const members =
    getTaskMembers(task);

  return `
    <div class="member-task-item">

      <div class="card-top">

        <strong>
          ${escapeHTML(
            task.title
          )}
        </strong>

        <span class="badge ${escapeHTML(task.status)}">
          ${escapeHTML(
            TASK_STATUS_LABELS[
              task.status
            ] ||
            task.status
          )}
        </span>

      </div>


      <p>
        ${formatDate(
          task.start_date
        )}

        →

        ${formatDate(
          task.deadline
        )}
      </p>


      <div
        style="margin-top:7px"
      >
        ${assignedMembersHTML(
          members
        )}
      </div>

    </div>
  `;
}


function buildTimelineHTML(
  project,
  projectTasks
) {

  const projectStart =
    dateOnly(
      project.start_date
    );

  const projectEnd =
    dateOnly(
      project.deadline
    );


  if (
    !projectStart ||
    !projectEnd ||
    projectEnd <= projectStart
  ) {

    return `
      <p class="empty-text">
        Añade fecha de inicio y deadline al proyecto para visualizar el cronograma.
      </p>
    `;
  }


  const total =
    projectEnd.getTime() -
    projectStart.getTime();


  return `
    <div class="timeline">

      ${projectTasks.map(
        task => {

          const taskStart =
            dateOnly(
              task.start_date
            ) ||
            dateOnly(
              project.start_date
            );

          const taskEnd =
            dateOnly(
              task.deadline
            ) ||
            dateOnly(
              project.deadline
            );


          if (
            !taskStart ||
            !taskEnd
          ) {

            return `
              <div class="timeline-row">

                <div class="timeline-label">

                  <strong>
                    ${escapeHTML(
                      task.title
                    )}
                  </strong>

                  <span>
                    Sin fechas
                  </span>

                </div>

                <div class="timeline-bar-area">
                </div>

              </div>
            `;
          }


          let left =
            (
              taskStart.getTime() -
              projectStart.getTime()
            ) /
            total *
            100;


          let right =
            (
              taskEnd.getTime() -
              projectStart.getTime()
            ) /
            total *
            100;


          left =
            Math.max(
              0,
              Math.min(
                100,
                left
              )
            );


          right =
            Math.max(
              left + 2,
              Math.min(
                100,
                right
              )
            );


          const width =
            right -
            left;


          return `
            <div class="timeline-row">

              <div class="timeline-label">

                <strong>
                  ${escapeHTML(
                    task.title
                  )}
                </strong>

                <span>
                  ${formatDate(
                    task.start_date
                  )}
                  →
                  ${formatDate(
                    task.deadline
                  )}
                </span>

              </div>


              <div class="timeline-bar-area">

                <div
                  class="timeline-bar"
                  style="
                    left:${left}%;
                    width:${width}%;
                  "
                ></div>

              </div>

            </div>
          `;
        }
      ).join("")}

    </div>
  `;
}


// =====================================================
// PROJECT CREATE / EDIT
// =====================================================

document
  .getElementById(
    "newProjectButton"
  )
  .addEventListener(
    "click",
    () => {

      if (
        !canManage(
          currentProfile
        )
      ) {
        return;
      }

      editingProject =
        null;

      activeModalMode =
        "project";

      modalTitle.textContent =
        "Nuevo proyecto";

      modalFields.innerHTML =
        buildProjectForm();

      openModal();
    }
  );


function buildProjectForm(
  project = null
) {

  const selectedIds =
    project
      ? getProjectMemberIds(
          project.id
        )
      : [];


  return `

    <div class="modal-field">

      <label for="projectName">
        Nombre
      </label>

      <input
        id="projectName"
        value="${
          project
            ? escapeHTML(
                project.name
              )
            : ""
        }"
        required
      >

    </div>


    <div class="modal-field">

      <label for="projectClient">
        Cliente
      </label>

      <input
        id="projectClient"
        value="${
          project
            ? escapeHTML(
                project.client ||
                ""
              )
            : ""
        }"
      >

    </div>


    <div class="modal-field">

      <label for="projectDescription">
        Descripción
      </label>

      <textarea
        id="projectDescription"
      >${
        project
          ? escapeHTML(
              project.description ||
              ""
            )
          : ""
      }</textarea>

    </div>


    <div class="modal-field">

      <label for="projectStartDate">
        Fecha de inicio
      </label>

      <input
        id="projectStartDate"
        type="date"
        value="${
          project?.start_date ||
          ""
        }"
      >

    </div>


    <div class="modal-field">

      <label for="projectDeadline">
        Deadline
      </label>

      <input
        id="projectDeadline"
        type="date"
        value="${
          project?.deadline ||
          ""
        }"
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

      ${buildMemberPicker(
        "projectMembers",
        selectedIds
      )}

    </div>
  `;
}


function editProject(
  projectId
) {

  const project =
    projects.find(
      item =>
        item.id ===
        projectId
    );

  if (!project) {
    return;
  }

  if (
    !canManage(
      currentProfile
    )
  ) {
    return;
  }


  editingProject =
    project;

  activeModalMode =
    "project";

  modalTitle.textContent =
    "Editar proyecto";

  modalFields.innerHTML =
    buildProjectForm(
      project
    );


  document.getElementById(
    "projectStatus"
  ).value =
    project.status;

  openModal();
}


// =====================================================
// PROJECT MEMBERS
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

      ${profiles.map(
        profile => {

          const selected =
            selectedIds.includes(
              profile.id
            );

          const inputId =
            `${inputName}-${profile.id}`;


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
                    ${escapeHTML(
                      profile.name
                    )}
                  </span>

                  <span
                    class="member-option-role"
                  >
                    ${escapeHTML(
                      roleLabel(
                        profile.role
                      )
                    )}
                  </span>

                </span>

              </label>

            </div>
          `;
        }
      ).join("")}

    </div>


    <p class="assignment-help">
      Selecciona uno, varios o todos.
    </p>
  `;
}


function getSelectedMemberIds(
  inputName
) {

  return [
    ...document.querySelectorAll(
      `input[name="${inputName}"]:checked`
    )
  ].map(
    input =>
      input.value
  );
}


async function syncProjectMembers(
  projectId,
  profileIds
) {

  const {
    error: deleteError
  } =
    await db
      .from("project_members")
      .delete()
      .eq(
        "project_id",
        projectId
      );


  if (deleteError) {
    throw deleteError;
  }


  if (!profileIds.length) {
    return;
  }


  const rows =
    profileIds.map(
      profileId => ({
        project_id:
          projectId,
        profile_id:
          profileId
      })
    );


  const {
    error
  } =
    await db
      .from("project_members")
      .insert(rows);


  if (error) {
    throw error;
  }
}


// =====================================================
// SAVE PROJECT
// =====================================================

async function saveProject() {

  const startDate =
    document
      .getElementById(
        "projectStartDate"
      )
      .value ||
    null;


  const deadline =
    document
      .getElementById(
        "projectDeadline"
      )
      .value ||
    null;


  if (
    startDate &&
    deadline &&
    startDate >
      deadline
  ) {

    showToast(
      "La fecha de inicio no puede ser posterior al deadline."
    );

    return;
  }


  const profileIds =
    getSelectedMemberIds(
      "projectMembers"
    );


  const payload = {

    name:
      document
        .getElementById(
          "projectName"
        )
        .value
        .trim(),

    client:
      document
        .getElementById(
          "projectClient"
        )
        .value
        .trim(),

    description:
      document
        .getElementById(
          "projectDescription"
        )
        .value
        .trim(),

    start_date:
      startDate,

    deadline:
      deadline,

    status:
      document
        .getElementById(
          "projectStatus"
        )
        .value
  };


  try {

    let projectId;


    if (editingProject) {

      const {
        error
      } =
        await db
          .from("projects")
          .update(
            payload
          )
          .eq(
            "id",
            editingProject.id
          );


      if (error) {
        throw error;
      }


      projectId =
        editingProject.id;

    } else {

      const {
        data,
        error
      } =
        await db
          .from("projects")
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


      projectId =
        data.id;
    }


    await syncProjectMembers(
      projectId,
      profileIds
    );


    closeModalWindow();

    showToast(
      editingProject
        ? "Proyecto actualizado"
        : "Proyecto creado"
    );


    await loadProjects();
    await loadProjectMembers();


    renderProjects();
    renderTeam();
    updateDashboard();


    if (
      selectedProject &&
      selectedProject.id ===
        projectId
    ) {

      selectedProject =
        projects.find(
          project =>
            project.id ===
            projectId
        );

      renderProjectDetail(
        selectedProject
      );
    }


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
// DELETE PROJECT
// =====================================================

async function deleteProject(
  projectId
) {

  if (
    !isAdmin(
      currentProfile
    )
  ) {
    return;
  }


  if (
    !confirm(
      "¿Seguro que quieres eliminar este proyecto?"
    )
  ) {
    return;
  }


  const {
    error
  } =
    await db
      .from("projects")
      .delete()
      .eq(
        "id",
        projectId
      );


  if (error) {

    console.error(
      error
    );

    showToast(
      error.message
    );

    return;
  }


  if (
    selectedProject &&
    selectedProject.id ===
      projectId
  ) {

    closeProjectDetail();
  }


  showToast(
    "Proyecto eliminado"
  );


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

  const select =
    document.getElementById(
      "taskProjectFilter"
    );

  if (!select) {
    return;
  }


  const current =
    select.value;


  select.innerHTML = `

    <option value="all">
      Todos los proyectos
    </option>

    <option value="none">
      Sin proyecto
    </option>

    ${projects.map(
      project => `
        <option value="${project.id}">
          ${escapeHTML(
            project.name
          )}
        </option>
      `
    ).join("")}

  `;


  if (
    [
      "all",
      "none",
      ...projects.map(
        project =>
          project.id
      )
    ].includes(
      current
    )
  ) {

    select.value =
      current;

  } else {

    select.value =
      "all";

  }
}


// =====================================================
// RENDER TASKS
// =====================================================

function renderTasks() {

  refreshTaskProjectFilter();


  const search =
    document
      .getElementById(
        "taskSearch"
      )
      .value
      .toLowerCase()
      .trim();


  const status =
    document
      .getElementById(
        "taskStatusFilter"
      )
      .value;


  const priority =
    document
      .getElementById(
        "taskPriorityFilter"
      )
      .value;


  const projectFilter =
    document
      .getElementById(
        "taskProjectFilter"
      )
      .value;


  const filtered =
    tasks.filter(
      task => {

        const searchMatch =
          (
            task.title ||
            ""
          )
            .toLowerCase()
            .includes(search);


        const statusMatch =
          status === "all" ||
          task.status ===
            status;


        const priorityMatch =
          priority === "all" ||
          task.priority ===
            priority;


        let projectMatch =
          true;


        if (
          projectFilter ===
          "none"
        ) {

          projectMatch =
            !task.project_id;

        } else if (
          projectFilter !==
          "all"
        ) {

          projectMatch =
            task.project_id ===
            projectFilter;

        }


        return (
          searchMatch &&
          statusMatch &&
          priorityMatch &&
          projectMatch
        );
      }
    );


  const columns = {

    pending:
      filtered.filter(
        task =>
          task.status ===
          "pending"
      ),

    in_progress:
      filtered.filter(
        task =>
          task.status ===
          "in_progress"
      ),

    completed:
      filtered.filter(
        task =>
          task.status ===
          "completed"
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
      `
        <p class="empty-text">
          Sin tareas.
        </p>
      `;

    return;
  }


  container.innerHTML =
    list
      .map(
        renderTaskCard
      )
      .join("");
}


function renderTaskCard(task) {

  const project =
    projects.find(
      project =>
        project.id ===
        task.project_id
    );


  const members =
    getTaskMembers(
      task
    );


  const overdue =
    task.status !==
      "completed" &&
    isPastDate(
      task.deadline
    );


  return `

    <article class="task-row">

      <div class="card-top">

        <div>

          <div class="task-title">
            ${escapeHTML(
              task.title
            )}
          </div>

          <div class="task-project-label">

            ${
              project
                ? escapeHTML(
                    project.name
                  )
                : "Tarea general"
            }

          </div>

        </div>


        <span class="badge ${escapeHTML(task.status)}">
          ${escapeHTML(
            TASK_STATUS_LABELS[
              task.status
            ] ||
            task.status
          )}
        </span>

      </div>


      ${
        task.description
          ? `
            <div class="task-description">
              ${escapeHTML(
                task.description
              )}
            </div>
          `
          : ""
      }


      <div class="task-meta">

        ${formatDate(
          task.start_date
        )}

        →

        ${formatDate(
          task.deadline
        )}

      </div>


      ${
        overdue
          ? `
            <div class="task-overdue">
              ⚠ Tarea vencida
            </div>
          `
          : ""
      }


      <div>

        <span class="badge ${escapeHTML(task.priority)}">
          ${escapeHTML(
            PRIORITY_LABELS[
              task.priority
            ] ||
            task.priority
          )}
        </span>

      </div>


      ${assignedMembersHTML(
        members
      )}


      ${
        canManage(
          currentProfile
        )
          ? `
            <div class="task-actions">

              <button
                class="edit-button"
                type="button"
                data-task-edit="${task.id}"
              >
                Editar
              </button>


              ${
                isAdmin(
                  currentProfile
                )
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
          `
          : ""
      }

    </article>
  `;
}


document
  .querySelectorAll(
    ".kanban-tasks"
  )
  .forEach(
    container => {

      container.addEventListener(
        "click",
        event => {

          const edit =
            event.target.closest(
              "[data-task-edit]"
            );

          const remove =
            event.target.closest(
              "[data-task-delete]"
            );


          if (edit) {

            editTask(
              edit.dataset.taskEdit
            );

            return;
          }


          if (remove) {

            deleteTask(
              remove.dataset.taskDelete
            );

          }

        }
      );

    }
  );


// =====================================================
// TASK FORM
// =====================================================

document
  .getElementById(
    "newTaskButton"
  )
  .addEventListener(
    "click",
    () => {

      if (
        !canManage(
          currentProfile
        )
      ) {
        return;
      }


      editingTask =
        null;

      activeModalMode =
        "task";

      modalTitle.textContent =
        "Nueva tarea";

      modalFields.innerHTML =
        buildTaskForm();

      openModal();
    }
  );


function buildTaskForm(
  task = null
) {

  const selectedIds =
    task
      ? getTaskMemberIds(
          task
        )
      : [];


  const projectOptions =
    projects.map(
      project => `
        <option
          value="${project.id}"
          ${
            task &&
            task.project_id ===
              project.id
              ? "selected"
              : ""
          }
        >
          ${escapeHTML(
            project.name
          )}
        </option>
      `
    ).join("");


  return `

    <div class="modal-field">

      <label for="taskTitle">
        Título
      </label>

      <input
        id="taskTitle"
        value="${
          task
            ? escapeHTML(
                task.title
              )
            : ""
        }"
        required
      >

    </div>


    <div class="modal-field">

      <label for="taskDescription">
        Descripción
      </label>

      <textarea
        id="taskDescription"
      >${
        task
          ? escapeHTML(
              task.description ||
              ""
            )
          : ""
      }</textarea>

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
        value="${
          task?.start_date ||
          ""
        }"
      >

    </div>


    <div class="modal-field">

      <label for="taskDeadline">
        Deadline
      </label>

      <input
        id="taskDeadline"
        type="date"
        value="${
          task?.deadline ||
          ""
        }"
      >

    </div>


    <div class="modal-field">

      <label>
        Asignar miembros
      </label>

      ${buildMemberPicker(
        "taskMembers",
        selectedIds
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
  `;
}


function editTask(
  taskId
) {

  const task =
    tasks.find(
      item =>
        item.id ===
        taskId
    );


  if (!task) {
    return;
  }


  if (
    !canManage(
      currentProfile
    )
  ) {
    return;
  }


  editingTask =
    task;

  activeModalMode =
    "task";

  modalTitle.textContent =
    "Editar tarea";

  modalFields.innerHTML =
    buildTaskForm(
      task
    );


  document.getElementById(
    "taskStatus"
  ).value =
    task.status;


  document.getElementById(
    "taskPriority"
  ).value =
    task.priority;


  openModal();
}


// =====================================================
// TASK MEMBERS
// =====================================================

async function syncTaskMembers(
  taskId,
  profileIds
) {

  const {
    error: deleteError
  } =
    await db
      .from("task_members")
      .delete()
      .eq(
        "task_id",
        taskId
      );


  if (deleteError) {
    throw deleteError;
  }


  if (!profileIds.length) {
    return;
  }


  const rows =
    profileIds.map(
      profileId => ({
        task_id:
          taskId,
        profile_id:
          profileId
      })
    );


  const {
    error
  } =
    await db
      .from("task_members")
      .insert(rows);


  if (error) {
    throw error;
  }
}


// =====================================================
// SAVE TASK
// =====================================================

async function saveTask() {

  const startDate =
    document
      .getElementById(
        "taskStartDate"
      )
      .value ||
    null;


  const deadline =
    document
      .getElementById(
        "taskDeadline"
      )
      .value ||
    null;


  if (
    startDate &&
    deadline &&
    startDate >
      deadline
  ) {

    showToast(
      "La fecha de inicio no puede ser posterior al deadline."
    );

    return;
  }


  const projectValue =
    document
      .getElementById(
        "taskProject"
      )
      .value;


  const profileIds =
    getSelectedMemberIds(
      "taskMembers"
    );


  const payload = {

    title:
      document
        .getElementById(
          "taskTitle"
        )
        .value
        .trim(),

    description:
      document
        .getElementById(
          "taskDescription"
        )
        .value
        .trim(),

    project_id:
      projectValue ||
      null,

    assigned_to:
      null,

    start_date:
      startDate,

    deadline:
      deadline,

    status:
      document
        .getElementById(
          "taskStatus"
        )
        .value,

    priority:
      document
        .getElementById(
          "taskPriority"
        )
        .value

  };


  try {

    let taskId;


    if (editingTask) {

      const {
        error
      } =
        await db
          .from("tasks")
          .update(
            payload
          )
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
      } =
        await db
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
      profileIds
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


    if (
      selectedProject
    ) {

      const freshProject =
        projects.find(
          project =>
            project.id ===
            selectedProject.id
        );

      if (freshProject) {

        selectedProject =
          freshProject;

        renderProjectDetail(
          freshProject
        );

      }
    }


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
// DELETE TASK
// =====================================================

async function deleteTask(
  taskId
) {

  if (
    !isAdmin(
      currentProfile
    )
  ) {
    return;
  }


  if (
    !confirm(
      "¿Eliminar esta tarea?"
    )
  ) {
    return;
  }


  const {
    error
  } =
    await db
      .from("tasks")
      .delete()
      .eq(
        "id",
        taskId
      );


  if (error) {

    console.error(
      error
    );

    showToast(
      error.message
    );

    return;
  }


  showToast(
    "Tarea eliminada"
  );


  await loadTasks();
  await loadTaskMembers();


  renderTasks();
  renderTeam();
  updateDashboard();


  if (
    selectedProject
  ) {

    renderProjectDetail(
      selectedProject
    );

  }
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


  teamList.innerHTML =
    profiles.map(
      profile => `

        <button
          class="team-card"
          type="button"
          data-profile-id="${escapeHTML(profile.id)}"
        >

          <div class="avatar">
            ${escapeHTML(
              initials(
                profile.name
              )
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
                roleLabel(
                  profile.role
                )
              )}
            </p>

          </div>

        </button>

      `
    ).join("");
}


teamList.addEventListener(
  "click",
  event => {

    const card =
      event.target.closest(
        ".team-card"
      );

    if (!card) {
      return;
    }


    const profileId =
      card.dataset.profileId;

    if (!profileId) {
      return;
    }


    openTeamProfile(
      profileId
    );
  }
);


function openTeamProfile(
  profileId
) {

  const profile =
    profiles.find(
      item =>
        item.id ===
        profileId
    );

  if (!profile) {
    return;
  }


  selectedTeamProfile =
    profile;


  const memberProjects =
    projects.filter(
      project =>
        getProjectMemberIds(
          project.id
        ).includes(
          profile.id
        )
    );


  const memberTasks =
    tasks.filter(
      task =>
        getTaskMemberIds(
          task
        ).includes(
          profile.id
        )
    );


  const pending =
    memberTasks.filter(
      task =>
        task.status !==
        "completed"
    );


  const completed =
    memberTasks.filter(
      task =>
        task.status ===
        "completed"
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
            initials(
              profile.name
            )
          )}

        </div>

        <div>

          <p class="eyebrow">
            PERFIL
          </p>

          <h1>
            ${escapeHTML(
              profile.name
            )}
          </h1>

          <p>
            ${escapeHTML(
              roleLabel(
                profile.role
              )
            )}
          </p>

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
                    project => `
                      <div class="member-project-item">

                        <div class="card-top">

                          <strong>
                            ${escapeHTML(
                              project.name
                            )}
                          </strong>

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
                    `
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
                    renderProfileTask
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
              HISTORIAL
            </p>

            <h3>
              Tareas completadas
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
                  .map(
                    renderProfileTask
                  )
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
}


function renderProfileTask(
  task
) {

  const project =
    projects.find(
      item =>
        item.id ===
        task.project_id
    );


  return `

    <div class="member-task-item">

      <div class="card-top">

        <strong>
          ${escapeHTML(
            task.title
          )}
        </strong>

        <span class="badge ${escapeHTML(task.status)}">
          ${escapeHTML(
            TASK_STATUS_LABELS[
              task.status
            ] ||
            task.status
          )}
        </span>

      </div>


      <p>

        ${
          project
            ? escapeHTML(
                project.name
              )
            : "Tarea general"
        }

        ·

        ${formatDate(
          task.deadline
        )}

      </p>

    </div>
  `;
}


function showTeamOverview() {

  selectedTeamProfile =
    null;

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
        project.status ===
        "active"
    ).length;


  const pending =
    tasks.filter(
      task =>
        task.status !==
        "completed"
    ).length;


  const completed =
    tasks.filter(
      task =>
        task.status ===
        "completed"
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
  renderDashboardAlerts();
  renderDashboardTasks();
}


function renderDashboardProjects() {

  const container =
    document.getElementById(
      "dashboardProjects"
    );


  const activeProjects =
    projects
      .filter(
        project =>
          project.status ===
          "active"
      )
      .slice(
        0,
        5
      );


  if (!activeProjects.length) {

    container.innerHTML = `
      <p class="empty-text">
        No hay proyectos activos.
      </p>
    `;

    return;
  }


  container.innerHTML =
    activeProjects.map(
      project => {

        const progress =
          getProjectProgress(
            project.id
          );


        return `

          <div class="dashboard-item">

            <div class="card-top">

              <div>

                <div class="dashboard-item-title">
                  ${escapeHTML(
                    project.name
                  )}
                </div>

                <div class="dashboard-item-meta">
                  ${formatDate(
                    project.start_date
                  )}
                  →
                  ${formatDate(
                    project.deadline
                  )}
                </div>

              </div>

              <strong>
                ${progress}%
              </strong>

            </div>


            <div
              class="progress-track"
              style="margin-top:8px"
            >

              <div
                class="progress-bar"
                style="width:${progress}%"
              ></div>

            </div>

          </div>
        `;
      }
    ).join("");
}


function renderDashboardAlerts() {

  const container =
    document.getElementById(
      "dashboardAlerts"
    );


  const overdueTasks =
    tasks.filter(
      task =>
        task.status !==
        "completed" &&
        isPastDate(
          task.deadline
        )
    );


  const riskyProjects =
    projects.filter(
      project => {

        if (
          project.status ===
          "completed"
        ) {
          return false;
        }


        const days =
          daysUntil(
            project.deadline
          );


        const progress =
          getProjectProgress(
            project.id
          );


        return (
          days !== null &&
          days <= 2 &&
          progress < 100
        );
      }
    );


  const alerts = [];


  if (overdueTasks.length) {

    alerts.push({
      type: "danger",

      title:
        `${overdueTasks.length} tarea(s) vencida(s)`,

      text:
        "Hay trabajo que necesita atención."
    });
  }


  riskyProjects.forEach(
    project => {

      const days =
        daysUntil(
          project.deadline
        );


      alerts.push({

        type: "normal",

        title:
          `${project.name} necesita atención`,

        text:
          days === 0
            ? "El deadline es hoy."
            : `El deadline es en ${days} día(s).`

      });

    }
  );


  if (!alerts.length) {

    container.innerHTML = `

      <div class="dashboard-alert">

        <span class="alert-dot"></span>

        <div>

          <strong>
            Todo en orden
          </strong>

          <p>
            No hay alertas importantes ahora mismo.
          </p>

        </div>

      </div>
    `;

    return;
  }


  container.innerHTML =
    alerts
      .slice(
        0,
        6
      )
      .map(
        alert => `

          <div class="dashboard-alert">

            <span
              class="alert-dot ${
                alert.type ===
                "danger"
                  ? "danger"
                  : ""
              }"
            ></span>

            <div>

              <strong>
                ${escapeHTML(
                  alert.title
                )}
              </strong>

              <p>
                ${escapeHTML(
                  alert.text
                )}
              </p>

            </div>

          </div>
        `
      )
      .join("");
}


function renderDashboardTasks() {

  const container =
    document.getElementById(
      "dashboardTasks"
    );


  const pending =
    tasks
      .filter(
        task =>
          task.status !==
          "completed"
      )
      .sort(
        (a, b) => {

          const ad =
            dateOnly(
              a.deadline
            )?.getTime() ||
            Infinity;

          const bd =
            dateOnly(
              b.deadline
            )?.getTime() ||
            Infinity;

          return ad - bd;
        }
      )
      .slice(
        0,
        8
      );


  if (!pending.length) {

    container.innerHTML = `
      <p class="empty-text">
        No hay tareas pendientes.
      </p>
    `;

    return;
  }


  container.innerHTML =
    pending.map(
      task => {

        const project =
          projects.find(
            item =>
              item.id ===
              task.project_id
          );


        return `

          <div class="dashboard-item">

            <div class="card-top">

              <div>

                <div class="dashboard-item-title">

                  ${escapeHTML(
                    task.title
                  )}

                </div>

                <div class="dashboard-item-meta">

                  ${
                    project
                      ? escapeHTML(
                          project.name
                        )
                      : "Tarea general"
                  }

                  ·

                  ${formatDate(
                    task.deadline
                  )}

                </div>

              </div>


              <span class="badge ${escapeHTML(task.priority)}">

                ${escapeHTML(
                  PRIORITY_LABELS[
                    task.priority
                  ] ||
                  task.priority
                )}

              </span>

            </div>

          </div>
        `;
      }
    ).join("");
}


// =====================================================
// MODAL
// =====================================================

function openModal() {

  modal.classList.remove(
    "hidden"
  );
}


function closeModalWindow() {

  modal.classList.add(
    "hidden"
  );

  editingProject =
    null;

  editingTask =
    null;

  activeModalMode =
    null;
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

    if (
      event.target ===
      modal
    ) {

      closeModalWindow();

    }

  }
);


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
// ESCAPE
// =====================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key !==
      "Escape"
    ) {
      return;
    }


    if (
      !modal.classList.contains(
        "hidden"
      )
    ) {

      closeModalWindow();

    }


    if (
      sidebar.classList.contains(
        "open"
      )
    ) {

      closeSidebar();

    }

  }
);


// =====================================================
// INICIO
// =====================================================

checkSession();
