// =====================================================
// SUPABASE
// =====================================================

const SUPABASE_URL =
    "https://ijnetiyxrxxfhurlsnbc.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_dnjsWgsrPMUQov5JTJuthw_KEAqjMfK";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// =====================================================
// ELEMENTOS
// =====================================================

const loginScreen =
    document.getElementById("login-screen");

const appScreen =
    document.getElementById("app-screen");

const loginForm =
    document.getElementById("login-form");

const loginMessage =
    document.getElementById("login-message");

const userInfo =
    document.getElementById("user-info");

const logoutButton =
    document.getElementById("logout-button");

const projectsContainer =
    document.getElementById("projects-container");

const tasksContainer =
    document.getElementById("tasks-container");

const newProjectButton =
    document.getElementById("new-project-button");

const newTaskButton =
    document.getElementById("new-task-button");

const modal =
    document.getElementById("modal");

const modalTitle =
    document.getElementById("modal-title");

const modalFields =
    document.getElementById("modal-fields");

const modalForm =
    document.getElementById("modal-form");

const closeModal =
    document.getElementById("close-modal");


// =====================================================
// VARIABLES
// =====================================================

let currentUser = null;
let currentProfile = null;

let editingProject = null;
let editingTask = null;


// =====================================================
// MOSTRAR LOGIN
// =====================================================

function showLogin() {

    appScreen.classList.add("hidden");

    loginScreen.classList.remove("hidden");

    document.body.classList.remove("is-admin");

}


// =====================================================
// MOSTRAR APP
// =====================================================

function showApp() {

    loginScreen.classList.add("hidden");

    appScreen.classList.remove("hidden");

}


// =====================================================
// LOGIN
// =====================================================

loginForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        loginMessage.textContent =
            "Iniciando sesión...";


        const email =
            document.getElementById("email").value;

        const password =
            document.getElementById("password").value;


        const { error } =
            await supabaseClient.auth.signInWithPassword({

                email: email,

                password: password

            });


        if (error) {

            console.error(error);

            loginMessage.textContent =
                "Correo o contraseña incorrectos.";

            return;

        }


        loginMessage.textContent = "";

    }
);


// =====================================================
// LOGOUT
// =====================================================

logoutButton.addEventListener(
    "click",
    async function() {

        await supabaseClient.auth.signOut();

        showLogin();

    }
);


// =====================================================
// COMPROBAR SESIÓN
// =====================================================

async function checkSession() {

    const {
        data: {
            session
        }
    } =
        await supabaseClient.auth.getSession();


    if (session) {

        await loadUser(session.user);

    } else {

        showLogin();

    }

}


// =====================================================
// CAMBIOS DE SESIÓN
// =====================================================

supabaseClient.auth.onAuthStateChange(
    async function(event, session) {

        if (session) {

            await loadUser(session.user);

        } else {

            showLogin();

        }

    }
);


// =====================================================
// CARGAR USUARIO
// =====================================================

async function loadUser(user) {

    currentUser = user;


    const {
        data: profile,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();


    if (error) {

        console.error(
            "Error obteniendo perfil:",
            error
        );

        return;

    }


    currentProfile = profile;


    showApp();


    userInfo.textContent =
        `${profile.name} · ${profile.role}`;


    if (profile.role === "admin") {

        document.body.classList.add("is-admin");

    } else {

        document.body.classList.remove("is-admin");

    }


    await loadProjects();

    await loadTasks();

}


// =====================================================
// CARGAR PROYECTOS
// =====================================================

async function loadProjects() {

    projectsContainer.innerHTML =
        "<p>Cargando proyectos...</p>";


    const {
        data,
        error
    } =
        await supabaseClient
            .from("projects")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Error cargando proyectos:",
            error
        );

        projectsContainer.innerHTML =
            "<p>Error cargando proyectos.</p>";

        return;

    }


    if (!data || data.length === 0) {

        projectsContainer.innerHTML =
            "<p>No hay proyectos todavía.</p>";

        return;

    }


    projectsContainer.innerHTML =
        data.map(project => {

            return `

                <div class="item">

                    <h3>
                        ${escapeHTML(project.name)}
                    </h3>

                    <p>
                        Cliente:
                        ${escapeHTML(project.client)}
                    </p>

                    <p>
                        Estado:
                        ${escapeHTML(project.status)}
                    </p>

                    ${
                        project.description
                        ? `
                            <p>
                                ${escapeHTML(
                                    project.description
                                )}
                            </p>
                          `
                        : ""
                    }

                    ${
                        project.deadline
                        ? `
                            <span class="badge">
                                Fecha:
                                ${escapeHTML(
                                    project.deadline
                                )}
                            </span>
                          `
                        : ""
                    }


                    ${
                        currentProfile &&
                        currentProfile.role === "admin"

                        ?

                        `

                        <div class="item-actions">

                            <button
                                class="edit-button"
                                onclick="editProject('${project.id}')"
                            >
                                Editar
                            </button>

                            <button
                                class="delete-button"
                                onclick="deleteProject('${project.id}')"
                            >
                                Eliminar
                            </button>

                        </div>

                        `

                        :

                        ""

                    }

                </div>

            `;

        }).join("");

}


