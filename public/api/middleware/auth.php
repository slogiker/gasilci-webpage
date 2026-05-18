<?php
require_once __DIR__ . '/../config/config.php';

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

function generate_jwt($payload) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $base64UrlHeader = base64url_encode($header);
    $base64UrlPayload = base64url_encode(json_encode($payload));
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET, true);
    $base64UrlSignature = base64url_encode($signature);
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function validate_jwt($jwt) {
    $tokenParts = explode('.', $jwt);
    if (count($tokenParts) !== 3) {
        error_log("JWT Error: Invalid token parts count: " . count($tokenParts));
        return false;
    }

    $header = $tokenParts[0];
    $payload = $tokenParts[1];
    $signatureProvided = $tokenParts[2];

    $signature = hash_hmac('sha256', $header . "." . $payload, JWT_SECRET, true);
    $base64UrlSignature = base64url_encode($signature);

    if ($base64UrlSignature !== $signatureProvided) {
        error_log("JWT Error: Signature mismatch");
        return false;
    }

    $payloadDecoded = json_decode(base64url_decode($payload), true);
    if (isset($payloadDecoded['exp']) && $payloadDecoded['exp'] < time()) {
        error_log("JWT Error: Token expired. Exp: " . $payloadDecoded['exp'] . ", Now: " . time());
        return false;
    }

    return $payloadDecoded;
}

function get_auth_user() {
    $authHeader = null;
    
    // Try different possible sources for the Authorization header
    $sources = [
        'HTTP_AUTHORIZATION',
        'REDIRECT_HTTP_AUTHORIZATION',
        'Authorization'
    ];

    foreach ($sources as $source) {
        if (isset($_SERVER[$source])) {
            $authHeader = $_SERVER[$source];
            break;
        }
    }

    if (!$authHeader && function_exists('getallheaders')) {
        $headers = getallheaders();
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
        } elseif (isset($headers['authorization'])) {
            $authHeader = $headers['authorization'];
        }
    }

    if (!$authHeader && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
        }
    }
    
    if (!$authHeader) {
        // error_log("JWT Error: No Authorization header found in " . json_encode($_SERVER));
        return null;
    }

    $authHeader = trim($authHeader);
    if (preg_match('/Bearer\s(\S+)/i', $authHeader, $matches)) {
        return validate_jwt($matches[1]);
    }

    return null;
}

function require_auth() {
    $user = get_auth_user();
    if (!$user) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit;
    }
    return $user;
}
