// ブラウザ情報を取得
function getBrowserInfo() {
    const userAgent = navigator.userAgent;
    let browser = "Unknown";
    let version = "Unknown";
    
    // Chrome
    if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
        browser = "Chrome";
        const match = userAgent.match(/Chrome\/(\d+)/);
        if (match) version = match[1];
    }
    // Edge
    else if (userAgent.includes("Edg")) {
        browser = "Edge";
        const match = userAgent.match(/Edg\/(\d+)/);
        if (match) version = match[1];
    }
    // Firefox
    else if (userAgent.includes("Firefox")) {
        browser = "Firefox";
        const match = userAgent.match(/Firefox\/(\d+)/);
        if (match) version = match[1];
    }
    // Safari
    else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
        browser = "Safari";
        const match = userAgent.match(/Version\/(\d+)/);
        if (match) version = match[1];
    }
    
    return `${browser} ${version}`;
}

// オペレーティングシステムを取得
function getOS() {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes("Windows")) return "Windows";
    if (userAgent.includes("Mac")) return "macOS";
    if (userAgent.includes("Linux")) return "Linux";
    if (userAgent.includes("Android")) return "Android";
    if (userAgent.includes("iOS")) return "iOS";
    
    return "Unknown";
}

// 画面解像度を取得
function getScreenResolution() {
    return `${screen.width} x ${screen.height}`;
}

// 現在時刻を取得
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// IPアドレスを取得（複数のAPIを使用）
async function getIPAddress() {
    const apis = [
        'https://api.ipify.org?format=json',
        'https://api.myip.com',
        'https://api64.ipapi.com/api/check?access_key=test'
    ];
    
    for (const api of apis) {
        try {
            const response = await fetch(api, { 
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                timeout: 5000
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.ip || data.query || data.ip_address;
            }
        } catch (error) {
            console.log(`API ${api} failed:`, error);
            continue;
        }
    }
    
    throw new Error('All IP APIs failed');
}

// ISP情報を取得
async function getISPInfo(ip) {
    const apis = [
        `https://ipapi.co/${ip}/json/`,
        `https://ip-api.com/json/${ip}`,
        `https://api.ipgeolocation.io/ipgeo?apiKey=test&ip=${ip}`
    ];
    
    for (const api of apis) {
        try {
            const response = await fetch(api, { 
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                timeout: 5000
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // ipapi.co フォーマット
                if (data.org) {
                    return {
                        isp: data.org,
                        country: data.country_name,
                        region: data.region,
                        city: data.city
                    };
                }
                
                // ip-api.com フォーマット
                if (data.isp) {
                    return {
                        isp: data.isp,
                        country: data.country,
                        region: data.regionName,
                        city: data.city
                    };
                }
                
                // ipgeolocation.io フォーマット
                if (data.organization) {
                    return {
                        isp: data.organization,
                        country: data.country_name,
                        region: data.state_prov,
                        city: data.city
                    };
                }
            }
        } catch (error) {
            console.log(`ISP API ${api} failed:`, error);
            continue;
        }
    }
    
    throw new Error('All ISP APIs failed');
}

// 情報を表示
async function displayInfo() {
    // ブラウザ情報を表示
    const browserInfo = document.getElementById('browser-info');
    browserInfo.innerHTML = `
        <strong>ブラウザ:</strong> ${getBrowserInfo()}<br>
        <strong>OS:</strong> ${getOS()}<br>
        <strong>解像度:</strong> ${getScreenResolution()}<br>
        <strong>言語:</strong> ${navigator.language}
    `;
    
    // アクセス時刻を表示
    const accessTime = document.getElementById('access-time');
    accessTime.innerHTML = getCurrentTime();
    
    // IPアドレスを取得
    const ipAddress = document.getElementById('ip-address');
    try {
        const ip = await getIPAddress();
        ipAddress.innerHTML = ip;
        
        // ISP情報を取得
        const ispInfo = document.getElementById('isp-info');
        try {
            const ispData = await getISPInfo(ip);
            ispInfo.innerHTML = `
                <strong>ISP:</strong> ${ispData.isp || 'Unknown'}<br>
                <strong>国:</strong> ${ispData.country || 'Unknown'}<br>
                <strong>地域:</strong> ${ispData.region || 'Unknown'}<br>
                <strong>都市:</strong> ${ispData.city || 'Unknown'}
            `;
        } catch (error) {
            console.error('ISP info error:', error);
            ispInfo.innerHTML = '<div class="error">ISP情報の取得に失敗しました</div>';
        }
    } catch (error) {
        console.error('IP address error:', error);
        ipAddress.innerHTML = '<div class="error">IPアドレスの取得に失敗しました</div>';
        
        const ispInfo = document.getElementById('isp-info');
        ispInfo.innerHTML = '<div class="error">IPアドレスが取得できないためISP情報も表示できません</div>';
    }
}

// ページ読み込み時に情報を表示
window.addEventListener('load', displayInfo);

// 5秒ごとに時刻を更新
setInterval(() => {
    const accessTime = document.getElementById('access-time');
    accessTime.innerHTML = getCurrentTime();
}, 5000);
