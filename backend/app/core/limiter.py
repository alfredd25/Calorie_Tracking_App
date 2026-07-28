"""
Shared rate-limiter instance.

Import `limiter` here instead of creating a new Limiter in every router.
The instance is registered on `app.state.limiter` in main.py so SlowAPI
can process rate-limit errors application-wide.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
