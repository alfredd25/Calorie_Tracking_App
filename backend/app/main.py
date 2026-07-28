import os

from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.api import auth, food, meal, user, weight, custom_food, custom_meal
from app.core.limiter import limiter
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

client_url = os.getenv("CLIENT_URL", "http://localhost:5173")

# Comma-separated list of CIDRs/IPs allowed to access internal monitoring routes.
# Defaults to localhost only. Set via METRICS_ALLOWED_IPS in the environment.
_metrics_allowed_ips: set[str] = set(
    filter(None, os.getenv("METRICS_ALLOWED_IPS", "127.0.0.1,::1").split(","))
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nutritracks.tech",
        "https://www.nutritracks.tech",
        "http://localhost:3000",
        "http://localhost:5173",
        client_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")
app.include_router(food.router)
app.include_router(meal.router)
app.include_router(user.router, prefix="/users", tags=["users"])
app.include_router(weight.router, prefix="/weight", tags=["weight"])
app.include_router(custom_food.router)
app.include_router(custom_meal.router)

# Instrument but do not expose the /metrics endpoint automatically;
# we expose it manually so we can restrict access to internal callers only.
instrumentator = Instrumentator().instrument(app)


@app.get("/metrics", include_in_schema=False)
async def metrics(request: Request) -> Response:
    client_ip = request.client.host if request.client else ""
    if client_ip not in _metrics_allowed_ips:
        return Response(status_code=status.HTTP_403_FORBIDDEN)
    from prometheus_client import CONTENT_TYPE_LATEST, generate_latest  # noqa: PLC0415
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

