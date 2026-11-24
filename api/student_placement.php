
<?php
header("Content-Type: application/json");

require_once "../config/db.php";

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Invalid request method."
    ]);
    exit;
}

$studentId = (int)($_GET["student_id"] ?? 0);

if ($studentId <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid student ID."
    ]);
    exit;
}

try {
    $query = $conn->prepare("
        SELECT
            id,
            student_id,
            company_name,
            company_address,
            contact_person,
            contact_number,
            status,
            feedback,
            date_submitted,
            date_reviewed
        FROM company_placements
        WHERE student_id = ?
    ");

    $query->execute([$studentId]);

    $placement = $query->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "placement" => $placement ?: null
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to retrieve company placement."
    ]);
}
