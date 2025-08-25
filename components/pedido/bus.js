const streams = new Map();

function addClient(pedidoId, res) {
  if (!streams.has(pedidoId)) streams.set(pedidoId, new Set());
  streams.get(pedidoId).add(res);
  res.on('close', () => streams.get(pedidoId)?.delete(res));
}

function publish(pedidoId, data) {
  const set = streams.get(pedidoId);
  if (!set) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of set) res.write(payload);
}

module.exports = { addClient, publish };
