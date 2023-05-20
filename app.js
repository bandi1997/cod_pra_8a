const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority != undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

// API1
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}'
            AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%';`;
      break;
  }
  data = await database.all(getTodosQuery);
  response.send(data);
});

// API2
app.get("/todos/:todoId/", async (request, response) => {
  let { todoId } = request.params;
  let getTodoQuery = `
    SELECT 
      * 
    FROM 
      todo
    WHERE 
      id = ${todoId};`;
  let result = await database.get(getTodoQuery);
  response.send(result);
});

//API3
app.post("/todos/", async (request, response) => {
  const { todo, priority, status } = request.body;
  const postTodoQuery = `
  INSERT INTO
    todo (todo, priority, status)
  VALUES
    ('${todo}', '${priority}', '${status}');`;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//API4
app.put("/todos/:todoId/", async (request, response) => {
  let { todoId } = request.params;
  let updateVal = "";
  let text = "";
  let updateTodoQuery = "";
  let requestBody = request.body;

  let previousTodoQuery = `
    SELECT
        *
    FROM
        todo
    WHERE
        id = ${todoId};`;

  let previousTodo = await database.get(previousTodoQuery);

  todo1 = previousTodo.todo;
  status1 = previousTodo.status;
  priority1 = previousTodo.priority;

  switch (true) {
    case requestBody.status != undefined:
      updateVal = requestBody.status;
      text = "Status";

      updateTodoQuery = `
        UPDATE
            todo
        SET
            todo = '${todo1}',
            status = '${updateVal}',
            priority = '${priority1}'
        WHERE
           id = ${todoId};`;
      await database.run(updateTodoQuery);
      response.send(`${text} Updated`);
      break;
    case requestBody.priority != undefined:
      updateVal = requestBody.priority;
      text = "Priority";

      updateTodoQuery = `
        UPDATE
            todo
        SET
            todo = '${todo1}',
            status = '${status1}',
            priority = '${updateVal}'
        WHERE
           todo_id = ${todoId};`;
      await database.run(updateTodoQuery);
      response.send(`${text} Updated`);
      break;
    case requestBody.todo != undefined:
      updateVal = requestBody.priority;
      text = "Todo";

      updateTodoQuery = `
        UPDATE
            todo
        SET
            todo = '${updateVal}',
            status = '${status1}',
            priority = '${priority1}'
        WHERE
           id = ${todoId};`;
      await database.run(updateTodoQuery);
      response.send(`${text} Updated`);
      break;
  }
});

//API5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
