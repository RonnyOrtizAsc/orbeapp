const appState = {
  currentPage: "overview",
  user: {
    id: "u1",
    name: "Raúl García",
    role: "Productor"
  },
  profiles: [
    { id: "u1", name: "Raúl García", role: "Productor" },
    { id: "u2", name: "Lucía Ramos", role: "Directora de Producción" },
    { id: "u3", name: "Diego Ortega", role: "Coordinador" }
  ],
  projects: [
    { id: "p1", name: "Cierzo", client: "Northlight", status: "active", progress: 72, description: "Documentary production." },
    { id: "p2", name: "Cuarta Pared", client: "Aster Studio", status: "pending", progress: 34, description: "Fiction production with parallel edits." },
    { id: "p3", name: "Marea Alta", client: "Lumen Films", status: "completed", progress: 100, description: "Series and archive review process." }
  ],
  tasks: [
    { id: "t1", title: "Review final cut", description: "Check final sequence and lighting notes.", status: "in_progress", priority: "high" },
    { id: "t2", title: "Confirm musicians", description: "Finalize contract and send budget.", status: "pending", priority: "medium" },
    { id: "t3", title: "Send final folder", description: "Prepare deliverables for client approval.", status: "completed", priority: "low" }
  ],
  areas: [
    {
      name: "Production",
      description: "Planning and delivery",
      members: [
        { name: "Raúl García", role: "Primary" },
        { name: "Lucía Ramos", role: "Backup" }
      ]
    },
    {
      name: "Postproduction",
      description: "Editing and final assembly",
      members: [
        { name: "Diego Ortega", role: "Primary" }
      ]
    }
  ]
};

const DEFAULT_IMAGE = "./Recursos/Imagenes/perfil-default.png";

function getUserImage(profileId) {
  const saved = localStorage.getItem(`orbeProfileImage:${profileId}`);
  return saved || DEFAULT_IMAGE;
}

function renderHeader() {
  const name = appState.user.name;
  const role = appState.user.role;

  document.getElementById("currentUserName").textContent = name;
  document.getElementById("currentUserRole").textContent = role;
  document.getElementById("headerUserName").textContent = name;

  const avatar = getUserImage(appState.user.id);
  document.getElementById("currentUserAvatar").src = avatar;
  document.getElementById("headerUserAvatar").src = avatar;
}

function renderOverview() {
  document.getElementById("projectCount").textContent = appState.projects.length;
  document.getElementById("activeCount").textContent = appState.projects.filter(p => p.status === "active").length;
  document.getElementById("pendingCount").textContent = appState.projects.filter(p => p.status === "pending").length;
  document.getElementById("doneCount").textContent = appState.projects.filter(p => p.status === "completed").length;

  const recentProjects = document.getElementById("recentProjects");
  recentProjects.innerHTML = `
    <div class="card-list">
      ${appState.projects.slice(0, 3).map(project => `
        <div class="list-item">
          <strong>${project.name}</strong>
          <small>${project.client} · ${project.status}</small>
        </div>
      `).join("")}
    </div>
  `;

  const alerts = document.getElementById("alertsList");
  alerts.innerHTML = `
    <div class="card-list">
      <div class="list-item">
        <strong>Review cycle</strong>
        <small>3 pending tasks before final delivery.</small>
      </div>
      <div class="list-item">
        <strong>Delivery close</strong>
        <small>Marea Alta requires approval before next week.</small>
      </div>
    </div>
  `;
}

function renderProjects() {
  const filter = document.getElementById("projectFilter").value;
  const search = document.getElementById("projectSearch").value.trim().toLowerCase();

  let data = [...appState.projects];

  if (filter !== "all") {
    data = data.filter(item => item.status === filter);
  }

  if (search) {
    data = data.filter(item =>
      item.name.toLowerCase().includes(search) ||
      item.client.toLowerCase().includes(search)
    );
  }

  const projectList = document.getElementById("projectList");
  projectList.innerHTML = data.map(project => `
    <article class="project-card">
      <div class="project-header">
        <div>
          <h3>${project.name}</h3>
          <small>${project.client}</small>
        </div>
        <span class="badge ${project.status}">${project.status}</span>
      </div>
      <p>${project.description}</p>
      <div class="progress"><span style="width:${project.progress}%"></span></div>
      <div><small>${project.progress}% completed</small></div>
    </article>
  `).join("");
}

