import asyncio
import websockets
import aiohttp
from aiohttp import web

# WebSocket handler
connected_clients = set()

async def websocket_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    connected_clients.add(ws)
    print("Novo cliente conectado")

    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                print("Recebido:", msg.data)

                # Reencaminha para os outros clientes (ex: navegador)
                for client in connected_clients:
                    if client is not ws:
                        await client.send_str(msg.data)

            elif msg.type == web.WSMsgType.ERROR:
                print("Erro:", ws.exception())
    finally:
        connected_clients.remove(ws)
        print("Cliente desconectado")

    return ws

async def index_handler(request):
    return web.FileResponse('index.html')

async def js_handler(request):
    return web.FileResponse('script.js')

app = web.Application()
app.router.add_get('/', index_handler)
app.router.add_get('/script.js', js_handler)
app.router.add_get('/ws', websocket_handler)

import os
port = int(os.environ.get("PORT", 8080))
web.run_app(app, host='0.0.0.0', port=port)
