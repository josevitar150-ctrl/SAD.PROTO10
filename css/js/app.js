
console.log("PTC OJT Monitoring System connected.");

/* =========================================
   GENERAL FUNCTIONS
========================================= */

function getData(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (error) {
        return [];
    }
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getStudents() {
    return getData("ojtStudents");
}

function getLoggedInStudent() {
    return JSON.parse(localStorage.getItem("loggedInStudent")) || null;
}

function getStudentPlacement(studentNumber) {
    return getData("ojtPlacements").find(
        placement => placement.studentNumber === studentNumber
    );
}

function isPlacementApproved(studentNumber) {
    const placement = getStudentPlacement(studentNumber);
    return placement && placement.status === "Approved";
}

function showMessage(elementId, message, type = "success") {
    const element = document.getElementById(elementId);

    if (!element) return;

    element.textContent = message;
    element.className = "message " + (type === "error" ? "error-message" : "success-message");
}

function addCell(row, value) {
    const cell = document.createElement("td");

    if (value instanceof Node) {
        cell.appendChild(value);
    } else {
        cell.textContent = value ?? "-";
    }

    row.appendChild(cell);
    return cell;
}

function addEmptyRow(tbody, colspan, message = "No records found.") {
    if (!tbody) return;

    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = colspan;
    cell.textContent = message;
    cell.style.textAlign = "center";

    row.appendChild(cell);
    tbody.appendChild(row);
}

function formatHours(hours) {
    return Number(hours || 0).toFixed(2);
}

function getRenderedHours(studentNumber) {
    return getData("ojtDailyReports")
        .filter(report => report.studentNumber === studentNumber)
        .reduce((total, report) => total + Number(report.renderedHours || 0), 0);
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Unable to read file."));

        reader.readAsDataURL(file);
    });
}

function createDownloadLink(fileData, fileName, label = "Download") {
    const link = document.createElement("a");

    link.href = fileData;
    link.download = fileName || "download";
    link.textContent = label;

    return link;
}

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return characters[character];
    });
}

function updateStudentRecord(studentNumber, updates) {
    const students = getStudents();

    const index = students.findIndex(
        student => student.number === studentNumber
    );

    if (index === -1) return null;

    students[index] = {
        ...students[index],
        ...updates
    };

    saveData("ojtStudents", students);

    const loggedInStudent = getLoggedInStudent();

    if (loggedInStudent && loggedInStudent.number === studentNumber) {
        localStorage.setItem(
            "loggedInStudent",
            JSON.stringify(students[index])
        );
    }

    return students[index];
}

/* =========================================
   DEMO ACCOUNTS
========================================= */

const professorAccount = {
    email: "professor@ptc.edu.ph",
    password: "prof123",
    role: "professor"
};

const adminAccount = {
    email: "admin@ptc.edu.ph",
    password: "admin123",
    role: "admin"
};

/* =========================================
   SIDEBAR NAVIGATION
========================================= */

function initializeSidebar() {
    const sidebarLinks = document.querySelectorAll(".sidebar-link");

    if (!sidebarLinks.length) return;

    sidebarLinks.forEach(link => {
        link.addEventListener("click", function () {
            sidebarLinks.forEach(item => item.classList.remove("active"));
            this.classList.add("active");
        });
    });

    const sections = [];

    sidebarLinks.forEach(link => {
        const targetId = link.getAttribute("href");

        if (!targetId || !targetId.startsWith("#")) return;

        const section = document.querySelector(targetId);

        if (section) {
            sections.push({
                section,
                link
            });
        }
    });

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                sections.forEach(item => {
                    if (item.section === entry.target) {
                        sidebarLinks.forEach(link =>
                            link.classList.remove("active")
                        );

                        item.link.classList.add("active");
                    }
                });
            });
        }, {
            rootMargin: "-20% 0px -65% 0px"
        });

        sections.forEach(item => observer.observe(item.section));
    }
}

/* =========================================
   LOGOUT FUNCTIONS
========================================= */

function logoutStudent() {
    localStorage.removeItem("loggedInStudent");
    window.location.href = "index.html";
}

function logoutAdmin() {
    localStorage.removeItem("loggedInAdmin");
    window.location.href = "index.html";
}

function logoutProfessor() {
    localStorage.removeItem("loggedInProfessor");
    window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", function () {
    const studentLogout = document.getElementById("logoutButton");
    const studentSidebarLogout = document.getElementById("studentSidebarLogout");

    const adminLogout = document.getElementById("adminLogoutButton");
    const adminSidebarLogout = document.getElementById("adminSidebarLogout");

    const professorLogout = document.getElementById("professorLogoutButton");
    const professorSidebarLogout = document.getElementById("professorSidebarLogout");

    if (studentLogout) studentLogout.addEventListener("click", logoutStudent);
    if (studentSidebarLogout) studentSidebarLogout.addEventListener("click", logoutStudent);

    if (adminLogout) adminLogout.addEventListener("click", logoutAdmin);
    if (adminSidebarLogout) adminSidebarLogout.addEventListener("click", logoutAdmin);

    if (professorLogout) professorLogout.addEventListener("click", logoutProfessor);
    if (professorSidebarLogout) professorSidebarLogout.addEventListener("click", logoutProfessor);

    initializeSidebar();
});


/* =========================================
   STUDENT REGISTRATION - MYSQL DATABASE
========================================= */

const registrationForm = document.getElementById("registrationForm");

if (registrationForm) {
    registrationForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("studentName").value.trim();
        const number = document.getElementById("studentNumber").value.trim();
        const email = document.getElementById("studentEmail").value.trim().toLowerCase();
        const course = document.getElementById("studentCourse").value.trim();
        const password = document.getElementById("studentPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        // Check required fields
        if (!name || !number || !email || !course || !password || !confirmPassword) {
            alert("Please complete all required fields.");
            return;
        }

        // Check password length
        if (password.length < 6) {
            alert("Password must contain at least 6 characters.");
            return;
        }

        // Check password confirmation
        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        // Prevent multiple submissions
        const submitButton = registrationForm.querySelector('button[type="submit"]');

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Submitting...";
        }

        try {
            // Send registration information to PHP
            console.log("SENDING REGISTRATION TO PHP...");
            const response = await fetch("api/register.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    number: number,
                    email: email,
                    course: course,
                    password: password
                })
            });

            const result = await response.json();

            console.log("PHP RESPONSE:", result);

            if (!response.ok || !result.success) {
                alert(result.message || "Registration failed. Please try again.");
                return;
            }

            alert("Registration submitted successfully. Please wait for administrator approval.");

            registrationForm.reset();
            window.location.href = "index.html";

        } catch (error) {
            console.error("Registration Error:", error);
            alert("Unable to connect to the server. Please check your connection and try again.");

        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Submit Registration";
            }
        }
    });
}


