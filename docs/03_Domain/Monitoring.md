# Monitoring Domain（監控領域）

- Version（版本）：2.0
- Status（狀態）：Approved（已核定）
- Last Updated（最後更新）：2026-08-08

## 1. Responsibility（職責）

Monitoring 負責：

- Camera Discovery（監視器查詢）
- Route Corridor Monitoring（路線走廊監控）
- Camera Popup（監視器資訊）
- Favorite Camera（重要監視器）
- TV Wall（監控電視牆）
- Monitor Interaction（監控互動）

## 2. Not Responsible（非職責）

Monitoring 不負責：

- Mission Lifecycle
- Vehicle Ownership
- Route Ownership
- User Authentication
- GPS Position Calculation

## 3. Core Flow（核心流程）

```text
Route
 ↓
Route Corridor Query
 ↓
Camera Marker
 ↓
Camera Popup
 ↓
Drag
 ↓
TV Wall
```

拖曳到 TV Wall 是目前 V2 核心特色。

## 4. Camera Ownership（監視器所有權）

Camera 是 Shared Data（共用資料）。

不要建立：

- MissionCamera
- RouteCamera

作為 Mission 的固定子資料。

## 5. Favorite Camera（重要監視器）

Mission 可保存使用者主動選定的：

> Favorite Camera

Mission Run 重新進行 Corridor Query。

如果沿線新增監視器：

> 新監視器自然可以出現。

Favorite Camera：

> 重新匹配並標記。

## 6. Performance（效能）

既有架構採 Viewport Query（視窗查詢）與 Route Query（路線查詢）分離。

Frontend 不直接取得全部 Camera。

Backend 負責空間過濾。

## 7. Business Rules（業務規則）

### MON-001
Camera 是共用資料。

### MON-002
Mission 不保存 Route Camera Query Result。

### MON-003
Favorite Camera 是使用者決策，可保存。

### MON-004
TV Wall 是 Monitoring 的操作能力。

### MON-005
大型 CCTV 查詢與空間運算由 Backend 處理。
