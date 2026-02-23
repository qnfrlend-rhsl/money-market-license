const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// 정적 파일 제공
app.use(express.static(path.join(__dirname, "public")));

// Postgres 연결
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// 테스트 API
app.get("/api-test", (req,res)=> res.send("Server OK"));

// 라이선스 인증 API
app.post("/verify-license", async (req,res)=>{
    const { key } = req.body;
    try{
        const result = await pool.query("SELECT * FROM licenses WHERE key=$1", [key]);
        if(result.rows.length > 0){
            res.json({ valid:true, owner: result.rows[0].owner });
        }else{
            res.json({ valid:false });
        }
    }catch(err){
        console.error(err);
        res.status(500).json({ valid:false });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));