/* =========================================
   STUDENT LOGIN - MYSQL DATABASE
========================================= */

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const emailElement = document.getElementById("loginEmail");
        const passwordElement = document.getElementById("loginPassword");

        if (!emailElement || !passwordElement) return;

        const email = emailElement.value.trim().toLowerCase();
        const password = passwordElement.value;

        // ADMIN DEMO LOGIN
        if (
            email === adminAccount.email &&
            password === adminAccount.password
        ) {
            localStorage.setItem(
                "loggedInAdmin",
                JSON.stringify(adminAccount)
            );

            window.location.href = "admin.html";
            return;
        }

        // PROFESSOR DEMO LOGIN
        if (
            email === professorAccount.email &&
            password === professorAccount.password
        ) {
            localStorage.setItem(
                "loggedInProfessor",
                JSON.stringify(professorAccount)
            );

            window.location.href = "ojt-professor.html";
            return;
        }

        // STUDENT MYSQL LOGIN
        const submitButton = loginForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Signing in...";
        }

        try {
            console.log("SENDING STUDENT LOGIN TO MYSQL...");

            const response = await fetch("api/student_login.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const result = await response.json();

            console.log("LOGIN PHP RESPONSE:", result);

            if (!response.ok || !result.success) {
                alert(result.message || "Invalid email or password.");
                return;
            }

            const databaseStudent = result.student;

            // GET EXISTING LOCALSTORAGE DATA
            // This preserves the student's existing OJT records.
            const students = getStudents();

            const existingIndex = students.findIndex(student =>
                student.number === databaseStudent.student_number ||
                student.email.toLowerCase() === databaseStudent.email.toLowerCase()
            );

            const existingStudent = existingIndex !== -1
                ? students[existingIndex]
                : {};

            // CONVERT MYSQL DATA TO EXISTING PROTOTYPE FORMAT
            const student = {
                ...existingStudent,
                id: databaseStudent.id,
                name: databaseStudent.full_name,
                number: databaseStudent.student_number,
                email: databaseStudent.email,
                course: databaseStudent.course_section,
                status: "Approved"
            };

            // SAVE/SYNCHRONIZE STUDENT FOR EXISTING FEATURES
            if (existingIndex !== -1) {
                students[existingIndex] = student;
            } else {
                students.push(student);
            }

            saveData("ojtStudents", students);

            // SAVE CURRENT LOGGED-IN STUDENT
            localStorage.setItem(
                "loggedInStudent",
                JSON.stringify(student)
            );

            alert("Login successful!");

            window.location.href = "student.html";

        } catch (error) {
            console.error("Student Login Error:", error);

            alert(
                "Unable to connect to the server. Please check your connection and try again."
            );

        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Login";
            }
        }
    });
}

/* =========================================
   FORGOT PASSWORD
========================================= */

const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const recoverySection = document.getElementById("recoverySection");
const recoveryForm = document.getElementById("recoveryForm");

if (forgotPasswordLink && recoverySection) {
    forgotPasswordLink.addEventListener("click", function (event) {
        event.preventDefault();
        recoverySection.classList.toggle("hidden");
    });
}

if (recoveryForm) {
    recoveryForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const numberElement = document.getElementById("recoveryStudentNumber");
        const emailElement = document.getElementById("recoveryEmail");
        const passwordElement = document.getElementById("recoveryNewPassword");
        const confirmElement = document.getElementById("recoveryConfirmPassword");

        if (!numberElement || !emailElement || !passwordElement || !confirmElement) {
            alert("The password recovery fields could not be found.");
            return;
        }

        const number = numberElement.value.trim();
        const email = emailElement.value.trim().toLowerCase();
        const password = passwordElement.value;
        const confirmPassword = confirmElement.value;

        if (password.length < 6) {
            alert("New password must contain at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        const students = getStudents();

        const index = students.findIndex(student =>
            student.number === number &&
            student.email.toLowerCase() === email
        );

        if (index === -1) {
            alert("Student number and email do not match any registered account.");
            return;
        }

        students[index].password = password;
        saveData("ojtStudents", students);

        alert("Password updated successfully. You can now log in.");

        recoveryForm.reset();
        recoverySection.classList.add("hidden");
    });
}

/* =========================================
   ADMIN DASHBOARD ACCESS
========================================= */

const adminTableBody = document.getElementById("studentTableBody");

if (adminTableBody) {
    const loggedInAdmin = JSON.parse(
        localStorage.getItem("loggedInAdmin")
    );

    if (!loggedInAdmin) {
        window.location.href = "index.html";
    } else {
        displayStudents();
    }
}

/* =========================================
   ADMIN STUDENT RECORDS - MYSQL
========================================= */

async function displayStudents() {
    const tbody = document.getElementById("studentTableBody");

    if (!tbody) return;

    tbody.innerHTML = "";
    addEmptyRow(tbody, 6, "Loading student records...");

    const totalElement = document.getElementById("totalStudents");
    const pendingElement = document.getElementById("pendingStudents");
    const approvedElement = document.getElementById("approvedStudents");

    try {
        const response = await fetch("api/admin_students.php");
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to load student records.");
        }

        const students = result.students || [];

        // Update dashboard counters
        if (totalElement) {
            totalElement.textContent = students.length;
        }

        if (pendingElement) {
            pendingElement.textContent = students.filter(
                student => student.account_status.toLowerCase() === "pending"
            ).length;
        }

        if (approvedElement) {
            approvedElement.textContent = students.filter(
                student => student.account_status.toLowerCase() === "approved"
            ).length;
        }

        tbody.innerHTML = "";

        if (students.length === 0) {
            addEmptyRow(tbody, 6, "No student registrations found.");
            return;
        }

        // Display MySQL student records
        students.forEach(student => {
            const row = document.createElement("tr");

            addCell(row, student.full_name);
            addCell(row, student.student_number);
            addCell(row, student.email);
            addCell(row, student.course_section);

            const status = student.account_status.toLowerCase();
            const statusCell = addCell(
                row,
                status.charAt(0).toUpperCase() + status.slice(1)
            );

            if (status === "approved") {
                statusCell.className = "status-approved";
            } else {
                statusCell.className = "status-pending";
            }

            const actionCell = document.createElement("td");

            if (status === "pending") {
                const approveButton = document.createElement("button");

                approveButton.textContent = "Approve";
                approveButton.className = "primary-button";
                approveButton.type = "button";

                approveButton.addEventListener("click", function () {
                    approveStudent(student.id);
                });

                actionCell.appendChild(approveButton);
            } else {
                actionCell.textContent = "No action needed";
            }

            row.appendChild(actionCell);
            tbody.appendChild(row);
        });

    } catch (error) {
        console.error("Admin Student Records Error:", error);

        tbody.innerHTML = "";
        addEmptyRow(tbody, 6, "Unable to load student records.");

        if (totalElement) totalElement.textContent = "0";
        if (pendingElement) pendingElement.textContent = "0";
        if (approvedElement) approvedElement.textContent = "0";
    }
}

/* =========================================
   APPROVE STUDENT - MYSQL
========================================= */

