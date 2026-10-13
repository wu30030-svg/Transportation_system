
'use strict';

const pool = require('./config/db');
const bcrypt = require('bcrypt');
const readline = require('readline');

const ROUTES = {
    A: '營區開放_A路線',
    B: '營區開放_B路線',
    C: '營區開放_C路線',
    D: '營區開放_D路線',
    E: '營區開放_E路線',
};

function getContext(number) {
    if (number <= 10) return ROUTES.A;
    if (number <= 60) return ROUTES.B;
    if (number <= 110) return ROUTES.C;
    if (number <= 125) return ROUTES.D;
    return ROUTES.E;
}

function promptHiddenPassword() {
    return new Promise((resolve, reject) => {
        if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
            reject(new Error('請在可互動的終端機執行，才能安全輸入初始密碼。'));
            return;
        }

        process.stdout.write('請輸入四個新帳號共用的初始密碼：');

        let password = '';

        const finish = (error) => {
            process.stdin.removeListener('data', onData);
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdout.write('\n');

            if (error) reject(error);
            else resolve(password);
        };

        const onData = (buffer) => {
            const input = buffer.toString('utf8');

            if (input === '\u0003') {
                finish(new Error('使用者取消操作。'));
                return;
            }

            if (input === '\r' || input === '\n') {
                finish();
                return;
            }

            if (input === '\u007f' || input === '\b') {
                password = password.slice(0, -1);
                return;
            }

            if (!/[\u0000-\u001f]/.test(input)) {
                password += input;
            }
        };

        process.stdin.on('data', onData);
        process.stdin.setRawMode(true);
        process.stdin.resume();
    });
}

