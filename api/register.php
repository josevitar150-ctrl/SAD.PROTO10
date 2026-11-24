
<?php

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
        "message" => "Invalid registration data."
    ]);
    exit;
}

$name = trim($data["name"] ?? "");
$number = trim($data["number"] ?? "");
$email = strtolower(trim($data["email"] ?? ""));
$course = trim($data["course"] ?? "");
$password = $data["password"] ?? "";

if (!$name || !$number || !$email || !$course || !$password) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Please complete all required fields."
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Please enter a valid email address."
    ]);
    exit;
}

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Password must contain at least 6 characters."
    ]);
    exit;
}

try {
    $check = $conn->prepare(
        "SELECT id FROM users
         WHERE student_number = ? OR email = ?
         LIMIT 1"
    );

    $check->execute([$number, $email]);

    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "Student number or email is already registered."
        ]);
        exit;
    }

    $conn->beginTransaction();

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $insertUser = $conn->prepare(
        "INSERT INTO users
         (full_name, student_number, email, course_section,
          password_hash, role, account_status)
         VALUES (?, ?, ?, ?, ?, 'student', 'pending')"
    );

    $insertUser->execute([
        $name,
        $number,
        $email,
        $course,
        $passwordHash
    ]);

    $userId = $conn->lastInsertId();

    $insertProfile = $conn->prepare(
        "INSERT INTO student_profiles
         (user_id, required_hours)
         VALUES (?, 0)"
    );

    $insertProfile->execute([$userId]);

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Registration submitted successfully. Please wait for administrator approval."
    ]);

} catch (PDOException $e) {

    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to process registration. Please try again."
    ]);
}

?>
