<?php
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $db->prepare("SELECT * FROM events WHERE id = ?");
            $stmt->execute([$id]);
            $item = $stmt->fetch();
            if ($item) {
                echo json_encode(['success' => true, 'data' => $item]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Event not found']);
            }
        } else {
            $stmt = $db->query("SELECT * FROM events ORDER BY event_date ASC");
            $items = $stmt->fetchAll();
            echo json_encode(['success' => true, 'data' => $items]);
        }
        break;

    case 'POST':
        require_auth();
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare("INSERT INTO events (title, description, event_date, location) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $data['title'] ?? '',
            $data['description'] ?? '',
            $data['event_date'] ?? null,
            $data['location'] ?? ''
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
        $stmt = $db->prepare("UPDATE events SET title = ?, description = ?, event_date = ?, location = ? WHERE id = ?");
        $stmt->execute([
            $data['title'] ?? '',
            $data['description'] ?? '',
            $data['event_date'] ?? null,
            $data['location'] ?? '',
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
        $stmt = $db->prepare("DELETE FROM events WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true, 'data' => 'Deleted successfully']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        break;
}
