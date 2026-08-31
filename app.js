document.addEventListener("DOMContentLoaded", () => {
  const loginScreen = document.getElementById("loginScreen");
  const app = document.getElementById("app");
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");

  const sidebar = document.getElementById("sidebar");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");
  const menuToggle = document.getElementById("menuToggle");
  const closeSidebar = document.getElementById("closeSidebar");
  const logoutButton = document.getElementById("logoutButton");

  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const modalEyebrow = document.getElementById("modalEyebrow");
  const modalFields = document.getElementById("modalFields");
  const modalForm = document.getElementById("modalForm");
  const closeModal = document.getElementById("closeModal");
  const cancelModal = document.getElementById("cancelModal");
  const toast = document.getElementById("toast");

  const pageElements = {
    dashboard: document.getElementById("page-dashboard"),
    projects: document.getElementById("page-projects"),
    tasks: document.getElementById("page-tasks"),
    team: document.getElementById("page-team"),
    organization: document.getElementById("page-organization")
  };

  const pageEyebrow = document.getElementById("pageEyebrow");
  const pageTitle = document.getElementById("pageTitle");
  const pageSubtitle = document.getElementById("pageSubtitle");

  const userAvatar = document.getElementById("userAvatar");
  const topAvatar = document.getElementById("topAvatar");
  const sidebarUser = document.getElementById("sidebarUser");
  const sidebarRole = document.getElementById("sidebarRole");
  const topUser = document.getElementById("topUser");
  const welcomeName = document.getElementById("welcomeName");
  const profileImageInput = document.getElementById("profileImageInput");

  const DEFAULT_PROFILE_IMAGE = "./Recursos/Imagenes/perfil-default.png";

  const state = {
    currentPage: "dashboard",
    loggedIn: false,
    currentProfileId: null,
    session: {
      active: false,
      callsCompleted: 0,
      totalCalls: 3
    },
    user: {
      id: "p1",
      name: "Raúl García",
      role: "Productor",
      initials: "RG"
    }
  };

  const profiles = [
    { id: "p1", name: "Raúl García", role: "Productor", initials: "RG", status: "online" },
    { id: "p2", name: "Lucía Ramos", role: "Directora de Producción", initials: "LR", status: "online" },
    { id: "p3", name: "Diego Ortega", role: "Coordinador", initials: "DO", status: "online" }
  ];

  const projects = [
    {
      id: "pr1",
      name: "Cierzo",
      client: "Northlight",
      description: "Producción documental de seguimiento y territorio.",
      status: "active",
      deadline: "2026-09-15",
      startDate: "2026-08-01",
      progress: 72,
      members: ["p1", "p2", "p3"]
    },
    {
      id: "pr2",
      name: "Cuarta pared",
      client: "Aster Studio",
      description: "Proyecto de ficción con rodaje paralelo y edición simultánea.",
      status: "pending",
      deadline: "2026-09-28",
      startDate: "2026-08-15",
      progress: 34,
      members: ["p2", "p3"]
    },
    {
      id: "pr3",
      name: "Marea Alta",
      client: "Lumen Films",
      description: "Serie documental con archivos y revisiones creativas.",
      status: "completed",
      deadline: "2026-08-27",
      startDate: "2026-07-10",
      progress: 100,
      members: ["p1", "p3"]
    }
  ];

  const tasks = [
    {
      id: "t1",
      title: "Revisión de montaje",
      description: "Validar secuencia final del bloque 3 y revisar iluminación.",
      projectId: "pr1",
      status: "in_progress",
      priority: "high",
      deadline: "2026-09-03",
      assignedTo: "p3",
      projectName: "Cierzo"
    },
    {
      id: "t2",
      title: "Confirmar músicos",
      description: "Cerrar la contratación y entregar presupuesto final.",
      projectId: "pr2",
      status: "pending",
      priority: "medium",
      deadline: "2026-09-08",
      assignedTo: "p2",
      projectName: "Cuarta pared"
    },
    {
      id: "t3",
      title: "Enviar carpeta final",
      description: "Compilar archivos entregables para aprobación del cliente.",
      projectId: "pr3",
      status: "completed",
      priority: "low",
      deadline: "2026-08-27",
      assignedTo: "p1",
      projectName: "Marea Alta"
    },
    {
      id: "t4",
      title: "Control de batería",
      description: "Revisión semanal del material y backup.",
      projectId: null,
      status: "pending",
      priority: "medium",
      deadline: "2026-09-12",
      assignedTo: "p2",
      projectName: "Sin proyecto"
    }
  ];

  const recurringTasks = [
    {
      id: "r1",
      title: "Control de llamadas",
      subtitle: "Llamadas de seguimiento y coordinación",
      schedule: "Lun - Vie",
      target: 25,
      actual: 18,
      unit: "llamadas",
      progress: 72,
      status: "active",
      assignedTo: "p3"
    },
    {
      id: "r2",
      title: "Registro de entregables",
      subtitle: "Actualización de archivos y avances",
      schedule: "Miércoles",
      target: 10,
      actual: 10,
      unit: "entregables",
      progress: 100,
      status: "completed",
      assignedTo: "p2"
    }
  ];

  const organizationAreas = [
    {
      id: "a1",
      name: "Producción",
      description: "Planificación, coordinación y ejecución general.",
      responsibilities: [
        {
          id: "ra1",
          name: "Planificación general",
          description: "Control de cronogramas, presupuestos y alcance.",
          primary: "p1",
          backups: ["p2"]
        },
        {
          id: "ra2",
          name: "Coordinación de rodaje",
          description: "Organización del equipo y materiales en el set.",
          primary: "p3",
          backups: ["p2"]
        }
      ]
    },
    {
      id: "a2",
      name: "Postproducción",
      description: "Montaje, edición y entrega final.",
      responsibilities: [
        {
          id: "ra3",
          name: "Edición principal",
          description: "Seguimiento del montaje y revisión de secuencias.",
          primary: "p3",
          backups: ["p1"]
        }
      ]
    }
  ];

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timeoutId);
    showToast.timeoutId = setTimeout(() => {
      toast.classList.remove("show");
    }, 2200);
  }

  function setLoggedInState(value) {
    state.loggedIn = value;

    if (value) {
      loginScreen.classList.add("hidden");
      app.classList.remove("hidden");
    } else {
      loginScreen.classList.remove("hidden");
      app.classList.add("hidden");
      sidebar.classList.remove("open");
      sidebarBackdrop.classList.remove("show");
    }
  }

  function getProfileById(id) {
    return profiles.find((profile) => profile.id === id) || null;
  }

  function getProjectById(id) {
    return projects.find((project) => project.id === id) || null;
  }

  function getProfileImage(profileId) {
    const saved = localStorage.getItem(`orbeProfileImage:${profileId}`);
    return saved || DEFAULT_PROFILE_IMAGE;
  }

  function getInitials(name) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  }

  function formatDate(value) {
    if (!value) return "Sin fecha";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
  }

  function formatShortDate(value) {
    if (!value) return "Sin fecha";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short"
    }).format(date);
  }

  function renderUserHeader() {
    sidebarUser.textContent = state.user.name;
    sidebarRole.textContent = state.user.role;
    topUser.textContent = state.user.name;
    welcomeName.textContent = state.user.name.split(" ")[0];

    const userImage = getProfileImage(state.user.id);

    userAvatar.innerHTML = `<img src="${userImage}" alt="Perfil">`;
    topAvatar.innerHTML = `<img src="${userImage}" alt="Perfil">`;
  }

  function renderPresence() {
    const strip = document.getElementById("presenceStrip");
    strip.innerHTML = "";

    profiles.forEach((profile) => {
      const item = document.createElement("div");
      item.className = "presence-user current";
      item.title = profile.name;
      item.textContent = profile.initials;
      strip.appendChild(item);
    });
  }

  function renderDashboard() {
    document.getElementById("statProjects").textContent = projects.length;
    document.getElementById("statActive").textContent = projects.filter((p) => p.status === "active").length;
    document.getElementById("statPending").textContent = projects.filter((p) => p.status === "pending").length;
    document.getElementById("statCompleted").textContent = projects.filter((p) => p.status === "completed").length;

    const dashboardProjects = document.getElementById("dashboardProjects");
    dashboardProjects.innerHTML = projects.slice(0, 3).map((project) => `
      <div class="dashboard-item">
        <div class="dashboard-item-title">${project.name}</div>
        <div class="dashboard-item-meta">${project.client} · ${project.status === "active" ? "En producción" : project.status === "pending" ? "Pendiente" : "Completado"}</div>
      </div>
    `).join("");

    const dashboardAlerts = document.getElementById("dashboardAlerts");
    dashboardAlerts.innerHTML = [
      {
        type: "warning",
        title: "Revisión de producción",
        text: "Quedan 3 tareas pendientes antes del cierre del proyecto Cierzo."
      },
      {
        type: "danger",
        title: "Entrega próxima",
        text: "Marea Alta necesita aprobación final antes del 27 de agosto."
      }
    ].map((alert) => `
      <div class="dashboard-alert">
        <span class="alert-dot ${alert.type === "danger" ? "danger" : ""}"></span>
        <div>
          <strong>${alert.title}</strong>
          <p>${alert.text}</p>
        </div>
      </div>
    `).join("");

    const dashboardTasks = document.getElementById("dashboardTasks");
    const pendingTasks = tasks.filter((task) => task.status !== "completed").slice(0, 4);

    dashboardTasks.innerHTML = pendingTasks.map((task) => {
      const project = task.projectId ? getProjectById(task.projectId) : null;
      return `
        <div class="dashboard-item">
          <div class="dashboard-item-title">${task.title}</div>
          <div class="dashboard-item-meta">${project ? project.name : task.projectName} · ${task.priority} · ${formatDate(task.deadline)}</div>
        </div>
      `;
    }).join("");
  }

  function renderProjects() {
    const search = document.getElementById("projectSearch").value.trim().toLowerCase();
    const filter = document.getElementById("projectFilter").value;
    const list = document.getElementById("projectsList");

    let filtered = [...projects];

    if (search) {
      filtered = filtered.filter((project) =>
        project.name.toLowerCase().includes(search) ||
        project.client.toLowerCase().includes(search)
      );
    }

    if (filter !== "all") {
      filtered = filtered.filter((project) => project.status === filter);
    }

    if (!filtered.length) {
      list.innerHTML = `
        <div class="panel">
          <h3>No hay proyectos</h3>
          <p>No se encontraron resultados con este filtro.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = filtered.map((project) => {
      const members = project.members.map((id) => getProfileById(id)).filter(Boolean);
      const overdue = project.status !== "completed" && new Date(project.deadline) < new Date();

      return `
        <article class="project-card">
          <div class="card-top">
            <div>
              <h3>${project.name}</h3>
              <span class="project-client">${project.client}</span>
            </div>
            <span class="badge ${project.status}">${project.status === "active" ? "En producción" : project.status === "pending" ? "Pendiente" : "Completado"}</span>
          </div>

          <p class="card-description">${project.description}</p>

          <div class="progress-wrap">
            <div class="progress-label">
              <span>Progreso</span>
              <strong>${project.progress}%</strong>
            </div>
            <div class="progress-track">
              <div class="progress-bar" style="width:${project.progress}%"></div>
            </div>
          </div>

          ${overdue ? `<div class="project-warning">Entrega vencida</div>` : `<div class="project-ok">En plazo</div>`}

          <div class="project-dates">
            <span>Inicio: ${formatShortDate(project.startDate)}</span>
            <span>Entrega: ${formatShortDate(project.deadline)}</span>
          </div>

          <div class="card-footer">
            <div class="assigned-members">
              ${members.length ? members.map((member) => `<span class="member-chip">${member.initials}</span>`).join("") : '<span class="no-members">Sin miembros</span>'}
            </div>

            <div class="card-actions">
              <button class="edit-button" type="button" data-project-action="view" data-project-id="${project.id}">Ver</button>
            </div>
          </div>
        </article>
      `;
    }).join("");

    document.querySelectorAll("[data-project-action='view']").forEach((button) => {
      button.addEventListener("click", () => {
        const projectId = button.dataset.projectId;
        openProjectDetail(projectId);
      });
    });
  }

  function openProjectDetail(projectId) {
    const project = getProjectById(projectId);
    if (!project) return;

    const container = document.getElementById("projectDetail");
    const content = document.getElementById("projectDetailContent");

    const members = project.members.map((id) => getProfileById(id)).filter(Boolean);

    container.classList.remove("hidden");

    content.innerHTML = `
      <div class="project-detail-header">
        <div class="project-detail-title-row">
          <div class="project-detail-title">
            <p class="eyebrow">PROYECTO</p>
            <h1>${project.name}</h1>
            <p>${project.client}</p>
          </div>
          <span class="badge ${project.status}">${project.status === "active" ? "En producción" : project.status === "pending" ? "Pendiente" : "Completado"}</span>
        </div>

        <p class="project-detail-description">${project.description}</p>

        <div class="project-detail-meta">
          <div class="project-meta-box">
            <span>Inicio</span>
            <strong>${formatDate(project.startDate)}</strong>
          </div>
          <div class="project-meta-box">
            <span>Entrega</span>
            <strong>${formatDate(project.deadline)}</strong>
          </div>
          <div class="project-meta-box">
            <span>Equipo</span>
            <strong>${members.length} integrantes</strong>
          </div>
        </div>

        <div class="project-detail-progress">
          <div class="progress-wrap">
            <div class="progress-label">
              <span>Progreso</span>
              <strong>${project.progress}%</strong>
            </div>
            <div class="progress-track">
              <div class="progress-bar" style="width:${project.progress}%"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="project-detail-sections">
        <div class="timeline-card">
          <p class="eyebrow">CRONOGRAMA</p>
          <div class="timeline">
            ${[
              { label: "Preproducción", value: 35, text: "Secured" },
              { label: "Rodaje", value: 80, text: "En marcha" },
              { label: "Post", value: 55, text: "Ajustes" }
            ].map((item) => `
              <div class="timeline-row">
                <div class="timeline-label">
                  <strong>${item.label}</strong>
                  <span>${item.text}</span>
                </div>
                <div class="timeline-bar-area">
                  <div class="timeline-bar" style="width:${item.value}%"></div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="timeline-card">
          <p class="eyebrow">EQUIPO</p>
          <div class="assigned-members">
            ${members.length ? members.map((member) => `<span class="member-chip">${member.name}</span>`).join("") : '<span class="no-members">Sin miembros</span>'}
          </div>
        </div>
      </div>
    `;

    document.getElementById("projectDetailBack").addEventListener("click", () => {
      container.classList.add("hidden");
    });
  }

  function renderTasks() {
    const search = document.getElementById("taskSearch").value.trim().toLowerCase();
    const statusFilter = document.getElementById("taskStatusFilter").value;
    const priorityFilter = document.getElementById("taskPriorityFilter").value;
    const projectFilter = document.getElementById("taskProjectFilter").value;

    const filtered = tasks.filter((task) => {
      const termMatch =
        !search ||
        task.title.toLowerCase().includes(search) ||
        task.description.toLowerCase().includes(search);

      const statusMatch = statusFilter === "all" || task.status === statusFilter;
      const priorityMatch = priorityFilter === "all" || task.priority === priorityFilter;
      const projectMatch =
        projectFilter === "all" ||
        (projectFilter === "none" && !task.projectId) ||
        task.projectId === projectFilter;

      return termMatch && statusMatch && priorityMatch && projectMatch;
    });

    const columns = {
      pending: filtered.filter((task) => task.status === "pending"),
      in_progress: filtered.filter((task) => task.status === "in_progress"),
      completed: filtered.filter((task) => task.status === "completed")
    };

    document.getElementById("pendingCount").textContent = columns.pending.length;
    document.getElementById("progressCount").textContent = columns.in_progress.length;
    document.getElementById("completedCount").textContent = columns.completed.length;

    const renderColumn = (items, containerId) => {
      const container = document.getElementById(containerId);

      if (!items.length) {
        container.innerHTML = `<div class="panel"><p>No hay tareas aquí.</p></div>`;
        return;
      }

      container.innerHTML = items.map((task) => {
        const assigned = getProfileById(task.assignedTo);
        const project = task.projectId ? getProjectById(task.projectId) : null;
        const overdue = task.status !== "completed" && new Date(task.deadline) < new Date();

        return `
          <div class="task-row">
            <div style="display:flex; justify-content:space-between; gap:8px; align-items:center;">
              <span class="badge ${task.priority}">${task.priority === "high" ? "Alta" : task.priority === "low" ? "Baja" : "Media"}</span>
              <span class="task-project-label">${project ? project.name : "General"}</span>
            </div>

            <div class="task-title">${task.title}</div>
            <div class="task-description">${task.description}</div>

            <div class="task-meta">
              ${assigned ? assigned.name : "Sin asignado"} · ${formatDate(task.deadline)}
            </div>

            ${overdue ? `<div class="task-overdue">Vence hoy o ya venció</div>` : ""}
          </div>
        `;
      }).join("");
    };

    renderColumn(columns.pending, "tasksPending");
    renderColumn(columns.in_progress, "tasksProgress");
    renderColumn(columns.completed, "tasksCompleted");
  }

  function renderRecurringTasks() {
    const list = document.getElementById("recurringTasksList");

    list.innerHTML = recurringTasks.map((task) => {
      const assigned = getProfileById(task.assignedTo);

      return `
        <div class="smart-task-card">
          <div class="smart-task-card-top">
            <div>
              <div class="badge smart">SMART</div>
              <div class="smart-task-card-title">${task.title}</div>
              <div class="smart-task-card-subtitle">${task.subtitle}</div>
            </div>

            <span class="badge ${task.status === "active" ? "active" : "completed"}">
              ${task.status === "active" ? "Activo" : "Completado"}
            </span>
          </div>

          <div class="smart-task-details">
            <span class="smart-task-detail">${task.schedule}</span>
            <span class="smart-task-detail">${task.actual}/${task.target} ${task.unit}</span>
            <span class="smart-task-detail">${assigned ? assigned.name : "Sin asignado"}</span>
          </div>

          <div class="smart-task-progress">
            <div class="smart-task-progress-label">
              <span>Progreso</span>
              <strong>${task.progress}%</strong>
            </div>
            <div class="progress-track">
              <div class="progress-bar" style="width:${task.progress}%"></div>
            </div>
          </div>

          <div class="smart-task-actions">
            <button class="smart-task-action primary" type="button">Registrar</button>
            <button class="smart-task-action" type="button">Editar</button>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderTeam() {
    const list = document.getElementById("teamList");

    list.innerHTML = profiles.map((profile) => {
      const image = getProfileImage(profile.id);

      return `
        <button class="team-card" data-profile-id="${profile.id}" type="button">
          <div class="avatar">
            <img src="${image}" alt="${profile.name}" />
          </div>
          <div>
            <h3>${profile.name}</h3>
            <p>${profile.role}</p>
          </div>
        </button>
      `;
    }).join("");

    list.querySelectorAll("[data-profile-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const profileId = button.dataset.profileId;
        openProfileView(profileId);
      });
    });
  }

  function openProfileView(profileId) {
    const profile = getProfileById(profileId);
    if (!profile) return;

    state.currentProfileId = profileId;

    const overview = document.getElementById("teamOverview");
    const profileView = document.getElementById("teamProfileView");
    const content = document.getElementById("teamProfileContent");

    overview.classList.add("hidden");
    profileView.classList.remove("hidden");

    const profileProjects = projects.filter((project) => project.members.includes(profile.id));
    const profileTasks = tasks.filter((task) => task.assignedTo === profile.id);
    const image = getProfileImage(profile.id);

    content.innerHTML = `
      <div class="team-profile-card">
        <div class="profile-hero">
          <div class="avatar">
            <img src="${image}" alt="${profile.name}" />
          </div>
          <div>
            <p class="eyebrow">PERSONA</p>
            <h1>${profile.name}</h1>
            <p>${profile.role}</p>
          </div>
        </div>

        <div class="profile-stats">
          <div class="stat">
            <span>Proyectos</span>
            <strong>${profileProjects.length}</strong>
          </div>
          <div class="stat">
            <span>Tareas</span>
            <strong>${profileTasks.length}</strong>
          </div>
          <div class="stat">
            <span>Estado</span>
            <strong>${profile.status === "online" ? "Online" : "Away"}</strong>
          </div>
        </div>

        <div class="profile-upload">
          <label for="teamProfilePicker" class="button button-light">Elegir foto</label>
          <input id="teamProfilePicker" type="file" accept="image/*" />
        </div>

        <div class="profile-section">
          <div class="profile-section-header">
            <h3>Proyectos</h3>
          </div>
          <div class="member-project-list">
            ${profileProjects.length ? profileProjects.map((project) => `
              <div class="member-project-item">
                <strong>${project.name}</strong>
              </div>
            `).join("") : '<div class="profile-empty">Sin proyectos asignados</div>'}
          </div>
        </div>

        <div class="profile-section">
          <div class="profile-section-header">
            <h3>Tareas</h3>
          </div>
          <div class="member-task-list">
            ${profileTasks.length ? profileTasks.map((task) => `
              <div class="member-task-item">
                <strong>${task.title}</strong>
                <p>${task.status === "completed" ? "Completada" : task.status === "in_progress" ? "En progreso" : "Pendiente"}</p>
              </div>
            `).join("") : '<div class="profile-empty">Sin tareas asignadas</div>'}
          </div>
        </div>
      </div>
    `;

    document.getElementById("teamBackButton").addEventListener("click", () => {
      overview.classList.remove("hidden");
      profileView.classList.add("hidden");
    });

    const fileInput = document.getElementById("teamProfilePicker");
    fileInput.addEventListener("change", handleProfileImageUpload);
  }

  function handleProfileImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const profileId = state.currentProfileId || state.user.id;

      localStorage.setItem(`orbeProfileImage:${profileId}`, dataUrl);

      renderTeam();
      if (profileId === state.user.id) {
        renderUserHeader();
      }

      showToast("Foto guardada");
    };
    reader.readAsDataURL(file);
  }

  function renderOrganization() {
    const container = document.getElementById("organizationChart");

    container.innerHTML = organizationAreas.map((area) => `
      <div class="organization-area">
        <div class="organization-area-header">
          <div>
            <div class="organization-area-title">${area.name}</div>
            <div class="organization-area-description">${area.description}</div>
          </div>
        </div>

        <div class="organization-area-body">
          ${area.responsibilities.map((resp) => {
            const primary = getProfileById(resp.primary);
            const backups = (resp.backups || []).map((id) => getProfileById(id)).filter(Boolean);

            return `
              <div class="responsibility-card">
                <div>
                  <div class="responsibility-name">${resp.name}</div>
                  <div class="responsibility-description">${resp.description}</div>
                </div>

                <div class="responsibility-people">
                  ${primary ? `
                    <div class="responsibility-person primary">
                      <span>${primary.initials}</span>
                      <span>${primary.name}</span>
                      <span class="responsibility-role">Primario</span>
                    </div>
                  ` : ""}

                  ${backups.map((person) => `
                    <div class="responsibility-person">
                      <span>${person.initials}</span>
                      <span>${person.name}</span>
                      <span class="responsibility-role">Backup</span>
                    </div>
                  `).join("")}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `).join("");
  }

  function showPage(page) {
    state.currentPage = page;

    Object.entries(pageElements).forEach(([key, element]) => {
      element.classList.toggle("hidden", key !== page);
    });

    const pageConfig = {
      dashboard: ["ORBE WORKSPACE", "Dashboard", "Resumen de producción"],
      projects: ["PRODUCCIÓN", "Proyectos", "Producciones completas de Orbe."],
      tasks: ["PRODUCCIÓN", "Tareas", "Todo lo que hay que hacer."],
      team: ["ORBE", "Equipo", "Las personas detrás de cada producción."],
      organization: ["ORBE", "Organización", "Áreas, responsabilidades y personas encargadas."]
    };

    const [eyebrow, title, subtitle] = pageConfig[page];
    pageEyebrow.textContent = eyebrow;
    pageTitle.textContent = title;
    pageSubtitle.textContent = subtitle;

    document.querySelectorAll(".nav-item").forEach((button) => {
      button.classList.toggle("active", button.dataset.page === page);
    });

    if (page === "dashboard") renderDashboard();
    if (page === "projects") renderProjects();
    if (page === "tasks") renderTasks();
    if (page === "team") renderTeam();
    if (page === "organization") renderOrganization();

    if (window.innerWidth <= 880) {
      sidebar.classList.remove("open");
      sidebarBackdrop.classList.remove("show");
    }
  }

  function openModal(type) {
    modal.dataset.type = type;
    modal.classList.remove("hidden");

    if (type === "project") {
      modalTitle.textContent = "Nuevo proyecto";
      modalEyebrow.textContent = "PROYECTO";
      modalFields.innerHTML = `
        <div class="modal-field">
          <label>Nombre</label>
          <input name="name" type="text" required />
        </div>
        <div class="modal-field">
          <label>Cliente</label>
          <input name="client" type="text" required />
        </div>
        <div class="modal-field">
          <label>Descripción</label>
          <textarea name="description"></textarea>
        </div>
        <div class="modal-field">
          <label>Estado</label>
          <select name="status">
            <option value="pending">Pendiente</option>
            <option value="active">En producción</option>
            <option value="completed">Completado</option>
          </select>
        </div>
        <div class="modal-field">
          <label>Fecha de inicio</label>
          <input name="startDate" type="date" />
        </div>
        <div class="modal-field">
          <label>Fecha de entrega</label>
          <input name="deadline" type="date" />
        </div>
      `;
    }

    if (type === "task") {
      modalTitle.textContent = "Nueva tarea";
      modalEyebrow.textContent = "TAREA";
      modalFields.innerHTML = `
        <div class="modal-field">
          <label>Título</label>
          <input name="title" type="text" required />
        </div>
        <div class="modal-field">
          <label>Descripción</label>
          <textarea name="description"></textarea>
        </div>
        <div class="modal-field">
          <label>Proyecto</label>
          <select name="projectId">
            <option value="">Sin proyecto</option>
            ${projects.map((project) => `<option value="${project.id}">${project.name}</option>`).join("")}
          </select>
        </div>
        <div class="modal-field">
          <label>Asignado</label>
          <select name="assignedTo">
            <option value="">Sin asignado</option>
            ${profiles.map((profile) => `<option value="${profile.id}">${profile.name}</option>`).join("")}
          </select>
        </div>
        <div class="modal-field">
          <label>Prioridad</label>
          <select name="priority">
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="low">Baja</option>
          </select>
        </div>
        <div class="modal-field">
          <label>Estado</label>
          <select name="status">
            <option value="pending">Pendiente</option>
            <option value="in_progress">En progreso</option>
            <option value="completed">Completada</option>
          </select>
        </div>
        <div class="modal-field">
          <label>Fecha límite</label>
          <input name="deadline" type="date" />
        </div>
      `;
    }

    if (type === "recurringTask") {
      modalTitle.textContent = "Nueva tarea inteligente";
      modalEyebrow.textContent = "SMART";
      modalFields.innerHTML = `
        <div class="modal-field">
          <label>Título</label>
          <input name="title" type="text" required />
        </div>
        <div class="modal-field">
          <label>Descripción</label>
          <textarea name="description"></textarea>
        </div>
        <div class="modal-field">
          <label>Asignado</label>
          <select name="assignedTo">
            ${profiles.map((profile) => `<option value="${profile.id}">${profile.name}</option>`).join("")}
          </select>
        </div>
        <div class="modal-field">
          <label>Objetivo</label>
          <input name="target" type="number" value="10" min="1" />
        </div>
        <div class="modal-field">
          <label>Unidad</label>
          <input name="unit" type="text" value="llamadas" />
        </div>
        <div class="modal-field">
          <label>Frecuencia</label>
          <input name="schedule" type="text" value="Lun - Vie" />
        </div>
      `;
    }
  }

  function closeModalDialog() {
    modal.classList.add("hidden");
    modalFields.innerHTML = "";
  }

  modalForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(modalForm);
    const entries = Object.fromEntries(formData.entries());
    const type = modal.dataset.type;

    if (type === "project") {
      const newProject = {
        id: `pr${Date.now()}`,
        name: entries.name,
        client: entries.client,
        description: entries.description || "Sin descripción",
        status: entries.status || "pending",
        startDate: entries.startDate || new Date().toISOString().slice(0, 10),
        deadline: entries.deadline || new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
        progress: 0,
        members: [state.user.id]
      };

      projects.unshift(newProject);
      closeModalDialog();
      showToast("Proyecto creado");
      showPage("projects");
    }

    if (type === "task") {
      const newTask = {
        id: `t${Date.now()}`,
        title: entries.title,
        description: entries.description || "Sin descripción",
        projectId: entries.projectId || null,
        status: entries.status || "pending",
        priority: entries.priority || "medium",
        deadline: entries.deadline || new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
        assignedTo: entries.assignedTo || null,
        projectName: entries.projectId ? getProjectById(entries.projectId)?.name || "Sin proyecto" : "Sin proyecto"
      };

      tasks.unshift(newTask);
      closeModalDialog();
      showToast("Tarea creada");
      showPage("tasks");
    }

    if (type === "recurringTask") {
      recurringTasks.unshift({
        id: `r${Date.now()}`,
        title: entries.title,
        subtitle: entries.description || "Tarea inteligente",
        schedule: entries.schedule || "Lun - Vie",
        target: Number(entries.target || 10),
        actual: 0,
        unit: entries.unit || "llamadas",
        progress: 0,
        status: "active",
        assignedTo: entries.assignedTo || "p3"
      });

      closeModalDialog();
      renderRecurringTasks();
      showToast("Tarea inteligente creada");
    }
  });

  document.getElementById("newProjectButton").addEventListener("click", () => openModal("project"));
  document.getElementById("newTaskButton").addEventListener("click", () => openModal("task"));
  document.getElementById("newRecurringTaskButton").addEventListener("click", () => openModal("recurringTask"));

  document.getElementById("projectSearch").addEventListener("input", renderProjects);
  document.getElementById("projectFilter").addEventListener("change", renderProjects);

  document.getElementById("taskSearch").addEventListener("input", renderTasks);
  document.getElementById("taskStatusFilter").addEventListener("change", renderTasks);
  document.getElementById("taskPriorityFilter").addEventListener("change", renderTasks);
  document.getElementById("taskProjectFilter").addEventListener("change", renderTasks);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModalDialog();
  });

  closeModal.addEventListener("click", closeModalDialog);
  cancelModal.addEventListener("click", closeModalDialog);

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

  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    sidebarBackdrop.classList.toggle("show");
  });

  closeSidebar.addEventListener("click", () => {
    sidebar.classList.remove("open");
    sidebarBackdrop.classList.remove("show");
  });

  sidebarBackdrop.addEventListener("click", () => {
    sidebar.classList.remove("open");
    sidebarBackdrop.classList.remove("show");
  });

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
      loginError.textContent = "Introduce correo y contraseña.";
      return;
    }

    state.user = { ...state.user, name: "Raúl García", role: "Productor" };
    loginError.textContent = "";
    setLoggedInState(true);
    renderUserHeader();
    renderPresence();
    showPage("dashboard");
    showToast("Sesión iniciada");
  });

  logoutButton.addEventListener("click", () => {
    setLoggedInState(false);
    document.getElementById("loginEmail").value = "";
    document.getElementById("loginPassword").value = "";
    loginError.textContent = "";
    showToast("Sesión cerrada");
  });

  profileImageInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      localStorage.setItem(`orbeProfileImage:${state.user.id}`, dataUrl);
      renderUserHeader();
      showToast("Foto de perfil guardada");
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("startCallSessionButton").addEventListener("click", () => {
    state.session.active = true;
    document.getElementById("callSessionStatus").textContent = "Sesión iniciada";
    document.getElementById("startCallSessionButton").classList.add("hidden");
    document.getElementById("endCallSessionButton").classList.remove("hidden");
    document.getElementById("registerCallButton").classList.remove("hidden");
  });

  document.getElementById("endCallSessionButton").addEventListener("click", () => {
    state.session.active = false;
    document.getElementById("callSessionStatus").textContent = "Sesión finalizada";
    document.getElementById("startCallSessionButton").classList.remove("hidden");
    document.getElementById("endCallSessionButton").classList.add("hidden");
  });

  document.getElementById("registerCallButton").addEventListener("click", () => {
    if (!state.session.active) return;

    state.session.callsCompleted += 1;
    const total = state.session.totalCalls;
    const percent = Math.min(100, Math.round((state.session.callsCompleted / total) * 100));

    document.getElementById("callProgressLabel").textContent = `${state.session.callsCompleted} / ${total}`;
    document.getElementById("callProgressPercent").textContent = `${percent}%`;
    document.getElementById("callProgressBar").style.width = `${percent}%`;

    showToast("Llamada registrada");
  });

  function init() {
    renderUserHeader();
    renderPresence();
    renderDashboard();
    renderProjects();
    renderTasks();
    renderRecurringTasks();
    renderTeam();
    renderOrganization();

    setLoggedInState(false);
    showPage("dashboard");
  }

  init();
});
