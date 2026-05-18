<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $name = $data['name'] ?? '';
    $email = $data['email'] ?? '';
    $phone = $data['phone'] ?? '';
    $message = $data['message'] ?? '';

    if (empty($name) || empty($email)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Ime in email sta obvezna']);
        exit;
    }

    // Save to DB
    $stmt = $db->prepare("INSERT INTO applications (name, email, phone, message) VALUES (?, ?, ?, ?)");
    $stmt->execute([$name, $email, $phone, $message]);

    // Send email
    $to = CONTACT_EMAIL;
    $subject = "Nova prijava za članstvo: $name";
    $headers = "From: $email\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "Content-Type: text/plain; charset=utf-8\r\n";
    
    $emailBody = "Nova prijava za članstvo\n\n";
    $emailBody .= "Ime: $name\n";
    $emailBody .= "Email: $email\n";
    $emailBody .= "Telefon: $phone\n\n";
    $emailBody .= "Sporočilo/Motivacija:\n$message";

    @mail($to, $subject, $emailBody, $headers);

    echo json_encode(['success' => true, 'message' => 'Prijava uspešno oddana']);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
