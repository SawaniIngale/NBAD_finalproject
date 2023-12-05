const express = require("express");
const mysql = require('mysql2');
const cors = require('cors');

// Assuming you store the token in localStorage


const app = express();
app.use(cors());
app.use(express.json());

const database = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Admin24$$",
    database: "personal_budget"
})



app.post('/signup',(req,res)=>{
    const query = "INSERT INTO user (`name`,`email`,`password`) VALUES (?)";
    const values = [
        req.body.name,
        req.body.email,
        req.body.password
    ]
    database.query(query,[values],(err,data)=>{
        if(err){
            console.error(err);
            return res.status(500).json({error:"ERROR!"});
        }
        return res.json(data);
    })

})


app.post('/login',(req,res)=>{
    console.log("Login request received")
    const query = "SELECT * FROM user WHERE email = ? AND password = ?";
    const values = [
        req.body.email,
        req.body.password
    ]
    database.query(query,values,(err,data)=>{
        if(err){
            console.error(err);
            return res.json("ERROR!");
        }
        if(data.length > 0){
            return res.json("success")
        }
        else{
            console.error(err);
            return res.json("failed")
        }
        
    })
    

})

app.post('/create-budget', (req, res) => {
    const query = "INSERT INTO budget (`budget_category`, `amount`) VALUES (?, ?)";
    const values = [
        req.body.budgetCategory,
        req.body.amount,
    ];

    database.query(query, values, (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error adding expense" });
        }
        return res.json(data);
    });
});

// app.get('/show-budget', (req, res) => {
//     const user_id = req.user.id; // Get user ID from the decoded token
//     const query = "SELECT * FROM expenses WHERE user_id = ?";
    
//     database.query(query, [user_id], (err, data) => {
//         if (err) {
//             console.error(err);
//             return res.status(500).json({ error: "Error fetching expenses" });
//         }
//         return res.json(data);
//     });
// });

app.get('/show-budget', (req, res) => {
    // Fetch budget categories from the budget table
    const query = "SELECT * FROM budget";
    
    database.query(query, (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error fetching budget categories" });
        }
        return res.json(data);
    });
});

app.post('/add-expense', (req, res) => {
    const { user_id, expense_category, amount } = req.body;
    
    // Insert the expense into the monthly_expense table
    const query = "INSERT INTO monthly_expense (`user_id`, `expense_category`, `total_amount`) VALUES (?, ?, ?)";
    const values = [user_id, expense_category, amount];

    database.query(query, values, (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error adding expense" });
        }
        return res.json(data);
    });
});



app.listen(8081, ()=>{
    console.log("Connected to database.")
})