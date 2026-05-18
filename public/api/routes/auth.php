<?php
// Since this is included from index.php, we have access to $parts and $id
$action = $parts[1] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    $login = $data['email'] ?? ''; // This can be email or username
    $password = $data['password'] ?? '';

    $stmt = $db->prepare("SELECT * FROM users WHERE email = ? OR username = ?");
    $stmt->execute([$login, $login]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Uporabnik ne obstaja']);
        exit;
    }

    if (password_verify($password, $user['password'])) {
        $payload = [
            'userId' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'] ?? 'admin',
            'exp' => time() + (60 * 60 * 24 * 7) // 7 days
        ];
        $token = generate_jwt($payload);
        echo json_encode([
            'success' => true, 
            'token' => $token,
            'role' => $user['role'] ?? 'admin'
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Napačno geslo']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed or invalid action']);
}
