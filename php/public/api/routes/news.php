<?php
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM news WHERE id = ?");
            $stmt->execute([$id]);
            $item = $stmt->fetch();
            if ($item) {
                echo json_encode(['success' => true, 'data' => $item]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'News not found']);
            }
        } else {
            $stmt = $db->query("SELECT * FROM news ORDER BY created_at DESC");
            $items = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $items]);
        }
        break;

    case 'POST':
        require_auth();
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare("INSERT INTO news (title, category, content, image, author_id) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['title'] ?? '',
            $data['category'] ?? 'Novice',
            $data['content'] ?? '',
            $data['image'] ?? null,
            get_auth_user()['id']
        ]);
        echo json_encode(['success' => true, 'data' => ['id' => $db->lastInsertId()]]);
        break;

    case 'PUT':
        require_auth();
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Missing ID']);
            break;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare("UPDATE news SET title = ?, category = ?, content = ?, image = ? WHERE id = ?");
        $stmt->execute([
            $data['title'] ?? '',
            $data['category'] ?? 'Novice',
            $data['content'] ?? '',
            $data['image'] ?? null,
            $id
        ]);
        echo json_encode(['success' => true, 'data' => 'Updated successfully']);
        break;

    case 'DELETE':
        require_auth();
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Missing ID']);
            break;
        }
        $stmt = $db->prepare("DELETE FROM news WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true, 'data' => 'Deleted successfully']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        break;
}
