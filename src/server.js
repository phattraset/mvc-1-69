'use strict';

const { createApp } = require('./app');

const preferredPort = Number(process.env.PORT || 3000);
const { server } = createApp();

if (!Number.isInteger(preferredPort) || preferredPort < 1 || preferredPort > 65535) {
  console.error(`PORT ไม่ถูกต้อง: ${process.env.PORT}`);
  process.exitCode = 1;
} else {
  listenOnAvailablePort(preferredPort);
}

function listenOnAvailablePort(port, attemptsLeft = 20) {
  const onListening = () => {
    server.removeListener('error', onError);
    const activePort = server.address().port;
    console.log('\nLadkrabang\'s Got Talent พร้อมใช้งาน');
    console.log(`เปิดเว็บได้ที่: http://localhost:${activePort}\n`);
  };

  const onError = (error) => {
    server.removeListener('listening', onListening);
    if (error.code === 'EADDRINUSE' && attemptsLeft > 1) {
      const nextPort = port + 1;
      console.warn(`พอร์ต ${port} ถูกใช้งานอยู่ กำลังลองพอร์ต ${nextPort}...`);
      listenOnAvailablePort(nextPort, attemptsLeft - 1);
      return;
    }
    console.error(`ไม่สามารถเปิดเซิร์ฟเวอร์ได้: ${error.message}`);
    process.exitCode = 1;
  };

  server.once('error', onError);
  server.once('listening', onListening);
  server.listen(port);
}