async function main() {
    const client = await pool.connect();
    let transactionStarted = false;

    try {
        console.log('開始檢查接駁車帳號與資料……');

        // 密碼由終端機隱藏輸入，不寫入腳本或資料庫明文欄位。
        const initialPassword = await promptHiddenPassword();

        if (initialPassword.length < 8) {
            throw new Error('初始密碼至少需要 8 個字元。');
        }

        await client.query('BEGIN');
        transactionStarted = true;

        // 防止兩次執行同時修改資料。
        await client.query(
            'LOCK TABLE users, personnel, vehicles IN SHARE ROW EXCLUSIVE MODE'
        );

        // 確認角色 4、6 均存在。
        const roles = await client.query(
            'SELECT role_id FROM roles WHERE role_id IN (4, 6)'
        );

        if (roles.rowCount !== 2) {
            throw new Error('找不到必要的角色 4（駕駛）或角色 6（監控）。');
        }

        // 驗證既有 150 個標準駕駛帳號與人員編號完整且相符。
        const expectedUsernames = Array.from(
            { length: 150 },
            (_, index) => `shuttle_test_${String(index + 1).padStart(3, '0')}`
        );

        const existingDrivers = await client.query(
            `SELECT
                u.id,
                u.username,
                u.role_id,
                p.personnel_number
             FROM users u
             LEFT JOIN personnel p ON p.user_id = u.id
             WHERE u.username = ANY($1::varchar[])`,
            [expectedUsernames]
        );

        if (existingDrivers.rowCount !== 150) {
            throw new Error(
                `標準駕駛帳號應有 150 個，實際找到 ${existingDrivers.rowCount} 個；未修改資料。`
            );
        }

        const driverByUsername = new Map(
            existingDrivers.rows.map(row => [row.username, row])
        );

        for (let number = 1; number <= 150; number++) {
            const username =
                `shuttle_test_${String(number).padStart(3, '0')}`;

            const row = driverByUsername.get(username);
            const expectedPersonnel =
                `SHUTTLE-${String(number).padStart(3, '0')}`;

            if (
                !row ||
                Number(row.role_id) !== 4 ||
                row.personnel_number !== expectedPersonnel
            ) {
                throw new Error(
                    `${username} 的角色或人員編號不符，未修改資料。`
                );
            }
        }

        // 新帳號、人員編號必須不存在，避免覆蓋既有資料。
        const newUsernames = [
            'shuttle_test_151',
            'shuttle_test_152',
            'shuttle_monitor_d',
            'shuttle_monitor_e',
        ];

        const usernameCheck = await client.query(
            'SELECT username FROM users WHERE username = ANY($1::varchar[])',
            [newUsernames]
        );

        if (usernameCheck.rowCount > 0) {
            throw new Error(
                `以下帳號已存在：${usernameCheck.rows.map(r => r.username).join(', ')}。未修改資料。`
            );
        }

        const newPersonnelNumbers = ['SHUTTLE-151', 'SHUTTLE-152'];

        const personnelCheck = await client.query(
            `SELECT personnel_number
             FROM personnel
             WHERE personnel_number = ANY($1::varchar[])`,
            [newPersonnelNumbers]
        );

        if (personnelCheck.rowCount > 0) {
            throw new Error(
                `以下人員編號已存在：${personnelCheck.rows.map(r => r.personnel_number).join(', ')}。未修改資料。`
            );
        }

        // 車輛若已存在，只接受 SHUTTLE 類型；不覆寫既有車輛。
        const vehicleCheck = await client.query(
            `SELECT vehicle_number, vehicle_type
             FROM vehicles
             WHERE vehicle_number = ANY($1::varchar[])`,
            [newPersonnelNumbers]
        );

        for (const vehicle of vehicleCheck.rows) {
            if (vehicle.vehicle_type !== 'SHUTTLE') {
                throw new Error(
                    `${vehicle.vehicle_number} 已存在，但類型不是 SHUTTLE；未修改資料。`
                );
            }
        }

        const passwordHash = await bcrypt.hash(initialPassword, 12);

        // 重新分配既有 150 名標準駕駛，只修改 access_context。
        for (let number = 1; number <= 150; number++) {
            const username =
                `shuttle_test_${String(number).padStart(3, '0')}`;

            const row = driverByUsername.get(username);

            const result = await client.query(
                `UPDATE users
                 SET access_context = $1
                 WHERE id = $2`,
                [getContext(number), row.id]
            );

            if (result.rowCount !== 1) {
                throw new Error(`${username} 工作區更新失敗。`);
            }
        }

        // 建立兩名新駕駛及其人員資料。
        for (const number of [151, 152]) {
            const suffix = String(number).padStart(3, '0');
            const username = `shuttle_test_${suffix}`;
            const displayName = `接駁測試人員${suffix}`;

            const userResult = await client.query(
                `INSERT INTO users
                    (username, password_hash, name, role_id,
                     is_active, access_context, remark)
                 VALUES ($1, $2, $3, 4, TRUE, $4, $5)
                 RETURNING id`,
                [
                    username,
                    passwordHash,
                    displayName,
                    ROUTES.E,
                    'Shuttle Center E 路線駕駛',
                ]
            );

            const userId = userResult.rows[0].id;

            const personnelResult = await client.query(
                `INSERT INTO personnel
                    (personnel_number, name, status, user_id)
                 VALUES ($1, $2, 'ACTIVE', $3)
                 RETURNING id`,
                [`SHUTTLE-${suffix}`, displayName, userId]
            );

            // 若同編號車輛已存在且類型正確，保留原紀錄。
            await client.query(
                `INSERT INTO vehicles
                    (vehicle_number, vehicle_type, status)
                 VALUES ($1, 'SHUTTLE', 'AVAILABLE')
                 ON CONFLICT (vehicle_number) DO NOTHING`,
                [`SHUTTLE-${suffix}`]
            );

            if (!personnelResult.rows[0].id) {
                throw new Error(`${username} 人員資料建立失敗。`);
            }
        }

        // 建立 D、E 監控帳號，各自只配置到自己的工作區。
        const monitors = [
            {
                username: 'shuttle_monitor_d',
                name: 'D路線監控員',
                context: ROUTES.D,
                remark: 'Shuttle Center D 路線監控',
            },
            {
                username: 'shuttle_monitor_e',
                name: 'E路線監控員',
                context: ROUTES.E,
                remark: 'Shuttle Center E 路線監控',
            },
        ];

        for (const monitor of monitors) {
            await client.query(
                `INSERT INTO users
                    (username, password_hash, name, role_id,
                     is_active, access_context, remark)
                 VALUES ($1, $2, $3, 6, TRUE, $4, $5)`,
                [
                    monitor.username,
                    passwordHash,
                    monitor.name,
                    monitor.context,
                    monitor.remark,
                ]
            );
        }

        // 驗證 152 名標準駕駛在各工作區的實際數量。
        const expectedCounts = {
            [ROUTES.A]: 10,
            [ROUTES.B]: 50,
            [ROUTES.C]: 50,
            [ROUTES.D]: 15,
            [ROUTES.E]: 27,
        };

        const countResult = await client.query(
            `SELECT access_context, COUNT(*)::int AS total
             FROM users
             WHERE role_id = 4
               AND username LIKE 'shuttle_test_%'
               AND username <> 'shuttle_test'
             GROUP BY access_context`
        );

        const actualCounts = new Map(
            countResult.rows.map(row => [row.access_context, row.total])
        );

        for (const [context, expected] of Object.entries(expectedCounts)) {
            if ((actualCounts.get(context) || 0) !== expected) {
                throw new Error(
                    `工作區 ${context} 人數驗證失敗；預期 ${expected}，實際 ${actualCounts.get(context) || 0}。`
                );
            }
        }

        const monitorCheck = await client.query(
            `SELECT username, role_id, access_context
             FROM users
             WHERE username IN ('shuttle_monitor_d', 'shuttle_monitor_e')
             ORDER BY username`
        );

        if (
            monitorCheck.rowCount !== 2 ||
            !monitorCheck.rows.some(
                row => row.username === 'shuttle_monitor_d' &&
                    Number(row.role_id) === 6 &&
                    row.access_context === ROUTES.D
            ) ||
            !monitorCheck.rows.some(
                row => row.username === 'shuttle_monitor_e' &&
                    Number(row.role_id) === 6 &&
                    row.access_context === ROUTES.E
            )
        ) {
            throw new Error('D/E 監控帳號驗證失敗。');
        }

        await client.query('COMMIT');
        transactionStarted = false;

        console.log('\n資料庫異動成功，已完成 COMMIT。');
        console.table(
            Object.entries(expectedCounts).map(([route, total]) => ({
                工作區: route,
                標準駕駛人數: total,
            }))
        );
        console.log('新增駕駛：shuttle_test_151、shuttle_test_152');
        console.log('新增監控：shuttle_monitor_d、shuttle_monitor_e');
        console.log('初始密碼已使用 bcrypt 雜湊儲存。');
        console.log('未修改一般帳號、shuttle_test 或 shuttle_monitor_a2。');
    } catch (error) {
        if (transactionStarted) {
            await client.query('ROLLBACK');
        }

        console.error('\n異動失敗，交易已回滾。');
        console.error('完整資料庫錯誤：', error);
        console.error('錯誤代碼：', error.code);
        console.error('資料表：', error.table);
        console.error('違反約束：', error.constraint);
        console.error('詳細原因：', error.detail);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(error => {
    console.error('腳本啟動失敗：', error.message);
    process.exitCode = 1;
});