async function approveStudent(studentId) {
    if (!confirm("Are you sure you want to approve this student account?")) {
        return;
    }

    try {
        const response = await fetch("api/admin_approve_student.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: studentId
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert(result.message || "Unable to approve student account.");
            return;
        }

        showMessage(
            "adminMessage",
            "Student account approved successfully."
        );

        // Reload the records from MySQL
        await displayStudents();

    } catch (error) {
        console.error("Approve Student Error:", error);
        alert("Unable to connect to the server. Please try again.");
    }
}

/* =========================================
   PROFESSOR DASHBOARD ACCESS
========================================= */

const professorTableBody = document.getElementById("professorStudentTableBody");

if (professorTableBody) {
    const loggedInProfessor = JSON.parse(
        localStorage.getItem("loggedInProfessor")
    );

    if (!loggedInProfessor) {
        window.location.href = "index.html";
    }
}

/* =========================================
   PROFESSOR COMPANY PLACEMENTS - MYSQL
========================================= */

async function displayProfessorPlacements() {
    const tbody = document.getElementById("professorPlacementTableBody");

    if (!tbody) return;

    try {
        // Retrieve placements directly from MySQL
        const response = await fetch("api/professor_placements.php");
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to load placements.");
        }

        const placements = result.placements || [];

        // Update pending placement counter
        const pendingCount = placements.filter(
            placement => placement.status === "Pending"
        ).length;

        const pendingElement = document.getElementById(
            "professorPendingPlacements"
        );

        if (pendingElement) {
            pendingElement.textContent = pendingCount;
        }

        // Rebuild only the placement table
        tbody.innerHTML = "";

        if (placements.length === 0) {
            addEmptyRow(tbody, 7, "No company placement submissions found.");
            return;
        }

        placements.forEach(placement => {
            const row = document.createElement("tr");

            addCell(row, placement.full_name);
            addCell(row, placement.company_name);
            addCell(row, placement.company_address);
            addCell(row, placement.contact_person);
            addCell(row, placement.contact_number);

            const statusCell = addCell(row, placement.status);

            statusCell.className =
                placement.status === "Approved" ? "status-approved" :
                placement.status === "Rejected" ? "status-rejected" :
                "status-pending";

            const actionCell = document.createElement("td");

            if (placement.status === "Pending") {
                const approveButton = document.createElement("button");

                approveButton.textContent = "Approve";
                approveButton.className = "primary-button";
                approveButton.type = "button";

                approveButton.addEventListener("click", function () {
                    updatePlacementStatus(placement.student_id, "Approved", this);
                });

                const rejectButton = document.createElement("button");

                rejectButton.textContent = "Reject";
                rejectButton.className = "secondary-button";
                rejectButton.type = "button";
                rejectButton.style.marginLeft = "5px";

                rejectButton.addEventListener("click", function () {
                    updatePlacementStatus(placement.student_id, "Rejected", this);
                });

                actionCell.appendChild(approveButton);
                actionCell.appendChild(rejectButton);
            } else {
                actionCell.textContent = "Reviewed";
            }

            row.appendChild(actionCell);
            tbody.appendChild(row);
        });

    } catch (error) {
        console.error("Professor Placements Error:", error);

        // Show an error without refreshing the entire dashboard
        if (!tbody.children.length) {
            addEmptyRow(tbody, 7, "Unable to load company placements.");
        } else {
            alert("Unable to refresh company placements. Please try again.");
        }
    }
}


/* =========================================
   UPDATE PLACEMENT STATUS - MYSQL
========================================= */

const placementUpdatesInProgress = new Set();

async function updatePlacementStatus(studentId, status, clickedButton) {
    if (placementUpdatesInProgress.has(studentId)) return;

    let feedback = "";

    if (status === "Rejected") {
        feedback = prompt("Enter the reason for rejecting this placement:");

        if (feedback === null) return;

        if (!feedback.trim()) {
            alert("Please enter a reason for rejection.");
            return;
        }
    }

    placementUpdatesInProgress.add(studentId);

    if (clickedButton) {
        clickedButton.disabled = true;
        clickedButton.textContent = "Processing...";
    }

    try {
        const response = await fetch("api/update_placement_status.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                student_id: studentId,
                status: status,
                feedback: feedback.trim()
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Unable to update placement status."
            );
        }

        // Refresh only the placement table
        await displayProfessorPlacements();

        alert(result.message || "Placement status updated successfully.");

    } catch (error) {
        console.error("Update Placement Status Error:", error);

        alert(error.message || "Unable to connect to the database.");

        // Restore the button if the update failed
        if (clickedButton) {
            clickedButton.disabled = false;
            clickedButton.textContent = status === "Approved"
                ? "Approve"
                : "Reject";
        }

    } finally {
        placementUpdatesInProgress.delete(studentId);
    }
}

/* =========================================
   PROFESSOR DASHBOARD DISPLAY
========================================= */

function displayProfessorDashboard() {
    displayProfessorPlacements();
    displayProfessorRequirements();
    displayProfessorDailyReports();
    displayProfessorWeeklyReports();
    displayProfessorEvaluationForms();
    displayProfessorProgress();
    displayProfessorSummary();
}


/* =========================================
   PROFESSOR REQUIREMENT VERIFICATION
========================================= */

function displayProfessorRequirements() {
    const tbody = document.getElementById("professorRequirementTable");

    if (!tbody) return;

    const requirements = getData("ojtRequirements");
    const students = getStudents();

    tbody.innerHTML = "";

    if (requirements.length === 0) {
        addEmptyRow(tbody, 6, "No student requirements submitted.");
        return;
    }

    requirements.forEach((requirement, index) => {
        const student = students.find(
            item => item.number === requirement.studentNumber
        );

        const row = document.createElement("tr");

        addCell(row, student ? student.name : "Unknown Student");
        addCell(row, requirement.name);

        const fileCell = document.createElement("td");

        if (requirement.fileData) {
            fileCell.appendChild(
                createDownloadLink(
                    requirement.fileData,
                    requirement.fileName || "requirement",
                    "View File"
                )
            );
        } else {
            fileCell.textContent = "No file";
        }

        row.appendChild(fileCell);

        addCell(row, requirement.dateSubmitted || "-");

        const statusCell = addCell(row, requirement.status || "Pending");

        statusCell.className =
            requirement.status === "Verified" ? "status-approved" :
            requirement.status === "For Revision" ? "status-revision" :
            "status-pending";

        const actionCell = document.createElement("td");

        if (requirement.status !== "Verified") {
            const verifyButton = document.createElement("button");

            verifyButton.textContent = "Verify";
            verifyButton.className = "primary-button";
            verifyButton.type = "button";

            verifyButton.addEventListener("click", function () {
                updateRequirementStatus(index, "Verified");
            });

            const revisionButton = document.createElement("button");

            revisionButton.textContent = "For Revision";
            revisionButton.className = "secondary-button";
            revisionButton.type = "button";
            revisionButton.style.marginLeft = "5px";

            revisionButton.addEventListener("click", function () {
                updateRequirementStatus(index, "For Revision");
            });

            actionCell.appendChild(verifyButton);
            actionCell.appendChild(revisionButton);
        } else {
            actionCell.textContent = "Verified";
        }

        row.appendChild(actionCell);
        tbody.appendChild(row);
    });
}

