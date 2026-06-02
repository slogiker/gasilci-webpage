<?php
// Prevent PHP from outputting raw HTML errors/warnings
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Custom exception handler to return JSON
set_exception_handler(function ($exception) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server Error: ' . $exception->getMessage()
    ]);
    exit;
});

// Convert PHP warnings, notices, and errors to exceptions
set_error_handler(function ($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/middleware/auth.php';

$requestUri = $_SERVER['REQUEST_URI'];
$basePath = '/api';

// Remove base path from URI
if (strpos($requestUri, $basePath) === 0) {
    $requestUri = substr($requestUri, strlen($basePath));
}

// Split path and remove query string
$path = parse_url($requestUri, PHP_URL_PATH);
$parts = explode('/', trim($path, '/'));

$resource = $parts[0] ?? '';
$id = $parts[1] ?? null;

$routeFile = __DIR__ . "/routes/{$resource}.php";

if ($resource && file_exists($routeFile)) {
    require_once $routeFile;
} else {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Endpoint not found']);
}
