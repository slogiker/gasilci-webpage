<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $name = $data['name'] ?? '';
    $email = $data['email'] ?? '';
    $subject = $data['subject'] ?? 'Novo sporočilo s spletne strani';
    $message = $data['message'] ?? '';

    if (empty($name) || empty($email) || empty($message)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Vsa polja so obvezna']);
        exit;
    }

    // Save to DB
    $stmt = $db->prepare("INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)");
    $stmt->execute([$name, $email, $subject, $message]);

    // Send email
    $to = CONTACT_EMAIL;
    $headers = "From: $email\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "Content-Type: text/plain; charset=utf-8\r\n";
    
    $emailBody = "Ime: $name\n";
    $emailBody .= "Email: $email\n";
    $emailBody .= "Zadeva: $subject\n\n";
    $emailBody .= "Sporočilo:\n$message";

    @mail($to, $subject, $emailBody, $headers);

    echo json_encode(['success' => true, 'data' => 'Sporočilo poslano']);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