function updateRequirementStatus(index, status) {
    const requirements = getData("ojtRequirements");

    if (!requirements[index]) return;

    let feedback = "";

    if (status === "For Revision") {
        feedback = prompt("Enter feedback for the student:");

        if (feedback === null) return;

        if (!feedback.trim()) {
            alert("Please provide feedback.");
            return;
        }
    }

    requirements[index].status = status;
    requirements[index].feedback = feedback;
    requirements[index].dateReviewed = new Date().toLocaleDateString();

    saveData("ojtRequirements", requirements);

    displayProfessorRequirements();
}

/* =========================================
   STUDENT DASHBOARD ACCESS
========================================= */

const studentDashboard = document.getElementById("studentDashboard");

if (studentDashboard) {
    const loggedInStudent = getLoggedInStudent();

    if (!loggedInStudent) {
        window.location.href = "index.html";
    } else {
        displayStudentDashboard();
    }
}

/* =========================================
   STUDENT DASHBOARD DISPLAY
========================================= */

function displayStudentDashboard() {
    const currentStudent = getLoggedInStudent();

    if (!currentStudent) return;

    const nameElement = document.getElementById("studentName");
    const accountStatus = document.getElementById("accountStatus");

    if (nameElement) {
        nameElement.textContent = currentStudent.name;
    }

    if (accountStatus) {
        accountStatus.textContent = currentStudent.status;
    }

    displayStudentProfile(currentStudent);
    displayStudentPlacement(currentStudent);
    displayStudentProgress(currentStudent);
    displayStudentRequirements(currentStudent);
    displayStudentDailyReports(currentStudent);
    displayStudentWeeklyReports(currentStudent);
    displayStudentEvaluationForms();

    initializeRequiredHours(currentStudent);
}

/* =========================================
   STUDENT PROFILE
========================================= */

function displayStudentProfile(student) {
    const fields = {
        profileName: student.name,
        profileNumber: student.number,
        profileEmail: student.email,
        profileCourse: student.course
    };

    Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value || "-";
        }
    });

    const editName = document.getElementById("editProfileName");
    const editEmail = document.getElementById("editProfileEmail");
    const editCourse = document.getElementById("editProfileCourse");

    if (editName) editName.value = student.name || "";
    if (editEmail) editEmail.value = student.email || "";
    if (editCourse) editCourse.value = student.course || "";
}

/* =========================================
   EDIT STUDENT PROFILE
========================================= */

const editProfileButton = document.getElementById("editProfileButton");
const editProfileForm = document.getElementById("editProfileForm");
const cancelProfileEdit = document.getElementById("cancelProfileEdit");

if (editProfileButton && editProfileForm) {
    editProfileButton.addEventListener("click", function () {
        const student = getLoggedInStudent();

        if (!student) return;

        displayStudentProfile(student);
        editProfileForm.classList.remove("hidden");
        editProfileButton.classList.add("hidden");
    });
}

if (cancelProfileEdit && editProfileForm) {
    cancelProfileEdit.addEventListener("click", function () {
        editProfileForm.classList.add("hidden");

        if (editProfileButton) {
            editProfileButton.classList.remove("hidden");
        }

        const student = getLoggedInStudent();

        if (student) displayStudentProfile(student);
    });
}

if (editProfileForm) {
    editProfileForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const student = getLoggedInStudent();

        if (!student) return;

        const name = document.getElementById("editProfileName").value.trim();
        const email = document.getElementById("editProfileEmail").value.trim().toLowerCase();
        const course = document.getElementById("editProfileCourse").value.trim();

        if (!name || !email || !course) {
            showMessage("profileEditMessage", "Please complete all fields.", "error");
            return;
        }

        const duplicateEmail = getStudents().some(item =>
            item.number !== student.number &&
            item.email.toLowerCase() === email
        );

        if (duplicateEmail) {
            showMessage("profileEditMessage", "This email is already used by another student.", "error");
            return;
        }

        const updatedStudent = updateStudentRecord(student.number, {
            name,
            email,
            course
        });

        if (!updatedStudent) {
            showMessage("profileEditMessage", "Unable to update profile.", "error");
            return;
        }

        displayStudentDashboard();

        editProfileForm.classList.add("hidden");

        if (editProfileButton) {
            editProfileButton.classList.remove("hidden");
        }

        showMessage("profileEditMessage", "Profile updated successfully.");
    });
}

/* =========================================
   STUDENT COMPANY PLACEMENT
========================================= */

async function displayStudentPlacement(student) {
    const companyName = document.getElementById("studentCompanyName");
    const companyAddress = document.getElementById("studentCompanyAddress");
    const placementStatus = document.getElementById("studentPlacementStatus");
    const feedback = document.getElementById("placementFeedback");

    const features = document.getElementById("unlockedOjtFeatures");
    const lockMessage = document.getElementById("placementLockMessage");
    const placementForm = document.getElementById("placementForm");
    const submitButton = document.getElementById("placementSubmitButton");
    const ojtStatus = document.getElementById("ojtStatus");

    try {
        const response = await fetch(
            `api/student_placement.php?student_id=${encodeURIComponent(student.id)}`
        );

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || "Unable to retrieve placement.");
        }

        let placement = result.placement;

        // Update the existing LocalStorage cache
        let placements = getData("ojtPlacements");

        placements = placements.filter(
            item => item.studentNumber !== student.number
        );

        if (placement) {
            placement = {
                id: placement.id,
                studentId: placement.student_id,
                studentNumber: student.number,
                studentName: student.name,
                companyName: placement.company_name,
                companyAddress: placement.company_address,
                contactPerson: placement.contact_person,
                contactNumber: placement.contact_number,
                status: placement.status,
                feedback: placement.feedback || "",
                dateSubmitted: placement.date_submitted,
                dateReviewed: placement.date_reviewed
            };

            placements.push(placement);
        }

        saveData("ojtPlacements", placements);

        if (!placement) {
            if (companyName) companyName.textContent = "Not submitted";
            if (companyAddress) companyAddress.textContent = "Not submitted";
            if (placementStatus) placementStatus.textContent = "Not Submitted";
            if (feedback) feedback.textContent = "";

            if (features) features.classList.add("hidden");
            if (lockMessage) lockMessage.classList.remove("hidden");

            if (placementForm) placementForm.classList.remove("hidden");

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Submit Company Placement";
            }

            if (ojtStatus) ojtStatus.textContent = "Not Started";

            displayStudentProgress(student);
            return;
        }

        if (companyName) companyName.textContent = placement.companyName;
        if (companyAddress) companyAddress.textContent = placement.companyAddress;

        if (placementStatus) {
            placementStatus.textContent = placement.status;
            placementStatus.className =
                placement.status === "Approved" ? "status-approved" :
                placement.status === "Rejected" ? "status-rejected" :
                "status-pending";
        }

        if (feedback) {
            feedback.textContent = placement.feedback
                ? "Professor Feedback: " + placement.feedback
                : "";
        }

        if (placement.status === "Approved") {
            if (features) features.classList.remove("hidden");
            if (lockMessage) lockMessage.classList.add("hidden");

            if (placementForm) placementForm.classList.add("hidden");

            if (ojtStatus) ojtStatus.textContent = "Ongoing";
        } else {
            if (features) features.classList.add("hidden");
            if (lockMessage) lockMessage.classList.remove("hidden");

            if (ojtStatus) {
                ojtStatus.textContent =
                    placement.status === "Rejected"
                        ? "Placement Rejected"
                        : "Waiting for Approval";
            }

            if (placementForm) {
                placementForm.classList.toggle(
                    "hidden",
                    placement.status !== "Rejected"
                );
            }

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent =
                    placement.status === "Rejected"
                        ? "Resubmit Company Placement"
                        : "Submit Company Placement";
            }
        }

        displayStudentProgress(student);

    } catch (error) {
        console.error("Student placement error:", error);

        showMessage(
            "placementMessage",
            "Unable to retrieve company placement from the database.",
            "error"
        );
    }
}

