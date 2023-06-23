const logger = require('./helpers/logger.helpers')

const server = require('http').createServer()
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

const nodes = []
const clients = []

io.on('connection', (client) => {
  logger.info(`> ${client.id} connected`)

  client.on('disconnect', () => {
    logger.info(`> ${client.id} disconnected`)

    const nd = nodes.find((x) => x.clientId === client.id)
    if (nd) {
      io.to(nd.nodeId).emit('node_is_offline', {})
      nodes.splice(nodes.indexOf(nd), 1)
    }
    const cl = clients.find((x) => x.clientId === client.id)
    if (cl) {
      clients.splice(clients.indexOf(cl), 1)
    }
  })

  /* Terminal start/end the connection */
  client.on('check_node', (data) => {
    clients.push({
      clientId: client.id,
      nodeId: data.nodeId
    })
    client.join(data.nodeId)

    logger.info(`> ${client.id} check_node`)

    if (nodes.find((x) => x.nodeId === data.nodeId)) {
      io.to(client.id).emit('node_is_online', data)
    } else {
      io.to(client.id).emit('node_is_offline', data)
    }
  })

  /* Node */
  client.on('warmup', (data) => {
    logger.info(`> ${client.id} warmup - ${data.nodeId}`)
    nodes.push({
      clientId: client.id,
      nodeId: data.nodeId
    })
    io.to(data.nodeId).emit('node_is_online', data)
  })

  /* Receive a task */
  client.on('task', (data) => {
    logger.info(`> ${client.id} task`)

    const nd = nodes.find((x) => x.nodeId === data.nodeId)
    if (nd) {
      io.to(nd.clientId).emit('task', { ...data, source: client.id })
    }
  })

  client.on('task_result', (data) => {
    logger.info(`> ${client.id} task_result`)
    io.to(data.source).emit('task_result', data)
  })
})

server.listen(8080)
