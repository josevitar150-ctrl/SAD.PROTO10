
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
$companyName = trim($data["company_name"] ?? "");
$companyAddress = trim($data["company_address"] ?? "");
$contactPerson = trim($data["contact_person"] ?? "");
$contactNumber = trim($data["contact_number"] ?? "");

if (
    $studentId <= 0 ||
    $companyName === "" ||
    $companyAddress === "" ||
    $contactPerson === "" ||
    $contactNumber === ""
) {
    echo json_encode([
        "success" => false,
        "message" => "Please complete all placement fields."
    ]);
    exit;
}

try {
    // Confirm that this is an approved student account.
    $studentQuery = $conn->prepare("
        SELECT id
        FROM users
        WHERE id = ?
          AND role = 'student'
          AND account_status = 'approved'
    ");
    $studentQuery->execute([$studentId]);

    if (!$studentQuery->fetch()) {
        echo json_encode([
            "success" => false,
            "message" => "Student account not found or not approved."
        ]);
        exit;
    }

    // Check if the student already has a placement.
    $placementQuery = $conn->prepare("
        SELECT status
        FROM company_placements
        WHERE student_id = ?
    ");
    $placementQuery->execute([$studentId]);
    $existingPlacement = $placementQuery->fetch(PDO::FETCH_ASSOC);

    if ($existingPlacement) {
        if (strtolower($existingPlacement["status"]) !== "rejected") {
            echo json_encode([
                "success" => false,
                "message" => "You already have a placement submission awaiting review or approved."
            ]);
            exit;
        }

        // Allow resubmission only if the previous placement was rejected.
        $query = $conn->prepare("
            UPDATE company_placements
            SET company_name = ?,
                company_address = ?,
                contact_person = ?,
                contact_number = ?,
                status = 'Pending',
                feedback = NULL,
                date_submitted = CURRENT_TIMESTAMP,
                date_reviewed = NULL
            WHERE student_id = ?
        ");

        $query->execute([
            $companyName,
            $companyAddress,
            $contactPerson,
            $contactNumber,
            $studentId
        ]);
    } else {
        $query = $conn->prepare("
            INSERT INTO company_placements
            (student_id, company_name, company_address, contact_person, contact_number)
            VALUES (?, ?, ?, ?, ?)
        ");

        $query->execute([
            $studentId,
            $companyName,
            $companyAddress,
            $contactPerson,
            $contactNumber
        ]);
    }

    echo json_encode([
        "success" => true,
        "message" => "Company placement submitted successfully. Waiting for professor review."
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to submit company placement."
    ]);
}