/* =========================================
   STUDENT PLACEMENT SUBMISSION
========================================= */

const placementForm = document.getElementById("placementForm");

if (placementForm) {
    placementForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const student = getLoggedInStudent();

        if (!student || !student.id) {
            showMessage("placementMessage", "Please log in again.", "error");
            return;
        }

        const companyName = document.getElementById("companyName").value.trim();
        const companyAddress = document.getElementById("companyAddress").value.trim();
        const contactPerson = document.getElementById("companyContactPerson").value.trim();
        const contactNumber = document.getElementById("companyContactNumber").value.trim();

        if (!companyName || !companyAddress || !contactPerson || !contactNumber) {
            showMessage(
                "placementMessage",
                "Please complete all company placement fields.",
                "error"
            );
            return;
        }

        const submitButton = document.getElementById("placementSubmitButton");

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Submitting...";
        }

        try {
            const response = await fetch("api/submit_placement.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    student_id: student.id,
                    company_name: companyName,
                    company_address: companyAddress,
                    contact_person: contactPerson,
                    contact_number: contactNumber
                })
            });

            const result = await response.json();

            if (!result.success) {
                showMessage(
                    "placementMessage",
                    result.message || "Unable to submit company placement.",
                    "error"
                );
                return;
            }

            placementForm.reset();

            showMessage(
                "placementMessage",
                result.message || "Company placement submitted successfully."
            );

            await displayStudentPlacement(student);

        } catch (error) {
            console.error("Placement submission error:", error);

            showMessage(
                "placementMessage",
                "Unable to connect to the database. Please try again.",
                "error"
            );

        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });
}

/* =========================================
   REQUIRED OJT HOURS
========================================= */

function initializeRequiredHours(student) {
    const input = document.getElementById("requiredOjtHours");
    const display = document.getElementById("requiredHoursDisplay");
    const saveButton = document.getElementById("saveRequiredHoursButton");
    const dailyForm = document.getElementById("dailyReportForm");
    const lockMessage = document.getElementById("dailyHoursLockMessage");

    if (!input) return;

    const requiredHours = Number(student.requiredHours || 0);

    input.value = requiredHours > 0 ? requiredHours : "";

    if (display) {
        display.textContent = requiredHours > 0
            ? requiredHours + " hours"
            : "Not yet set";
    }

    const isSet = requiredHours > 0;

    if (saveButton) {
        saveButton.textContent = isSet ? "Update Required Hours" : "Save Required Hours";
    }

    if (dailyForm) {
        const controls = dailyForm.querySelectorAll("input, textarea, button");

        controls.forEach(control => {
            control.disabled = !isSet;
        });
    }

    if (lockMessage) {
        lockMessage.textContent = isSet
            ? "Your required OJT hours are set. You can now submit daily attendance."
            : "Please set your required OJT hours before submitting daily attendance.";
    }
}

const requiredHoursForm = document.getElementById("requiredHoursForm");

if (requiredHoursForm) {
    requiredHoursForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const student = getLoggedInStudent();

        if (!student) return;

        const input = document.getElementById("requiredOjtHours");
        const requiredHours = Number(input.value);

        if (!Number.isFinite(requiredHours) || requiredHours <= 0) {
            showMessage("requiredHoursMessage", "Enter a valid required OJT hour target.", "error");
            return;
        }

        if (!Number.isInteger(requiredHours)) {
            showMessage("requiredHoursMessage", "Please enter a whole number of hours.", "error");
            return;
        }

        const currentHours = getRenderedHours(student.number);

        if (currentHours > 0 && requiredHours < currentHours) {
            showMessage(
                "requiredHoursMessage",
                "Your target cannot be lower than the hours you have already rendered.",
                "error"
            );
            return;
        }

        const updatedStudent = updateStudentRecord(student.number, {
            requiredHours
        });

        if (!updatedStudent) {
            showMessage("requiredHoursMessage", "Unable to save your required hours.", "error");
            return;
        }

        initializeRequiredHours(updatedStudent);
        displayStudentProgress(updatedStudent);

        showMessage("requiredHoursMessage", "Required OJT hours saved successfully.");
    });
}

/* =========================================
   STUDENT REQUIREMENTS
========================================= */

const requirementForm = document.getElementById("requirementForm");

if (requirementForm) {
    requirementForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const student = getLoggedInStudent();

        if (!student) return;

        const name = document.getElementById("requirementName").value.trim();
        const fileInput = document.getElementById("requirementFile");
        const file = fileInput.files[0];

        if (!name || !file) {
            showMessage("requirementMessage", "Please enter the requirement name and select a file.", "error");
            return;
        }

        if (file.size > 1024 * 1024) {
            showMessage("requirementMessage", "File size must not exceed 1 MB.", "error");
            return;
        }

        try {
            const fileData = await readFile(file);
            const requirements = getData("ojtRequirements");

            requirements.push({
                studentNumber: student.number,
                name,
                fileName: file.name,
                fileData,
                dateSubmitted: new Date().toLocaleDateString(),
                status: "Pending",
                feedback: ""
            });

            saveData("ojtRequirements", requirements);

            requirementForm.reset();

            showMessage("requirementMessage", "Requirement submitted successfully.");

            displayStudentRequirements(student);
            displayStudentProgress(student);
        } catch (error) {
            showMessage("requirementMessage", "Unable to upload your file.", "error");
        }
    });
}

