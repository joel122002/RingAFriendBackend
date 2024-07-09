function initializeSocket(io) {
    io.on('connection', (socket) => {
        const userId = socket?.request?.user?.username;

        socket.on('join', async function (room, cb) {
            await socket.join(room);
            cb();
            console.log(`${userId} joined room: ${room}`);
        });

        socket.on('leave', async function (room, cb) {
            await socket.leave(room);
            cb();
            console.log(`${userId} left room: ${room}`);
        });

        socket.on('messageToGroup', async function ({ room, message }, cb) {
            await socket.to(room).emit('messageToGroup', message);
            cb();
            console.log(`${userId} sent "${message}" to room: ${room}`);
        });

        socket.on('completion', async function ({ room, message }, cb) {
            await socket.to(room).emit('completion', message);
            cb();
            console.log(`${userId} sent "${message}" to room: ${room}`);
        });
    });
}

export default initializeSocket;
