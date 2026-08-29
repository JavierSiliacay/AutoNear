/**
 * TaraFix High-Concurrency Load & Stress Testing Script
 */

async function getLiveTargetUrl() {
  if (process.env.TEST_URL) return process.env.TEST_URL;
  const ports = [3000, 3001, 3002];
  for (const port of ports) {
    try {
      const res = await fetch(`http://localhost:${port}/api/mechanics`, { method: "HEAD" });
      if (res.ok || res.status === 429) {
        return `http://localhost:${port}/api/mechanics`;
      }
    } catch (_) {}
  }
  return "http://localhost:3000/api/mechanics";
}

let TARGET_URL = "http://localhost:3000/api/mechanics";
const TOTAL_REQUESTS = parseInt(process.env.TOTAL_REQUESTS || "5000", 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || "50", 10);

interface StressTestMetrics {
  total: number;
  successful: number;
  rateLimited: number;
  failed: number;
  statusCodes: Record<number, number>;
  latencies: number[];
  startTime: number;
  endTime: number;
}

async function runWorker(
  workerId: number,
  requestsPerWorker: number,
  metrics: StressTestMetrics,
  onProgress: (count: number) => void
) {
  for (let i = 0; i < requestsPerWorker; i++) {
    const t0 = performance.now();
    try {
      const res = await fetch(TARGET_URL, {
        headers: {
          "User-Agent": `TaraFix-Stress-Tester-Worker-${workerId}`,
          "Accept": "application/json"
        }
      });
      const t1 = performance.now();
      const duration = t1 - t0;
      
      metrics.latencies.push(duration);
      metrics.statusCodes[res.status] = (metrics.statusCodes[res.status] || 0) + 1;

      if (res.status === 200) {
        metrics.successful++;
      } else if (res.status === 429) {
        metrics.rateLimited++;
      } else {
        metrics.failed++;
      }
    } catch (err: any) {
      const t1 = performance.now();
      metrics.latencies.push(t1 - t0);
      metrics.failed++;
      metrics.statusCodes[0] = (metrics.statusCodes[0] || 0) + 1;
    }
    onProgress(1);
  }
}

async function startStressTest() {
  TARGET_URL = await getLiveTargetUrl();
  console.log("\n=======================================================");
  console.log("  🚀 TARAFIX HIGH-CONCURRENCY SERVER LOAD TESTER");
  console.log("=======================================================");
  console.log(`🎯 Target Endpoint   : ${TARGET_URL}`);
  console.log(`📦 Total Requests    : ${TOTAL_REQUESTS.toLocaleString()}`);
  console.log(`⚡ Concurrency Pool  : ${CONCURRENCY} workers`);
  console.log("-------------------------------------------------------\n");

  const metrics: StressTestMetrics = {
    total: TOTAL_REQUESTS,
    successful: 0,
    rateLimited: 0,
    failed: 0,
    statusCodes: {},
    latencies: [],
    startTime: performance.now(),
    endTime: 0
  };

  let completedCount = 0;
  const requestsPerWorker = Math.floor(TOTAL_REQUESTS / CONCURRENCY);

  const progressInterval = setInterval(() => {
    const elapsedSec = ((performance.now() - metrics.startTime) / 1000).toFixed(1);
    const percent = ((completedCount / TOTAL_REQUESTS) * 100).toFixed(1);
    const currentRps = (completedCount / (parseFloat(elapsedSec) || 1)).toFixed(0);
    process.stdout.write(
      `\r⏳ Progress: [${percent}%] (${completedCount.toLocaleString()}/${TOTAL_REQUESTS.toLocaleString()}) | Elapsed: ${elapsedSec}s | Current: ${currentRps} req/s`
    );
  }, 200);

  const workers = [];
  for (let w = 0; w < CONCURRENCY; w++) {
    workers.push(
      runWorker(w, requestsPerWorker, metrics, (n) => {
        completedCount += n;
      })
    );
  }

  await Promise.all(workers);
  clearInterval(progressInterval);
  metrics.endTime = performance.now();

  printDetailedReport(metrics);
}

function printDetailedReport(metrics: StressTestMetrics) {
  const totalTimeSeconds = (metrics.endTime - metrics.startTime) / 1000;
  const throughputRps = (metrics.latencies.length / totalTimeSeconds).toFixed(2);
  
  metrics.latencies.sort((a, b) => a - b);
  const total = metrics.latencies.length;
  const sum = metrics.latencies.reduce((acc, v) => acc + v, 0);
  const avg = (sum / total).toFixed(2);
  const min = metrics.latencies[0]?.toFixed(2) || "0";
  const max = metrics.latencies[total - 1]?.toFixed(2) || "0";
  const p50 = metrics.latencies[Math.floor(total * 0.50)]?.toFixed(2) || "0";
  const p90 = metrics.latencies[Math.floor(total * 0.90)]?.toFixed(2) || "0";
  const p95 = metrics.latencies[Math.floor(total * 0.95)]?.toFixed(2) || "0";
  const p99 = metrics.latencies[Math.floor(total * 0.99)]?.toFixed(2) || "0";

  console.log("\n\n=======================================================");
  console.log("  📊 DETAILED BENCHMARK & SERVER RESILIENCE REPORT");
  console.log("=======================================================");
  console.log(`⏱️  Total Duration       : ${totalTimeSeconds.toFixed(2)} seconds`);
  console.log(`🚀 Throughput (RPS)     : ${throughputRps} requests/second`);
  console.log(`📦 Completed Requests   : ${total.toLocaleString()}`);
  console.log("-------------------------------------------------------");
  console.log("📶 STATUS CODES BREAKDOWN:");
  for (const [code, count] of Object.entries(metrics.statusCodes)) {
    const codeName = 
      code === "200" ? "200 OK (Cache / DB)" :
      code === "429" ? "429 Too Many Requests (Rate Limiter)" :
      code === "0" ? "Connection Refused / Timeout" :
      `${code} Other`;
    const pct = ((count / total) * 100).toFixed(1);
    console.log(`   • ${codeName.padEnd(42)}: ${count.toLocaleString().padStart(8)} (${pct}%)`);
  }
  console.log("-------------------------------------------------------");
  console.log("⚡ RESPONSE LATENCIES (Round Trip Time):");
  console.log(`   • Minimum Latency     : ${min} ms`);
  console.log(`   • Average Latency     : ${avg} ms`);
  console.log(`   • 50th Percentile (p50): ${p50} ms`);
  console.log(`   • 90th Percentile (p90): ${p90} ms`);
  console.log(`   • 95th Percentile (p95): ${p95} ms`);
  console.log(`   • 99th Percentile (p99): ${p99} ms`);
  console.log(`   • Maximum Latency     : ${max} ms`);
  console.log("=======================================================\n");

  if (metrics.failed === 0) {
    console.log("✅ SERVER STATUS: ROCK SOLID (0% Connection Drops / Server Crashes)");
  } else {
    console.log(`⚠️ SERVER STATUS: ${metrics.failed} requests encountered network drops.`);
  }
  console.log("=======================================================\n");
}

startStressTest();
