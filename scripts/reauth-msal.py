"""Re-authenticate MSAL token for Teams Graph API using device code flow."""
import msal
from pathlib import Path

TENANT_ID = "56b24b68-e3c8-4895-89a0-05a74d0f8c84"
CLIENT_ID = "14d82eec-204b-4c2f-b7e8-296a70dab67e"
CACHE_FILE = Path.home() / ".email_ingest" / "vituity_token_cache.json"
SCOPES = ["Group.ReadWrite.All", "ChannelMessage.Send"]

cache = msal.SerializableTokenCache()
cache.deserialize(CACHE_FILE.read_text())

app = msal.PublicClientApplication(
    CLIENT_ID,
    authority=f"https://login.microsoftonline.com/{TENANT_ID}",
    token_cache=cache,
)

# Use device code flow - no browser redirect needed
flow = app.initiate_device_flow(scopes=SCOPES)
if "user_code" not in flow:
    print(f"FAILED to initiate device flow: {flow}")
    exit(1)

print(flow["message"])
print()
print("Waiting for you to complete sign-in...")

result = app.acquire_token_by_device_flow(flow)
if result.get("access_token"):
    CACHE_FILE.write_text(cache.serialize())
    print("OK - Token refreshed and saved")
else:
    print(f"FAILED: {result.get('error_description', result)}")
