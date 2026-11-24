
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

$studentId = (int)($data["student_id"] ?? 0);
$status = trim($data["status"] ?? "");
$feedback = trim($data["feedback"] ?? "");

if ($studentId <= 0 || !in_array($status, ["Approved", "Rejected"], true)) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid placement information."
    ]);
    exit;
}

if ($status === "Rejected" && $feedback === "") {
    echo json_encode([
        "success" => false,
        "message" => "Please provide a reason for rejection."
    ]);
    exit;
}

if ($status === "Approved") {
    $feedback = "";
}

try {
    $check = $conn->prepare("
        SELECT id
        FROM company_placements
        WHERE student_id = ?
    ");
    $check->execute([$studentId]);

    if (!$check->fetch()) {
        echo json_encode([
            "success" => false,
            "message" => "Company placement record not found."
        ]);
        exit;
    }

    $stmt = $conn->prepare("
        UPDATE company_placements
        SET status = ?,
            feedback = ?,
            date_reviewed = CURRENT_TIMESTAMP
        WHERE student_id = ?
    ");

    $stmt->execute([$status, $feedback, $studentId]);

    echo json_encode([
        "success" => true,
        "message" => "Company placement " . strtolower($status) . " successfully."
    ]);

} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to update placement status."
    ]);
}
?>