// =====================================================
// NUEVO PROYECTO
// =====================================================

newProjectButton.addEventListener(
    "click",
    function() {

        editingProject = null;

        modalTitle.textContent =
            "Nuevo proyecto";


        modalFields.innerHTML = `

            <div class="field">

                <label>Nombre</label>

                <input
                    id="project-name"
                    required
                >

            </div>


            <div class="field">

                <label>Cliente</label>

                <input
                    id="project-client"
                    required
                >

            </div>


            <div class="field">

                <label>Descripción</label>

                <textarea
                    id="project-description"
                ></textarea>

            </div>


            <div class="field">

                <label>Estado</label>

                <select id="project-status">

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


            <div class="field">

                <label>Fecha límite</label>

                <input
                    type="date"
                    id="project-deadline"
                >

            </div>

        `;


        openModal();

    }
);


// =====================================================
// EDITAR PROYECTO
// =====================================================

window.editProject =
async function(projectId) {

    const {
        data: project,
        error
    } =
        await supabaseClient
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .single();


    if (error) {

        console.error(error);

        alert(
            "No se pudo cargar el proyecto."
        );

        return;

    }


    editingProject = project;


    modalTitle.textContent =
        "Editar proyecto";


    modalFields.innerHTML = `

        <div class="field">

            <label>Nombre</label>

            <input
                id="project-name"
                value="${escapeAttribute(project.name)}"
                required
            >

        </div>


        <div class="field">

            <label>Cliente</label>

            <input
                id="project-client"
                value="${escapeAttribute(project.client)}"
                required
            >

        </div>


        <div class="field">

            <label>Descripción</label>

            <textarea
                id="project-description"
            >${escapeHTML(
                project.description || ""
            )}</textarea>

        </div>


        <div class="field">

            <label>Estado</label>

            <select id="project-status">

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


        <div class="field">

            <label>Fecha límite</label>

            <input
                type="date"
                id="project-deadline"
                value="${project.deadline || ""}"
            >

        </div>

    `;


    document.getElementById(
        "project-status"
    ).value = project.status;


    openModal();

};


// =====================================================
// GUARDAR PROYECTO
// =====================================================

async function saveProject() {

    const project = {

        name:
            document.getElementById(
                "project-name"
            ).value,

        client:
            document.getElementById(
                "project-client"
            ).value,

        description:
            document.getElementById(
                "project-description"
            ).value,

        status:
            document.getElementById(
                "project-status"
            ).value,

        deadline:
            document.getElementById(
                "project-deadline"
            ).value || null

    };


    let result;


    if (editingProject) {

        result =
            await supabaseClient
                .from("projects")
                .update(project)
                .eq(
                    "id",
                    editingProject.id
                );

    } else {

        result =
            await supabaseClient
                .from("projects")
                .insert({

                    ...project,

                    created_by:
                        currentUser.id

                });

    }


    if (result.error) {

        console.error(
            "Error guardando proyecto:",
            result.error
        );

        alert(
            result.error.message
        );

        return;

    }


    closeModalWindow();

    await loadProjects();

}


// =====================================================
// ELIMINAR PROYECTO
// =====================================================

window.deleteProject =
async function(projectId) {

    if (
        !confirm(
            "¿Eliminar este proyecto?"
        )
    ) {

        return;

    }


    const {
        error
    } =
        await supabaseClient
            .from("projects")
            .delete()
            .eq(
                "id",
                projectId
            );


    if (error) {

        console.error(error);

        alert(
            error.message
        );

        return;

    }


    await loadProjects();

};


// =====================================================
// CARGAR TAREAS
// =====================================================

async function loadTasks() {

    tasksContainer.innerHTML =
        "<p>Cargando tareas...</p>";


    const {
        data,
        error
    } =
        await supabaseClient
            .from("tasks")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Error cargando tareas:",
            error
        );

        tasksContainer.innerHTML =
            "<p>Error cargando tareas.</p>";

        return;

    }


    if (!data || data.length === 0) {

        tasksContainer.innerHTML =
            "<p>No hay tareas todavía.</p>";

        return;

    }


    tasksContainer.innerHTML =
        data.map(task => {

            return `

                <div class="item">

                    <h3>
                        ${escapeHTML(task.title)}
                    </h3>

                    ${
                        task.description
                        ? `
                            <p>
                                ${escapeHTML(
                                    task.description
                                )}
                            </p>
                          `
                        : ""
                    }

                    <p>
                        Estado:
                        ${escapeHTML(task.status)}
                    </p>

                    <p>
                        Prioridad:
                        ${escapeHTML(task.priority)}
                    </p>


                    ${
                        currentProfile &&
                        currentProfile.role === "admin"

                        ?

                        `

                        <div class="item-actions">

                            <button
                                class="edit-button"
                                onclick="editTask('${task.id}')"
                            >
                                Editar
                            </button>

                            <button
                                class="delete-button"
                                onclick="deleteTask('${task.id}')"
                            >
                                Eliminar
                            </button>

                        </div>

                        `

                        :

                        ""

                    }

                </div>

            `;

        }).join("");

}