function displayStudentRequirements(student) {
    const tbody = document.getElementById("studentRequirementTable");

    if (!tbody) return;

    const requirements = getData("ojtRequirements").filter(
        requirement => requirement.studentNumber === student.number
    );

    tbody.innerHTML = "";

    if (requirements.length === 0) {
        addEmptyRow(tbody, 5, "No requirements submitted yet.");
        return;
    }

    requirements.forEach(requirement => {
        const row = document.createElement("tr");

        addCell(row, requirement.name);

        const fileCell = document.createElement("td");

        if (requirement.fileData) {
            fileCell.appendChild(
                createDownloadLink(
                    requirement.fileData,
                    requirement.fileName || "requirement",
                    "Download"
                )
            );
        } else {
            fileCell.textContent = "No file";
        }

        row.appendChild(fileCell);

        addCell(row, requirement.dateSubmitted || "-");

        const statusCell = addCell(row, requirement.status || "Pending");

        statusCell.className =
            requirement.status === "Verified" ? "status-approved" :
            requirement.status === "For Revision" ? "status-revision" :
            "status-pending";

        addCell(row, requirement.feedback || "-");

        tbody.appendChild(row);
    });
}

/* =========================================
   STUDENT DAILY ATTENDANCE
========================================= */

const dailyReportForm = document.getElementById("dailyReportForm");

if (dailyReportForm) {
    dailyReportForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const student = getLoggedInStudent();

        if (!student) return;

        const currentStudent = getStudents().find(
            item => item.number === student.number
        );

        if (!currentStudent || Number(currentStudent.requiredHours || 0) <= 0) {
            showMessage("dailyReportMessage", "Please set your required OJT hours first.", "error");
            return;
        }

        const date = document.getElementById("reportDate").value;
        const timeIn = document.getElementById("timeIn").value;
        const timeOut = document.getElementById("timeOut").value;
        const activities = document.getElementById("dailyActivities").value.trim();

        if (!date || !timeIn || !timeOut || !activities) {
            showMessage("dailyReportMessage", "Please complete all daily report fields.", "error");
            return;
        }

        if (timeOut <= timeIn) {
            showMessage("dailyReportMessage", "Time Out must be later than Time In.", "error");
            return;
        }

        const dailyReports = getData("ojtDailyReports");

        const duplicate = dailyReports.some(report =>
            report.studentNumber === student.number &&
            report.date === date
        );

        if (duplicate) {
            showMessage("dailyReportMessage", "You have already submitted attendance for this date.", "error");
            return;
        }

        const start = new Date(`2000-01-01T${timeIn}`);
        const end = new Date(`2000-01-01T${timeOut}`);

        const renderedHours = (end - start) / (1000 * 60 * 60);

        if (renderedHours <= 0) {
            showMessage("dailyReportMessage", "Invalid attendance time.", "error");
            return;
        }

        const totalHours = getRenderedHours(student.number);

        if (totalHours >= Number(currentStudent.requiredHours)) {
            showMessage("dailyReportMessage", "You have already reached your required OJT hours.", "error");
            return;
        }

        dailyReports.push({
            studentNumber: student.number,
            studentName: student.name,
            date,
            timeIn,
            timeOut,
            activities,
            renderedHours: Number(renderedHours.toFixed(2)),
            dateSubmitted: new Date().toLocaleDateString()
        });

        saveData("ojtDailyReports", dailyReports);

        dailyReportForm.reset();

        showMessage("dailyReportMessage", "Daily attendance submitted successfully.");

        displayStudentDailyReports(student);
        displayStudentProgress(student);
        displayProfessorDashboard();
    });
}

function displayStudentDailyReports(student) {
    const tbody = document.getElementById("studentDailyReportHistory");

    if (!tbody) return;

    const reports = getData("ojtDailyReports")
        .filter(report => report.studentNumber === student.number)
        .sort((a, b) => b.date.localeCompare(a.date));

    tbody.innerHTML = "";

    if (reports.length === 0) {
        addEmptyRow(tbody, 5, "No daily attendance records found.");
        return;
    }

    reports.forEach(report => {
        const row = document.createElement("tr");

        addCell(row, report.date);
        addCell(row, report.timeIn);
        addCell(row, report.timeOut);
        addCell(row, report.activities);
        addCell(row, formatHours(report.renderedHours));

        tbody.appendChild(row);
    });
}

/* =========================================
   PROFESSOR DAILY REPORTS
========================================= */

function displayProfessorDailyReports() {
    const tbody = document.getElementById("professorDailyReportTableBody");

    if (!tbody) return;

    const reports = getData("ojtDailyReports")
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date));

    const students = getStudents();

    tbody.innerHTML = "";

    if (reports.length === 0) {
        addEmptyRow(tbody, 6, "No daily reports submitted.");
        return;
    }

    reports.forEach(report => {
        const student = students.find(
            item => item.number === report.studentNumber
        );

        const row = document.createElement("tr");

        addCell(row, student ? student.name : report.studentName || "Unknown Student");
        addCell(row, report.date);
        addCell(row, report.timeIn);
        addCell(row, report.timeOut);
        addCell(row, report.activities);
        addCell(row, formatHours(report.renderedHours));

        tbody.appendChild(row);
    });
}

/* =========================================
   STUDENT WEEKLY REPORTS
========================================= */

const weeklyReportForm = document.getElementById("weeklyReportForm");

if (weeklyReportForm) {
    weeklyReportForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const student = getLoggedInStudent();

        if (!student) return;

        const weekStart = document.getElementById("weekStart").value;
        const weekEnd = document.getElementById("weekEnd").value;
        const narrative = document.getElementById("weeklyNarrative").value.trim();
        const pictureInput = document.getElementById("weeklyPictures");
        const files = Array.from(pictureInput.files);

        if (!weekStart || !weekEnd || !narrative) {
            showMessage("weeklyReportMessage", "Please complete all weekly report fields.", "error");
            return;
        }

        if (weekEnd < weekStart) {
            showMessage("weeklyReportMessage", "Week End Date must not be earlier than Week Start Date.", "error");
            return;
        }

        if (files.length < 5) {
            showMessage("weeklyReportMessage", "Please upload at least five pictures.", "error");
            return;
        }

        const oversizedFile = files.find(file => file.size > 200 * 1024);

        if (oversizedFile) {
            showMessage("weeklyReportMessage", "Each picture must not exceed 200 KB.", "error");
            return;
        }

        const invalidFile = files.find(file => !file.type.startsWith("image/"));

        if (invalidFile) {
            showMessage("weeklyReportMessage", "Please upload image files only.", "error");
            return;
        }

        const weeklyReports = getData("ojtWeeklyReports");

        const duplicate = weeklyReports.some(report =>
            report.studentNumber === student.number &&
            report.weekStart === weekStart &&
            report.weekEnd === weekEnd
        );

        if (duplicate) {
            showMessage("weeklyReportMessage", "You have already submitted a report for this date range.", "error");
            return;
        }

        try {
            const pictures = [];

            for (const file of files) {
                pictures.push({
                    name: file.name,
                    data: await readFile(file)
                });
            }

            weeklyReports.push({
                studentNumber: student.number,
                studentName: student.name,
                weekStart,
                weekEnd,
                narrative,
                pictures,
                dateSubmitted: new Date().toLocaleDateString()
            });

            saveData("ojtWeeklyReports", weeklyReports);

            weeklyReportForm.reset();

            showMessage("weeklyReportMessage", "Weekly narrative report submitted successfully.");

            displayStudentWeeklyReports(student);
            displayStudentProgress(student);
            displayProfessorDashboard();
        } catch (error) {
            showMessage("weeklyReportMessage", "Unable to upload weekly report pictures.", "error");
        }
    });
}

