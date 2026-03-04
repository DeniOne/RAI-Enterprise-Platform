import axios from 'axios';

async function smokeTest() {
  const API_URL = 'http://localhost:4000/api';
  const token = 'YOUR_DEBUG_TOKEN'; // В dev-режиме может быть пропущено если Guard отключен

  console.log('--- TechMap Smoke Test ---');

  try {
    // 1. Список всех карт
    const list = await axios.get(`${API_URL}/tech-map`);
    console.log('✅ TechMaps count:', list.data.length);

    // 2. Если есть хоть одна, берем её DAG
    if (list.data.length > 0) {
      const tmId = list.data[0].id;
      const details = await axios.get(`${API_URL}/tech-map/${tmId}`);
      console.log('✅ TechMap ID:', tmId);
      console.log('✅ Status:', details.data.status);
      console.log('✅ Operations count:', details.data.operations?.length || 0);
    }
  } catch (e) {
    console.error('❌ Smoke test failed. API might be down or Auth failed.');
    console.error(e.message);
  }
}

smokeTest();
