
<?php
header("Content-Type: application/json");

require_once "../config/db.php";

try {
    $sql = "SELECT
                id,
                full_name,
                student_number,
                email,
                course_section,
                account_status,
                created_at
            FROM users
            WHERE role = 'student'
            ORDER BY created_at DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "students" => $students
    ]);

} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to load student records."
    ]);
}
?>
