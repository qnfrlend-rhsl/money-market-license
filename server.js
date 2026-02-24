const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

// 정적 파일 제공
app.use(express.static(path.join(__dirname, "public")));

// PostgreSQL 연결
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// 서버 테스트
app.get("/api-test", (req,res) => res.send("Server OK"));

// DB 테스트
app.get("/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.send("DB OK: " + result.rows[0].now);
    } catch (err) {
        console.error(err);
        res.status(500).send("DB FAIL");
    }
});

// ✅ 라이선스 발급 API (관리자)
app.post("/admin/create-license", async (req, res) => {
    const { owner } = req.body;
    if(!owner) return res.status(400).json({ error: "owner required" });

    // 랜덤 키 생성
    const key = crypto.randomBytes(16).toString("hex");

    try {
        await pool.query(
            "INSERT INTO licenses (key, owner) VALUES ($1, $2)",
            [key, owner]
        );
        res.json({ success: true, key, owner });
    } catch(err) {
        console.error(err);
        res.status(500).json({ success:false });
    }
});

// ✅ 이름으로 라이선스 조회 API (관리자/사용자용)
app.post("/admin/find-license", async (req, res) => {
    const { owner } = req.body;
    if(!owner) return res.status(400).json({ error: "owner required" });

    try {
        const result = await pool.query(
            "SELECT * FROM licenses WHERE owner=$1",
            [owner]
        );
        if(result.rows.length > 0){
            res.json({ success: true, licenses: result.rows });
        } else {
            res.json({ success: false, licenses: [] });
        }
    } catch(err){
        console.error(err);
        res.status(500).json({ success: false });
    }
});

// ✅ 라이선스 키 검증 API
app.post("/verify-license", async (req,res) => {
    const { key } = req.body;

    try {
        const result = await pool.query(
            "SELECT * FROM licenses WHERE key=$1",
            [key]
        );
        if(result.rows.length > 0){
            res.json({ valid:true, owner: result.rows[0].owner });
        } else {
            res.json({ valid:false });
        }
    } catch(err) {
        console.error(err);
        res.status(500).json({ valid:false });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));