function renderTasks() {
  const search = document.getElementById("taskSearch").value.trim().toLowerCase();
  const status = document.getElementById("taskStatusFilter").value;

  const tasks = appState.tasks.filter(task => {
    const matchesSearch =
      !search ||
      task.title.toLowerCase().includes(search) ||
      task.description.toLowerCase().includes(search);

    const matchesStatus = status === "all" || task.status === status;
    return matchesSearch && matchesStatus;
  });

  const columns = {
    pending: tasks.filter(t => t.status === "pending"),
    in_progress: tasks.filter(t => t.status === "in_progress"),
    completed: tasks.filter(t => t.status === "completed")
  };

  const board = document.getElementById("taskBoard");
  board.innerHTML = `
    <div class="column">
      <h4>Pending</h4>
      ${columns.pending.map(task => `
        <div class="task-card">
          <h5>${task.title}</h5>
          <p>${task.description}</p>
          <small>${task.priority}</small>
        </div>
      `).join("") || "<small>No tasks</small>"}
    </div>

    <div class="column">
      <h4>In progress</h4>
      ${columns.in_progress.map(task => `
        <div class="task-card">
          <h5>${task.title}</h5>
          <p>${task.description}</p>
          <small>${task.priority}</small>
        </div>
      `).join("") || "<small>No tasks</small>"}
    </div>

    <div class="column">
      <h4>Completed</h4>
      ${columns.completed.map(task => `
        <div class="task-card">
          <h5>${task.title}</h5>
          <p>${task.description}</p>
          <small>${task.priority}</small>
        </div>
      `).join("") || "<small>No tasks</small>"}
    </div>
  `;
}

function renderTeam() {
  const teamGrid = document.getElementById("teamGrid");
  teamGrid.innerHTML = appState.profiles.map(profile => `
    <div class="team-card">
      <div class="team-avatar">
        <img src="${getUserImage(profile.id)}" alt="${profile.name}" />
      </div>
      <div>
        <strong>${profile.name}</strong>
        <div>${profile.role}</div>
      </div>
    </div>
  `).join("");
}

function renderAreas() {
  const areaList = document.getElementById("areaList");
  areaList.innerHTML = appState.areas.map(area => `
    <div class="area-card">
      <h3>${area.name}</h3>
      <p>${area.description}</p>
      <div class="card-list">
        ${area.members.map(member => `
          <div class="list-item">
            <strong>${member.name}</strong>
            <small>${member.role}</small>
          </div>
        `).join("")}
      </div>
    </div>
  `).join("");
}

function setPage(page) {
  appState.currentPage = page;

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.target === page);
  });

  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle("hidden", section.id !== page);
    section.classList.toggle("visible", section.id === page);
  });

  document.getElementById("pageTitle").textContent =
    page.charAt(0).toUpperCase() + page.slice(1);

  if (page === "overview") renderOverview();
  if (page === "projects") renderProjects();
  if (page === "tasks") renderTasks();
  if (page === "people") renderTeam();
  if (page === "areas") renderAreas();
}

document.querySelectorAll(".nav-btn").forEach(button => {
  button.addEventListener("click", () => setPage(button.dataset.target));
});

document.getElementById("projectSearch").addEventListener("input", renderProjects);
document.getElementById("projectFilter").addEventListener("change", renderProjects);
document.getElementById("taskSearch").addEventListener("input", renderTasks);
document.getElementById("taskStatusFilter").addEventListener("change", renderTasks);

document.getElementById("userImageUpload").addEventListener("change", function (event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const dataUrl = e.target.result;
    localStorage.setItem(`orbeProfileImage:${appState.user.id}`, dataUrl);
    renderHeader();
    renderTeam();
  };
  reader.readAsDataURL(file);
});

renderHeader();
renderOverview();
renderProjects();
renderTasks();
renderTeam();
renderAreas();
setPage("overview");
