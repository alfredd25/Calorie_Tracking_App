from fastapi import FastAPI

app = FastAPI(title="Calorie Tracker API")

@app.get("/health")
def health():
    return {"status": "ok"}