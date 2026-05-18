<?php
require_auth();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['image'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No image uploaded']);
        exit;
    }

    $file = $_FILES['image'];
    
    if ($file['size'] > MAX_UPLOAD_SIZE) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'File too large']);
        exit;
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '.' . $ext;
    $targetPath = UPLOAD_DIR . $filename;

    // Use the resize function from gallery if available, or just move it
    // For simplicity, let's just move it for now, but in a real app we'd want to resize
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        echo json_encode(['success' => true, 'data' => ['url' => 'api/uploads/' . $filename]]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to save image']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}
