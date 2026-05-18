<?php
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM members WHERE id = ?");
            $stmt->execute([$id]);
            $item = $stmt->fetch();
            if ($item) {
                echo json_encode(['success' => true, 'data' => $item]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Member not found']);
            }
        } else {
            $stmt = $db->query("SELECT * FROM members ORDER BY name ASC");
            $items = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $items]);
        }
        break;

    case 'POST':
        require_auth();
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare("INSERT INTO members (name, rank, role, image) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $data['name'] ?? '',
            $data['rank'] ?? '',
            $data['role'] ?? '',
            $data['image'] ?? null
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
        $stmt = $db->prepare("UPDATE members SET name = ?, rank = ?, role = ?, image = ? WHERE id = ?");
        $stmt->execute([
            $data['name'] ?? '',
            $data['rank'] ?? '',
            $data['role'] ?? '',
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
        $stmt = $db->prepare("DELETE FROM members WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true, 'data' => 'Deleted successfully']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        break;
}
