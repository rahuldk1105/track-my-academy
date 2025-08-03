#!/usr/bin/env python3
"""
Production entry point for Track My Academy backend.
This file is specifically designed for deployment on Render.
"""

import os
import uvicorn
from server import app

if __name__ == "__main__":
    # Get port from environment variable (Render provides this)
    port = int(os.environ.get("PORT", 8001))
    
    # Run the server
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info",
        access_log=True
    )