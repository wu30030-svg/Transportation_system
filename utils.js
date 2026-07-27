/**
 * 戰略中心 - 路線監視面板系統 (v1.6.0)
 * 檔案 2: utils.js - 智慧輔助工具
 */
/**
 * 智慧防快取網址解析工具 (防止雙問號導致 400 Bad Request)
 * 確保在影像網址尾端加上時間戳記時，符合標準 URL 參數串接規範
 */
function getCacheBusterUrl(url) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
}

// 綁定至 window 以供全域存取
window.getCacheBusterUrl = getCacheBusterUrl;