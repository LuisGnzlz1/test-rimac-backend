
export const responseToJson = (code: number, body: unknown) => ({
    statusCode: code,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
});

export function ok(body: unknown) {
    return responseToJson(200, body);
}

export function created(body: unknown) {
    return responseToJson(201, body);
}

export function badRequest(message: string) {
    return responseToJson(400, { error: 'Validation Error', message});
}

export function notFound(message = '') {
    return responseToJson(404, { error: 'Not Found', message});
}

export function internalError(message = 'An unexpected error occurred') {
    return responseToJson(500, { error: 'Internal Server Error', message});
}