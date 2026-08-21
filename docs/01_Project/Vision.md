# 運輸戰略中心 V2.0
# Mission-Oriented Transportation Center

- Version（版本）：2.0
- Status（狀態）：Approved（已核定）
- Document Type（文件類型）：Project Vision（專案願景）
- Last Updated（最後更新）：2026-08-08

---

## 1. Project Vision（專案願景）

本專案正式定位為：

> **運輸戰略中心（Mission-Oriented Transportation Center）**

本系統不再以「Google Maps + CCTV」作為核心定位。

核心概念：

> **Mission（任務）是系統核心，Map（地圖）只是工具。**

系統以 Mission 為中心，串聯：

- Mission（任務）
- Route（路線）
- Vehicle（車輛）
- Monitoring（監控）
- Execution（執行）
- Report（報告）

---

## 2. Core Purpose（核心目的）

運輸戰略中心的目標，是提供一個以任務為核心的運輸任務規劃、資源配置、執行監控與任務檢討平台。

目前既有系統能力包含：

- CCTV（監視器）
- GPS（定位）
- Route Monitoring（路線監控）
- Vehicle / Convoy Dispatch（車隊與車輛派遣）
- Route Planning（路線規劃）
- Large Vehicle Routing（大型車路線規劃）
- Route Corridor（路線走廊查詢）
- CCTV Along Route（沿線監視器查詢）
- TV Wall（監控電視牆）

V2.0 的工作不是把這些功能彼此堆疊，而是將它們重新組織到 Mission Lifecycle（任務生命週期）中。

---

## 3. Mission-Oriented Principle（任務導向原則）

Mission（任務）是整個平台的核心語言與主要工作單位。

### Mission Template（任務範本）

保存可重複使用的任務規劃內容，例如：

- 任務資訊
- 路線
- Waypoint（路線節點）
- 車種
- 重要監視器

Mission Template 不是某一次實際執行的結果。

### Mission（任務）

Mission 代表一次經核准的任務決策。

Mission 建立後，即形成：

> **Approved Snapshot（核准快照）**

後續 Template（範本）、Route（路線）、Vehicle（車輛）或 Personnel（人員）的變更，不應自動改變已建立的 Mission。

### Mission Run（任務執行）

Mission Run 代表實際執行過程。

執行期間的 GPS、事件、即時 CCTV、道路狀況與其他動態資料屬於執行層，而不是原始 Mission 決策。

### Mission Report（任務報告）

Mission Report 用來保存與呈現任務完成後的結果，包含：

- 任務耗時
- 完成時間
- 行駛距離
- 任務紀錄
- Plan vs Actual（原始計畫與實際執行）的比較

---

## 4. Approved Snapshot Principle（核准快照原則）

Mission 保存的是：

> **Decision（使用者決策）**

而不是：

> **System Result（系統計算結果）**

Mission 不應保存即時查詢結果，例如：

- Route Corridor 查詢結果
- 沿線 CCTV 查詢結果
- GPS 即時位置
- 即時道路事件

Mission 可以保存使用者明確選定的決策，例如：

- Route
- Waypoint
- Vehicle Type
- Favorite Camera

---

## 5. Historical Integrity（歷史完整性）

已建立的 Mission 是歷史決策。

因此：

> **昨天建立的 Mission，不應因今天的 Template 或 Route 更新而改變。**

未來的變更應透過新的 Version（版本）、Mission Run 或 Event（事件）表達，而不是覆寫既有歷史決策。

---

## 6. Performance Principle（效能原則）

平台延續 V2.0 的效能導向架構：

- Browser（瀏覽器）不執行大型空間運算。
- Browser 不直接查詢完整 CCTV 資料。
- Navigation（導航）模式下，CCTV 查詢由 Backend（後端）決定。
- Viewport API 與 Route API 分離。
- 新增重型運算功能時，優先放在 Backend。
- Frontend 主要負責 UI、Render、Interaction。
- Backend 主要負責運算、資料查詢與路線相關服務。

---

## 7. Product Boundary（產品邊界）

目前核心範圍：

1. Mission Management（任務管理）
2. Route Management（路線管理）
3. Vehicle Management（車輛管理）
4. Monitoring Management（監控管理）
5. Identity Management（身分管理）
6. Mission Execution（任務執行）
7. Mission Report（任務報告）

未來可擴充但目前不提前實作的能力包含：

- Notification Management（通知管理）
- Traffic Management（交通管理）
- Incident Management（事件管理）
- AI Decision Support（AI 決策支援）

這些功能只保留清楚的 Extension Point（擴充點），不在目前階段提前設計完整 Domain 或 Database。

---

## 8. Product Success（產品成功標準）

V2.0 的目標不是單純「能導航」或「能顯示 CCTV」。

成功標準是：

> 使用者可以以 Mission 為核心完成任務的規劃、資源配置、執行、監控與事後檢討。

系統應逐步成為：

> **Mission Execution Platform（任務執行平台）**

而不是單純的地圖或監控工具。
