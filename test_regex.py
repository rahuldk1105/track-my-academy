#!/usr/bin/env python3
"""
Test the regex pattern locally to verify it's correct
"""

import re

# The regex pattern from the backend
pattern = r"https://.*\.vercel\.app"

test_origins = [
    "https://track-my-academy.vercel.app",
    "https://some-other.vercel.app", 
    "https://test-app.vercel.app",
    "https://my-app.vercel.app",
    "https://a.vercel.app",
    "https://123.vercel.app",
    "https://vercel.app",  # Edge case
    "https://malicious-site.com",
    "https://fake-vercel.app.malicious.com",
]

print("🔍 REGEX PATTERN TESTING")
print("=" * 50)
print(f"Pattern: {pattern}")
print("=" * 50)

compiled_pattern = re.compile(pattern)

for origin in test_origins:
    match = compiled_pattern.match(origin)
    result = "✅ MATCH" if match else "❌ NO MATCH"
    print(f"{origin:<40} {result}")

print("\n🔍 TESTING WITH FULLMATCH (more strict)")
print("=" * 50)

for origin in test_origins:
    match = compiled_pattern.fullmatch(origin)
    result = "✅ MATCH" if match else "❌ NO MATCH"
    print(f"{origin:<40} {result}")