// =====================================================
// NUEVA TAREA
// =====================================================

newTaskButton.addEventListener(
    "click",
    async function() {

        editingTask = null;

        await showTaskForm();

    }
);


// =====================================================
// FORMULARIO DE TAREA
// =====================================================

async function showTaskForm(task = null) {

    editingTask = task;


    modalTitle.textContent =
        task
        ? "Editar tarea"
        : "Nueva tarea";


    const {
        data: projects,
        error
    } =
        await supabaseClient
            .from("projects")
            .select("id, name")
            .order("name");


    if (error) {

        console.error(error);

        alert(
            "No se pudieron cargar los proyectos."
        );

        return;

    }


    const projectOptions =
        projects.map(project => {

            return `

                <option
                    value="${project.id}"

                    ${
                        task &&
                        task.project_id === project.id
                        ? "selected"
                        : ""
                    }

                >

                    ${escapeHTML(project.name)}

                </option>

            `;

        }).join("");


    modalFields.innerHTML = `

        <div class="field">

            <label>Título</label>

            <input
                id="task-title"

                value="${
                    task
                    ? escapeAttribute(task.title)
                    : ""
                }"

                required
            >

        </div>


        <div class="field">

            <label>Descripción</label>

            <textarea
                id="task-description"
            >${
                task
                ? escapeHTML(
                    task.description || ""
                )
                : ""
            }</textarea>

        </div>


        <div class="field">

            <label>Proyecto</label>

            <select
                id="task-project"
                required
            >

                ${projectOptions}

            </select>

        </div>


        <div class="field">

            <label>Estado</label>

            <select id="task-status">

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


        <div class="field">

            <label>Prioridad</label>

            <select id="task-priority">

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


        <div class="field">

            <label>Fecha límite</label>

            <input
                type="date"
                id="task-deadline"

                value="${
                    task
                    ? task.deadline || ""
                    : ""
                }"
            >

        </div>

    `;


    if (task) {

        document.getElementById(
            "task-status"
        ).value = task.status;


        document.getElementById(
            "task-priority"
        ).value = task.priority;

    }


    openModal();

}


// =====================================================
// EDITAR TAREA
// =====================================================

window.editTask =
async function(taskId) {

    const {
        data: task,
        error
    } =
        await supabaseClient
            .from("tasks")
            .select("*")
            .eq(
                "id",
                taskId
            )
            .single();


    if (error) {

        console.error(error);

        alert(
            "No se pudo cargar la tarea."
        );

        return;

    }


    await showTaskForm(task);

};


// =====================================================
// GUARDAR TAREA
// =====================================================

async function saveTask() {

    const task = {

        title:
            document.getElementById(
                "task-title"
            ).value,

        description:
            document.getElementById(
                "task-description"
            ).value,

        project_id:
            document.getElementById(
                "task-project"
            ).value,

        status:
            document.getElementById(
                "task-status"
            ).value,

        priority:
            document.getElementById(
                "task-priority"
            ).value,

        deadline:
            document.getElementById(
                "task-deadline"
            ).value || null

    };


    let result;


    if (editingTask) {

        result =
            await supabaseClient
                .from("tasks")
                .update(task)
                .eq(
                    "id",
                    editingTask.id
                );

    } else {

        result =
            await supabaseClient
                .from("tasks")
                .insert({

                    ...task,

                    created_by:
                        currentUser.id

                });

    }


    if (result.error) {

        console.error(
            "Error guardando tarea:",
            result.error
        );

        alert(
            result.error.message
        );

        return;

    }


    closeModalWindow();

    await loadTasks();

}


// =====================================================
// ELIMINAR TAREA
// =====================================================

window.deleteTask =
async function(taskId) {

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
        await supabaseClient
            .from("tasks")
            .delete()
            .eq(
                "id",
                taskId
            );


    if (error) {

        console.error(error);

        alert(
            error.message
        );

        return;

    }


    await loadTasks();

};


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

}


closeModal.addEventListener(
    "click",
    closeModalWindow
);


modal.addEventListener(
    "click",
    function(event) {

        if (
            event.target === modal
        ) {

            closeModalWindow();

        }

    }
);


// =====================================================
// GUARDAR FORMULARIO
// =====================================================

modalForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        if (
            editingTask ||
            modalTitle.textContent ===
            "Nueva tarea"
        ) {

            await saveTask();

        } else {

            await saveProject();

        }

    }
);


// =====================================================
// SEGURIDAD VISUAL
// =====================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


function escapeAttribute(value) {

    return escapeHTML(value);

}


// =====================================================
// INICIAR APP
// =====================================================

checkSession();
