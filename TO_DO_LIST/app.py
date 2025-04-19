from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI()

# Configure CORS to allow requests from your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5502"],  # Default for VS Code Live Server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Todo(BaseModel):
    id: int = None  # ID is now optional for incoming POST requests
    title: str
    description: str = ""
    completed: bool = False

todos: List[Todo] = []
next_id = 1

@app.get("/todos/", response_model=List[Todo])
async def get_todos():
    return todos

@app.get("/todos/{todo_id}", response_model=Todo)
async def get_todo(todo_id: int):
    for todo in todos:
        if todo.id == todo_id:
            return todo
    raise HTTPException(status_code=404, detail="Todo not found")

@app.post("/todos/", response_model=Todo, status_code=201)
async def create_todo(todo: Todo):
    global next_id
    # Create a new Todo object with the generated ID
    new_todo = Todo(id=next_id, title=todo.title, description=todo.description, completed=todo.completed)
    todos.append(new_todo)
    next_id += 1
    return new_todo

@app.put("/todos/{todo_id}", response_model=Todo)
async def update_todo(todo_id: int, updated_todo: Todo):
    found = False
    for index, todo in enumerate(todos):
        if todo.id == todo_id:
            updated_todo.id = todo_id  # Ensure ID remains the same
            todos[index] = updated_todo
            found = True
            return updated_todo
    if not found:
        raise HTTPException(status_code=404, detail="Todo not found")

@app.delete("/todos/{todo_id}", status_code=204)
async def delete_todo(todo_id: int):
    initial_length = len(todos)
    todos[:] = [todo for todo in todos if todo.id != todo_id]
    if len(todos) == initial_length:
        raise HTTPException(status_code=404, detail="Todo not found")
    return