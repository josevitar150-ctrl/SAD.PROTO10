<?php
header("Content-Type: application/json");

require_once "../config/db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Invalid request method."
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$studentId = $data["id"] ?? null;

if (!$studentId || !filter_var($studentId, FILTER_VALIDATE_INT)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid student ID."
    ]);
    exit;
}

try {
    $sql = "UPDATE users
            SET account_status = 'approved'
            WHERE id = :id
            AND role = 'student'
            AND account_status = 'pending'";

    $stmt = $conn->prepare($sql);
    $stmt->execute([":id" => $studentId]);

    if ($stmt->rowCount() > 0) {
        echo json_encode([
            "success" => true,
            "message" => "Student account approved successfully."
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Student was not found or is already approved."
        ]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to approve student account."
    ]);
}
?>