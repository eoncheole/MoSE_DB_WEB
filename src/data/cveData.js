export const cveData = [
    {
        id: 'CVE-2024-3094',
        severity: 'Critical',
        score: 9.8,
        asset: 'Linux-Prod-01',
        desc: 'Malicious code was discovered in the upstream tarballs of xz, starting with version 5.6.0. Through a complex series of obfuscations, the liblzma build process extracts a prebuilt object file from a disguised test file.',
        script: 'sudo apt-get install --only-upgrade xz-utils\n# Verifying version...\nxz --version | grep "5.6.1"'
    },
    {
        id: 'CVE-2023-4863',
        severity: 'High',
        score: 8.8,
        asset: 'Web-Front-LB',
        desc: 'Heap buffer overflow in libwebp in Google Chrome prior to 116.0.5845.187 allowing a remote attacker to perform an out of bounds memory write via a crafted HTML page.',
        script: 'sudo apt-get update && sudo apt-get upgrade libwebp6\n# Restarting Nginx...\nsudo systemctl restart nginx'
    },
    {
        id: 'CVE-2024-21413',
        severity: 'Critical',
        score: 9.1,
        asset: 'Mail-Exchange',
        desc: 'Microsoft Outlook Remote Code Execution Vulnerability (Moniker Link). An attacker who successfully exploited this vulnerability could bypass the Office Protected View.',
        script: 'Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Office\\16.0\\Outlook\\Security" -Name "EnableUnsafeClientMailRules" -Value 0'
    },
    {
        id: 'CVE-2023-44487',
        severity: 'Medium',
        score: 5.4,
        asset: 'API-Gateway-04',
        desc: 'The HTTP/2 protocol allows a denial of service (server resource consumption) because request cancellation can reset many streams quickly.',
        script: '# Applying rate limit in config\nlimit_req_zone $binary_remote_addr zone=one:10m rate=100r/s;\n# Reloading proxy\nnginx -s reload'
    }
];