const express = require("express");
const mysql = require('mysql2');
const cors = require('cors');
const compression = require('compression');

const app = express();
app.use(compression({
    threshold: 0, // compress responses of all sizes
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            // don't compress responses with this request header
            return false;
        }
        // fallback to standard filter function
        return compression.filter(req, res);
    }
}));
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
            return res.status(500).json("ERROR!");
        }
        if(data.length > 0){
            const uid = data[0].id;
            console.log(uid);
            return res.status(200).json({status:"success", uid})
        }
        else{
            console.error(err);
            return res.status(401).json("failed")
        }
        
    })
})

app.post('/create-budget', (req, res) => {
    const query = "INSERT INTO budget (`budget_category`, `amount`, `user_id`) VALUES (?, ?, ?)";
    const values = [
        req.body.budgetCategory,
        req.body.amount,
        req.body.user_id,
    ];

    database.query(query, values, (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error adding expense" });
        }
        return res.json(data);
    });
});




app.get('/show-budget', async (req, res) => {
    const user_id = req.query.user_id;
    try {
        // Fetch budget data from the budget table
        const query = "SELECT * FROM budget WHERE user_id = ?";
        const budgetData = await database.promise().query(query,[user_id]);
        return res.json(budgetData[0]);
    } catch (error) {
        console.error('Error fetching budget data:', error.message);
        return res.status(500).json({ error: "Error fetching budget data" });
    }
});



app.post('/add-expense', (req, res) => {
    // const user_id = req.query.user_id;
    const {user_id,expense_category, amount, budgetid } = req.body;

    // Fetch budget_id based on the expense_category
    const getBudgetIdQuery = "SELECT id FROM budget WHERE budget_category = ? AND user_id =?";
    database.query(getBudgetIdQuery, [expense_category, user_id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error fetching budget_id" });
        }

        const budget_id = result.length > 0 ? result[0].id : null;

        // Insert the expense into the monthly_expense table
        const insertExpenseQuery = "INSERT INTO monthly_expense (`user_id`, `budget_id`, `expense_category`, `total_amount`, `budgetid`) VALUES (?, ?, ?, ?,?)";
        const values = [user_id, budget_id, expense_category, amount, budgetid];

        database.query(insertExpenseQuery, values, (err, data) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error adding expense" });
            }
            return res.json(data);
        });
    });
});


app.get('/category-wise-budget', (req, res) => {
    const query = "SELECT budget_category AS category, SUM(amount) AS amount FROM budget GROUP BY budget_category";
    
    database.query(query, (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error fetching category-wise budget" });
        }
        return res.json(data);
    });
});

app.get('/category-wise-expense', (req, res) => {
    const query = "SELECT expense_category AS category, SUM(total_amount) AS amount FROM monthly_expense GROUP BY expense_category";
    
    database.query(query, (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error fetching category-wise expense" });
        }
        return res.json(data);
    });
});

app.get('/total-budget-expense', (req, res) => {
    const budgetQuery = "SELECT SUM(amount) AS totalBudget FROM budget";
    const expenseQuery = "SELECT SUM(total_amount) AS totalExpense FROM monthly_expense";
    
    database.query(budgetQuery, (err, budgetData) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error fetching total budget" });
        }

        database.query(expenseQuery, (err, expenseData) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error fetching total expense" });
            }

            return res.json({
                totalBudget: budgetData[0].totalBudget || 0,
                totalExpense: expenseData[0].totalExpense || 0,
            });
        });
    });
});

  
//   API endpoint to get category-wise budget and expense data based on matching ids
app.get('/category-wise-data', async (req, res) => {
    try {
      const query = `
      SELECT b.id AS budget_id,me.budgetid as exp_id, b.budget_category AS category, b.amount AS budget_amount, me.total_amount AS expense_amount
      FROM budget b
      INNER JOIN monthly_expense me ON b.id = me.budgetid
      
      `;
      const data = await database.promise().query(query);
    console.log(data)
      return res.json(data[0]);
    } catch (error) {
      console.error('Error fetching category-wise data:', error.message);
      return res.status(500).json({ error: "Error fetching category-wise data" });
    }
});

// app.get('/category-wise-data', async (req, res) => {
//     try {
//       const query = `
//       SELECT 
//         b.budget_category AS category, 
//         SUM(b.amount) AS total_budget, 
//         COALESCE(SUM(me.total_amount), 0) AS total_expense
//       FROM 
//         budget b
//       LEFT JOIN 
//         monthly_expense me ON b.id = me.budgetid
//       GROUP BY 
//         b.budget_category
//       `;
//       const data = await database.promise().query(query);
  
//       return res.json(data[0]);
//     } catch (error) {
//       console.error('Error fetching category-wise data:', error.message);
//       return res.status(500).json({ error: "Error fetching category-wise data" });
//     }
//   });
// app.get('/category-wise-data', async (req, res) => {
//     try {
//       const query = `
//       SELECT 
//       b.id AS budget_id, 
//       b.budget_category AS category, 
//       b.amount AS budget_amount, 
//       COALESCE(SUM(me.total_amount), 0) AS expense_amount
//     FROM budget b
//   LEFT JOIN monthly_expense me 
//       ON b.id = me.budget_id AND b.user_id = me.user_id
//   GROUP BY 
//       b.id, 
//       b.budget_category, 
//       b.amount

//       `;
//       // You would get the user_id from the request, e.g., req.params.user_id or req.query.user_id
//       const userId = req.query.user_id; // or however you get the user's ID
//       const data = await database.promise().query(query, [userId]);
  
//       return res.json(data[0]);
//     } catch (error) {
//       console.error('Error fetching category-wise data:', error.message);
//       return res.status(500).json({ error: "Error fetching category-wise data" });
//     }
//   });
  

app.get('/get-budget-id', async(req, res) => {
    const category = req.query.category;
  
    if (!category) {
      return res.status(400).json({ error: 'Category parameter is required' });
    }
  
    try {
        const query = "SELECT id FROM budget WHERE budget_category = ?";
        const result = await database.promise().query(query, [category]);
        
        if (result[0].length > 0) {
            const budgetId = result[0][0].id;
            return res.json({ id: budgetId });
        } else {
            return res.status(404).json({ error: 'Category not found' });
        }

    } catch (error) {
      console.error('Error fetching budget id:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
});
  

app.listen(8081, ()=>{
    console.log("Connected to database.")
})