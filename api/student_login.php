
<?php

session_start();

header("Content-Type: application/json");

require_once __DIR__ . "/../config/db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Invalid request method."
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid login data."
    ]);
    exit;
}

$email = strtolower(trim($data["email"] ?? ""));
$password = $data["password"] ?? "";

if ($email === "" || $password === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Please enter your email and password."
    ]);
    exit;
}

try {
    $sql = "SELECT
                id,
                full_name,
                student_number,
                email,
                course_section,
                password_hash,
                account_status
            FROM users
            WHERE email = :email
            AND role = 'student'
            LIMIT 1";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ":email" => $email
    ]);

    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student || !password_verify($password, $student["password_hash"])) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Invalid email or password."
        ]);
        exit;
    }

    if (strtolower($student["account_status"]) !== "approved") {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "Your account is still pending administrator approval."
        ]);
        exit;
    }

    // Create a new secure session ID
    session_regenerate_id(true);

    // Save authenticated student information
    $_SESSION["user_id"] = (int) $student["id"];
    $_SESSION["student_number"] = $student["student_number"];
    $_SESSION["role"] = "student";

    // Remove password hash before returning student information
    unset($student["password_hash"]);

    echo json_encode([
        "success" => true,
        "message" => "Login successful.",
        "student" => $student
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to process login. Please try again."
    ]);
}

?>
