"""Re-authenticate MSAL token for Teams Graph API using device code flow."""
import sys
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

flow = app.initiate_device_flow(scopes=SCOPES)
if "user_code" not in flow:
    print(f"FAILED to initiate device flow: {flow}", flush=True)
    sys.exit(1)

# Write the code to a file so it can be read
code_file = Path.home() / "Code" / "Claude-01" / "scripts" / "msal-device-code.txt"
code_file.write_text(flow["message"])

print(flow["message"], flush=True)
print(flush=True)
print("Waiting for you to complete sign-in...", flush=True)

result = app.acquire_token_by_device_flow(flow)
if result.get("access_token"):
    CACHE_FILE.write_text(cache.serialize())
    print("OK - Token refreshed and saved", flush=True)
else:
    print(f"FAILED: {result.get('error_description', result)}", flush=True)
