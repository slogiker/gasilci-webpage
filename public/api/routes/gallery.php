<?php
$method = $_SERVER['REQUEST_METHOD'];

function resizeImage($sourcePath, $destPath, $maxWidth = 1200) {
    list($width, $height, $type) = getimagesize($sourcePath);
    
    if ($width <= $maxWidth) {
        copy($sourcePath, $destPath);
        return true;
    }

    $ratio = $maxWidth / $width;
    $newWidth = $maxWidth;
    $newHeight = $height * $ratio;

    $srcImage = null;
    switch ($type) {
        case IMAGETYPE_JPEG: $srcImage = imagecreatefromjpeg($sourcePath); break;
        case IMAGETYPE_PNG: $srcImage = imagecreatefrompng($sourcePath); break;
        case IMAGETYPE_GIF: $srcImage = imagecreatefromgif($sourcePath); break;
        case IMAGETYPE_WEBP: $srcImage = imagecreatefromwebp($sourcePath); break;
    }

    if (!$srcImage) return false;

    $destImage = imagecreatetruecolor($newWidth, $newHeight);
    
    // Handle transparency for PNG/GIF
    if ($type == IMAGETYPE_PNG || $type == IMAGETYPE_GIF) {
        imagealphablending($destImage, false);
        imagesavealpha($destImage, true);
        $transparent = imagecolorallocatealpha($destImage, 255, 255, 255, 127);
        imagefilledrectangle($destImage, 0, 0, $newWidth, $newHeight, $transparent);
    }

    imagecopyresampled($destImage, $srcImage, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

    switch ($type) {
        case IMAGETYPE_JPEG: imagejpeg($destImage, $destPath, 85); break;
        case IMAGETYPE_PNG: imagepng($destImage, $destPath); break;
        case IMAGETYPE_GIF: imagegif($destImage, $destPath); break;
        case IMAGETYPE_WEBP: imagewebp($destImage, $destPath, 85); break;
    }

    imagedestroy($srcImage);
    imagedestroy($destImage);
    return true;
}

switch ($method) {
    case 'GET':
        $stmt = $db->query("SELECT * FROM gallery ORDER BY created_at DESC");
        $items = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $items]);
        break;

    case 'POST':
        require_auth();
        
        if (!isset($_FILES['image'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No image uploaded']);
            break;
        }

        $file = $_FILES['image'];
        $title = $_POST['title'] ?? '';
        $category = $_POST['category'] ?? '';

        if ($file['size'] > MAX_UPLOAD_SIZE) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'File too large']);
            break;
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid() . '.' . $ext;
        $targetPath = UPLOAD_DIR . $filename;

        if (resizeImage($file['tmp_name'], $targetPath)) {
            $stmt = $db->prepare("INSERT INTO gallery (title, image_path, category) VALUES (?, ?, ?)");
            $stmt->execute([$title, 'api/uploads/' . $filename, $category]);
            echo json_encode(['success' => true, 'data' => ['id' => $db->lastInsertId()]]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to process image']);
        }
        break;

    case 'DELETE':
        require_auth();
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Missing ID']);
            break;
        }

        $stmt = $db->prepare("SELECT image_path FROM gallery WHERE id = ?");
        $stmt->execute([$id]);
        $item = $stmt->fetch();

        if ($item) {
            $fullPath = __DIR__ . '/../../' . $item['image_path'];
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }
            $stmt = $db->prepare("DELETE FROM gallery WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'data' => 'Deleted successfully']);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Image not found']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        break;
}
