from typing import Dict, Optional
from fastapi import Request
import requests
import os


def extract_user_agent_info(user_agent: str) -> Dict[str, Optional[str]]:
    """Extract device, browser, and OS from User-Agent string."""
    device = None
    browser = None
    os_name = None

    user_agent_lower = user_agent.lower()

    # Device detection
    if "mobile" in user_agent_lower or "android" in user_agent_lower or "iphone" in user_agent_lower:
        device = "Mobile"
    elif "tablet" in user_agent_lower or "ipad" in user_agent_lower:
        device = "Tablet"
    else:
        device = "Desktop"

    # Browser detection
    if "chrome" in user_agent_lower and "edg" not in user_agent_lower:
        browser = "Chrome"
    elif "firefox" in user_agent_lower:
        browser = "Firefox"
    elif "safari" in user_agent_lower and "chrome" not in user_agent_lower:
        browser = "Safari"
    elif "edg" in user_agent_lower:
        browser = "Edge"
    elif "opera" in user_agent_lower:
        browser = "Opera"

    # OS detection
    if "windows" in user_agent_lower:
        os_name = "Windows"
    elif "mac" in user_agent_lower or "darwin" in user_agent_lower:
        os_name = "macOS"
    elif "linux" in user_agent_lower:
        os_name = "Linux"
    elif "android" in user_agent_lower:
        os_name = "Android"
    elif "ios" in user_agent_lower or "iphone" in user_agent_lower or "ipad" in user_agent_lower:
        os_name = "iOS"

    return {
        "device": device,
        "browser": browser or "Unknown",
        "os": os_name or "Unknown"
    }


def get_ip_address(request: Request) -> str:
    """Extract IP address from request."""
    # Check for forwarded IP (proxy/load balancer)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    return request.client.host if request.client else "unknown"


def get_location_from_ip(ip_address: str) -> Optional[str]:
    """Get location from IP address using free geolocation API."""
    # Skip localhost/private IPs
    if ip_address in ["127.0.0.1", "localhost", "unknown"] or ip_address.startswith("192.168.") or ip_address.startswith("10."):
        return "Local"
    
    try:
        # Using ip-api.com (free, no API key required for basic usage)
        response = requests.get(f"http://ip-api.com/json/{ip_address}", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                return data.get("country", "Unknown")
    except Exception:
        pass
    
    return "Unknown"


def extract_metadata(request: Request) -> Dict[str, str]:
    """Extract all metadata from request."""
    ip_address = get_ip_address(request)
    user_agent = request.headers.get("User-Agent", "Unknown")
    
    ua_info = extract_user_agent_info(user_agent)
    location = get_location_from_ip(ip_address)
    
    return {
        "ip_address": ip_address,
        "device": ua_info["device"],
        "browser": ua_info["browser"],
        "os": ua_info["os"],
        "location": location
    }
