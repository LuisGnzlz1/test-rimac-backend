import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Handler simplificado para servir Swagger UI en /doc
 */
export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const domain = event.requestContext.domainName;
    const stage  = (event.requestContext as any).stage;
    const apiUrl = stage && stage !== '$default'
        ? `https://${domain}/${stage}`
        : `https://${domain}`;

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Appointment API - Swagger</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css">
    <style>
        body { margin: 0; padding: 0; }
        .topbar { display: none; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const spec = {
                openapi: '3.0.3',
                info: {
                    title: 'Appointment API',
                    version: '1.0.0',
                    description: 'API para gestión de agendamientos'
                },
                servers: [{ url: '${apiUrl}' }],
                paths: {
                    '/appointments': {
                        post: {
                            tags: ['Appointments'],
                            summary: 'Crear agendamiento',
                            requestBody: {
                                required: true,
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            required: ['insuredId', 'scheduleId', 'countryISO'],
                                            properties: {
                                                insuredId: { 
                                                    type: 'string', 
                                                    example: '00123',
                                                    description: 'Código del asegurado (5 dígitos)'
                                                },
                                                scheduleId: { 
                                                    type: 'integer', 
                                                    example: 100,
                                                    description: 'ID del espacio de agendamiento'
                                                },
                                                countryISO: { 
                                                    type: 'string', 
                                                    enum: ['PE', 'CL'],
                                                    example: 'PE',
                                                    description: 'Código del país'
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            responses: {
                                '201': {
                                    description: 'Agendamiento creado',
                                    content: {
                                        'application/json': {
                                            schema: {
                                                type: 'object',
                                                properties: {
                                                    message: { type: 'string' },
                                                    data: {
                                                        type: 'object',
                                                        properties: {
                                                            id: { type: 'string' },
                                                            insuredId: { type: 'string' },
                                                            scheduleId: { type: 'integer' },
                                                            countryISO: { type: 'string' },
                                                            status: { type: 'string' },
                                                            createdAt: { type: 'string' }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                '400': { description: 'Error de validación' }
                            }
                        }
                    },
                    '/appointments/{insuredId}': {
                        get: {
                            tags: ['Appointments'],
                            summary: 'Listar agendamientos',
                            parameters: [{
                                name: 'insuredId',
                                in: 'path',
                                required: true,
                                schema: { type: 'string' },
                                example: '00123',
                                description: 'Código del asegurado'
                            }],
                            responses: {
                                '200': {
                                    description: 'Lista de agendamientos',
                                    content: {
                                        'application/json': {
                                            schema: {
                                                type: 'object',
                                                properties: {
                                                    insuredId: { type: 'string' },
                                                    total: { type: 'integer' },
                                                    appointments: {
                                                        type: 'array',
                                                        items: {
                                                            type: 'object',
                                                            properties: {
                                                                id: { type: 'string' },
                                                                insuredId: { type: 'string' },
                                                                scheduleId: { type: 'integer' },
                                                                countryISO: { type: 'string' },
                                                                status: { type: 'string' },
                                                                createdAt: { type: 'string' },
                                                                updatedAt: { type: 'string' }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            };

            SwaggerUIBundle({
                spec: spec,
                dom_id: '#swagger-ui',
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                layout: "BaseLayout",
                tryItOutEnabled: true
            });
        };
    </script>
</body>
</html>
  `;

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache',
        },
        body: html,
    };
};