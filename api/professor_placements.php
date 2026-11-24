
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

try {
    $sql = "
        SELECT
            cp.id,
            cp.student_id,
            u.full_name,
            u.student_number,
            u.email,
            u.course_section,
            cp.company_name,
            cp.company_address,
            cp.contact_person,
            cp.contact_number,
            cp.status,
            cp.feedback,
            cp.date_submitted,
            cp.date_reviewed
        FROM company_placements cp
        INNER JOIN users u ON cp.student_id = u.id
        WHERE u.role = 'student'
          AND u.account_status = 'approved'
        ORDER BY cp.date_submitted DESC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $placements = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "placements" => $placements
    ]);

} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to retrieve company placements."
    ]);
}
?>
