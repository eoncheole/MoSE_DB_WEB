export const systemLogs = [
    { text: "Scanning port 443...", color: "text-gray-400" },
    { text: "Heuristic engine: Active", color: "text-gray-300", highlight: "Active", highlightColor: "text-green-400" },
    { text: "Packet loss detected on Node-4", color: "text-orange-400" },
    { text: "Auto-patch verifying...", color: "text-blue-400" },
    { text: "Threat neutralized: IP 192.168.x.x", color: "text-gray-400", highlight: "IP 192.168.x.x", highlightColor: "text-gray-100" }
];

export const globalLogs = [
    { text: "Syncing with NVD Database...", color: "text-blue-400", highlight: "NVD Database", highlightColor: "text-blue-300" },
    { text: "New CVE detected: CVE-2025-1023 (Critical)", color: "text-red-400" },
    { text: "Analyzing zero-day candidate...", color: "text-purple-300" },
    { text: "MITRE ATT&CK update received: v14.1", color: "text-green-300" },
    { text: "Global threat level: Elevated", color: "text-gray-300", highlight: "Elevated", highlightColor: "text-orange-400" }
];