function displayStudentWeeklyReports(student) {
    const tbody = document.getElementById("studentWeeklyReportHistory");

    if (!tbody) return;

    const reports = getData("ojtWeeklyReports")
        .filter(report => report.studentNumber === student.number)
        .sort((a, b) => b.weekStart.localeCompare(a.weekStart));

    tbody.innerHTML = "";

    if (reports.length === 0) {
        addEmptyRow(tbody, 5, "No weekly reports submitted.");
        return;
    }

    reports.forEach(report => {
        const row = document.createElement("tr");

        addCell(row, report.weekStart);
        addCell(row, report.weekEnd);
        addCell(row, report.narrative);

        const pictureCell = document.createElement("td");
        const pictures = report.pictures || [];

        pictures.forEach((picture, index) => {
            const link = createDownloadLink(
                typeof picture === "string" ? picture : picture.data,
                typeof picture === "string" ? `picture-${index + 1}` : picture.name,
                `Picture ${index + 1}`
            );

            link.style.display = "block";
            pictureCell.appendChild(link);
        });

        row.appendChild(pictureCell);

        addCell(row, report.dateSubmitted || "-");

        tbody.appendChild(row);
    });
}

/* =========================================
   PROFESSOR WEEKLY REPORTS
========================================= */

function displayProfessorWeeklyReports() {
    const tbody = document.getElementById("professorWeeklyReportTableBody");

    if (!tbody) return;

    const reports = getData("ojtWeeklyReports");
    const students = getStudents();

    tbody.innerHTML = "";

    if (reports.length === 0) {
        addEmptyRow(tbody, 6, "No weekly reports submitted.");
        return;
    }

    reports.forEach(report => {
        const student = students.find(
            item => item.number === report.studentNumber
        );

        const row = document.createElement("tr");

        addCell(row, student ? student.name : report.studentName || "Unknown Student");
        addCell(row, report.weekStart);
        addCell(row, report.weekEnd);
        addCell(row, report.narrative);

        const pictureCell = document.createElement("td");
        const pictures = report.pictures || [];

        pictures.forEach((picture, index) => {
            const link = createDownloadLink(
                typeof picture === "string" ? picture : picture.data,
                typeof picture === "string" ? `picture-${index + 1}` : picture.name,
                `Picture ${index + 1}`
            );

            link.style.display = "block";
            pictureCell.appendChild(link);
        });

        row.appendChild(pictureCell);

        addCell(row, report.dateSubmitted || "-");

        tbody.appendChild(row);
    });
}

/* =========================================
   PROFESSOR EVALUATION FORM UPLOAD
========================================= */

const evaluationFormUpload = document.getElementById("evaluationFormUpload");

if (evaluationFormUpload) {
    evaluationFormUpload.addEventListener("submit", async function (event) {
        event.preventDefault();

        const title = document.getElementById("evaluationTitle").value.trim();
        const description = document.getElementById("evaluationDescription").value.trim();
        const fileInput = document.getElementById("evaluationFile");
        const file = fileInput.files[0];

        if (!title || !file) {
            showMessage("evaluationMessage", "Please enter a title and select an evaluation file.", "error");
            return;
        }

        const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png"
        ];

        if (!allowedTypes.includes(file.type)) {
            showMessage("evaluationMessage", "Only PDF, JPG, and PNG files are allowed.", "error");
            return;
        }

        if (file.size > 1024 * 1024) {
            showMessage("evaluationMessage", "File size must not exceed 1 MB.", "error");
            return;
        }

        try {
            const fileData = await readFile(file);
            const forms = getData("ojtEvaluationForms");

            forms.push({
                title,
                description,
                fileName: file.name,
                fileData,
                dateUploaded: new Date().toLocaleDateString()
            });

            saveData("ojtEvaluationForms", forms);

            evaluationFormUpload.reset();

            showMessage("evaluationMessage", "Evaluation form uploaded successfully.");

            displayProfessorEvaluationForms();
        } catch (error) {
            showMessage("evaluationMessage", "Unable to upload evaluation form.", "error");
        }
    });
}

/* =========================================
   PROFESSOR EVALUATION FORMS TABLE
========================================= */

function displayProfessorEvaluationForms() {
    const tbody = document.getElementById("professorEvaluationTable");

    if (!tbody) return;

    const forms = getData("ojtEvaluationForms");

    tbody.innerHTML = "";

    if (forms.length === 0) {
        addEmptyRow(tbody, 5, "No evaluation forms uploaded.");
        return;
    }

    forms.forEach((form, index) => {
        const row = document.createElement("tr");

        addCell(row, form.title);
        addCell(row, form.description || "-");

        const fileCell = document.createElement("td");

        if (form.fileData) {
            fileCell.appendChild(
                createDownloadLink(
                    form.fileData,
                    form.fileName || "evaluation-form",
                    "Download"
                )
            );
        } else {
            fileCell.textContent = "No file";
        }

        row.appendChild(fileCell);

        addCell(row, form.dateUploaded || "-");

        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete";
        deleteButton.className = "secondary-button";
        deleteButton.type = "button";

        deleteButton.addEventListener("click", function () {
            deleteEvaluationForm(index);
        });

        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        tbody.appendChild(row);
    });
}

function deleteEvaluationForm(index) {
    if (!confirm("Are you sure you want to delete this evaluation form?")) {
        return;
    }

    const forms = getData("ojtEvaluationForms");

    forms.splice(index, 1);

    saveData("ojtEvaluationForms", forms);

    displayProfessorEvaluationForms();
    displayStudentEvaluationForms();
}

/* =========================================
   STUDENT EVALUATION FORMS
========================================= */

function displayStudentEvaluationForms() {
    const tbody = document.getElementById("studentEvaluationTable");

    if (!tbody) return;

    const forms = getData("ojtEvaluationForms");

    tbody.innerHTML = "";

    if (forms.length === 0) {
        addEmptyRow(tbody, 4, "No evaluation forms are currently available.");
        return;
    }

    forms.forEach(form => {
        const row = document.createElement("tr");

        addCell(row, form.title);
        addCell(row, form.description || "-");

        const fileCell = document.createElement("td");

        if (form.fileData) {
            fileCell.appendChild(
                createDownloadLink(
                    form.fileData,
                    form.fileName || "evaluation-form",
                    "Download and Print"
                )
            );
        } else {
            fileCell.textContent = "No file";
        }

        row.appendChild(fileCell);

        addCell(row, form.dateUploaded || "-");

        tbody.appendChild(row);
    });
}

/* =========================================
   STUDENT PROGRESS
========================================= */

function displayStudentProgress(student) {
    const totalHours = getRenderedHours(student.number);

    const dailyReports = getData("ojtDailyReports").filter(
        report => report.studentNumber === student.number
    );

    const weeklyReports = getData("ojtWeeklyReports").filter(
        report => report.studentNumber === student.number
    );

    const requirements = getData("ojtRequirements").filter(
        requirement => requirement.studentNumber === student.number
    );

    const placement = getStudentPlacement(student.number);
    const requiredHours = Number(student.requiredHours || 0);

    const companyElement = document.getElementById("progressCompany");
    const hoursElement = document.getElementById("progressHours");
    const dailyElement = document.getElementById("progressDailyCount");
    const weeklyElement = document.getElementById("progressWeeklyCount");
    const requirementElement = document.getElementById("progressRequirementCount");
    const renderedElement = document.getElementById("renderedHours");

    if (companyElement) {
        companyElement.textContent =
            placement && placement.status === "Approved"
                ? placement.companyName
                : "Not yet approved";
    }

    if (hoursElement) hoursElement.textContent = formatHours(totalHours);
    if (dailyElement) dailyElement.textContent = dailyReports.length;
    if (weeklyElement) weeklyElement.textContent = weeklyReports.length;
    if (requirementElement) requirementElement.textContent = requirements.length;
    if (renderedElement) renderedElement.textContent = formatHours(totalHours);

    const requiredDisplay = document.getElementById("progressRequiredHours");
    const requiredHoursDisplay = document.getElementById("requiredHoursDisplay");
    const completedDisplay = document.getElementById("completedHours");
    const remainingDisplay = document.getElementById("remainingHours");
    const percentDisplay = document.getElementById("progressPercent");
    const progressBar = document.getElementById("progressBarFill");

    if (requiredDisplay) {
        requiredDisplay.textContent = requiredHours > 0
            ? requiredHours + " hours"
            : "Not yet set";
    }

    if (requiredHoursDisplay) {
        requiredHoursDisplay.textContent = requiredHours > 0
            ? requiredHours + " hours"
            : "Not yet set";
    }

    if (completedDisplay) {
        completedDisplay.textContent = formatHours(totalHours) + " hours";
    }

    if (requiredHours > 0) {
        const remaining = Math.max(requiredHours - totalHours, 0);
        const percentage = Math.min((totalHours / requiredHours) * 100, 100);

        if (remainingDisplay) {
            remainingDisplay.textContent = formatHours(remaining) + " hours";
        }

        if (percentDisplay) {
            percentDisplay.textContent = percentage.toFixed(1) + "%";
        }

        if (progressBar) {
            progressBar.style.width = percentage + "%";
        }

        const ojtStatus = document.getElementById("ojtStatus");

        if (ojtStatus && placement && placement.status === "Approved") {
            ojtStatus.textContent = totalHours >= requiredHours
                ? "Completed"
                : "Ongoing";
        }
    } else {
        if (remainingDisplay) remainingDisplay.textContent = "Not yet set";
        if (percentDisplay) percentDisplay.textContent = "0%";
        if (progressBar) progressBar.style.width = "0%";
    }
}

/* =========================================
   PROFESSOR STUDENT PROGRESS
========================================= */

function displayProfessorProgress() {
    const tbody = document.getElementById("professorProgressTable");

    if (!tbody) return;

    const students = getStudents().filter(
        student => student.status === "Approved"
    );

    tbody.innerHTML = "";

    if (students.length === 0) {
        addEmptyRow(tbody, 7, "No approved students found.");
        return;
    }

    students.forEach(student => {
        const placement = getStudentPlacement(student.number);

        const totalHours = getRenderedHours(student.number);

        const dailyCount = getData("ojtDailyReports").filter(
            report => report.studentNumber === student.number
        ).length;

        const weeklyCount = getData("ojtWeeklyReports").filter(
            report => report.studentNumber === student.number
        ).length;

        const requirementCount = getData("ojtRequirements").filter(
            requirement => requirement.studentNumber === student.number
        ).length;

        const row = document.createElement("tr");

        addCell(row, student.name);

        addCell(
            row,
            placement && placement.status === "Approved"
                ? placement.companyName
                : "Not approved"
        );

        addCell(row, formatHours(totalHours));
        addCell(row, Number(student.requiredHours || 0) > 0 ? student.requiredHours : "Not set");
        addCell(row, dailyCount);
        addCell(row, weeklyCount);
        addCell(row, requirementCount);

        tbody.appendChild(row);
    });
}

/* =========================================
   PROFESSOR MONITORING SUMMARY
========================================= */

function displayProfessorSummary() {
    const students = getStudents();

    const dailyReports = getData("ojtDailyReports");
    const weeklyReports = getData("ojtWeeklyReports");

    const totalHours = dailyReports.reduce(
        (total, report) => total + Number(report.renderedHours || 0),
        0
    );

    const totalHoursElement = document.getElementById("reportTotalHours");
    const dailyCountElement = document.getElementById("reportDailyCount");
    const weeklyCountElement = document.getElementById("reportWeeklyCount");
    const pendingReportsElement = document.getElementById("professorPendingReports");

    if (totalHoursElement) {
        totalHoursElement.textContent = formatHours(totalHours);
    }

    if (dailyCountElement) {
        dailyCountElement.textContent = dailyReports.length;
    }

    if (weeklyCountElement) {
        weeklyCountElement.textContent = weeklyReports.length;
    }

    if (pendingReportsElement) {
        pendingReportsElement.textContent = dailyReports.length + weeklyReports.length;
    }
}

/* =========================================
   PROFESSOR PRINT REPORT
========================================= */

const printReportButton = document.getElementById("printReportButton");

if (printReportButton) {
    printReportButton.addEventListener("click", function () {
        window.print();
    });
}

/* =========================================
   STORAGE EVENT REFRESH
========================================= */

window.addEventListener("storage", function (event) {
    if (!event.key) return;

    const refreshKeys = [
        "ojtStudents",
        "ojtPlacements",
        "ojtDailyReports",
        "ojtWeeklyReports",
        "ojtRequirements",
        "ojtEvaluationForms"
    ];

    if (!refreshKeys.includes(event.key)) return;

    if (document.getElementById("studentTableBody")) {
        displayStudents();
    }

    if (document.getElementById("professorStudentTableBody")) {
        displayProfessorDashboard();
    }

    if (document.getElementById("studentDashboard")) {
        const student = getLoggedInStudent();

        if (student) {
            displayStudentDashboard();
        }
    }
});

/* =========================================
   INITIAL PAGE SETUP
========================================= */

document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("professorStudentTableBody")) {
        const loggedInProfessor = JSON.parse(
            localStorage.getItem("loggedInProfessor")
        );

        if (loggedInProfessor) {
            displayProfessorDashboard();
        }
    }

    if (document.getElementById("studentDashboard")) {
        const student = getLoggedInStudent();

        if (student) {
            displayStudentDashboard();
        }
    }
});

